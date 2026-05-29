// Skipper authentication.
//
// Boaters register an account (name + email + passcode) and then log in with
// their email + passcode. Passcodes are NEVER stored: each account keeps a
// random per-account salt and a PBKDF2/SHA-256 derived hash (Web Crypto), and
// login re-derives and compares in constant time. Failed logins are throttled
// with a lockout, errors are deliberately generic to avoid revealing which
// emails are registered, and sessions expire so a shared device doesn't stay
// signed in forever.
//
// SECURITY BOUNDARY: this hardens the *client* sign-in, but everything still
// lives in localStorage on the device. A determined local attacker can read
// the stored hashes (and attempt an offline brute force — PBKDF2 with a high
// iteration count is what slows that down) or edit a plan's ownerId directly.
// Real multi-user privacy requires server-side authentication and ownership
// checks; this module is the client half of that contract.

const ACCOUNTS_KEY = 'floatplan.accounts.v1'
const SESSION_KEY = 'floatplan.session.v1'

// Tunables.
const PBKDF2_ITERATIONS = 150_000
const SALT_BYTES = 16
const HASH_BITS = 256
export const MIN_PASSCODE_LENGTH = 8
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 30 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

const subscribers = new Set()

function notify() {
  subscribers.forEach((fn) => fn())
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readAccounts() {
  return readJSON(ACCOUNTS_KEY) || {}
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

// ---- crypto helpers ----------------------------------------------------

function bytesToBase64(bytes) {
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin)
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function derivePasscodeHash(passcode, saltBytes, iterations) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BITS,
  )
  return bytesToBase64(new Uint8Array(bits))
}

// Constant-time string comparison to avoid leaking match progress via timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length)
    return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

// A typed error so the UI can react without parsing message strings.
class AuthError extends Error {
  constructor(code, message, meta = {}) {
    super(message)
    this.code = code
    Object.assign(this, meta)
  }
}

// ---- session -----------------------------------------------------------

function createSession(account) {
  const session = {
    id: account.id,
    name: account.name,
    email: account.email,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getCurrentUser() {
  const session = readJSON(SESSION_KEY)
  if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
    if (session) localStorage.removeItem(SESSION_KEY) // drop expired/legacy
    return null
  }
  return session
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  notify()
}

// ---- register / login --------------------------------------------------

export async function register({ name, email, passcode }) {
  const cleanName = name.trim()
  const id = normalizeEmail(email)
  if (!cleanName) throw new AuthError('name', 'Enter your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id))
    throw new AuthError('email', 'Enter a valid email address.')
  if (!passcode || passcode.length < MIN_PASSCODE_LENGTH)
    throw new AuthError(
      'passcode',
      `Passcode must be at least ${MIN_PASSCODE_LENGTH} characters.`,
    )

  const accounts = readAccounts()
  if (accounts[id])
    throw new AuthError(
      'exists',
      'An account with that email already exists — sign in instead.',
    )

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derivePasscodeHash(passcode, salt, PBKDF2_ITERATIONS)
  accounts[id] = {
    id,
    name: cleanName,
    email: email.trim(),
    salt: bytesToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    hash,
    createdAt: new Date().toISOString(),
    failedAttempts: 0,
    lockedUntil: 0,
  }
  writeAccounts(accounts)
  const session = createSession(accounts[id])
  notify()
  return session
}

export async function login({ email, passcode }) {
  const id = normalizeEmail(email)
  const accounts = readAccounts()
  const account = accounts[id]

  // Lockout check first (applies even if the email is unknown is not possible,
  // since lockout state lives on the account; unknown emails fall through to
  // the generic invalid-credentials path below).
  if (account && account.lockedUntil && account.lockedUntil > Date.now()) {
    const seconds = Math.ceil((account.lockedUntil - Date.now()) / 1000)
    throw new AuthError(
      'locked',
      `Too many attempts. Try again in ${seconds}s.`,
      { seconds },
    )
  }

  // Always run a derivation (even for unknown emails) so response time and the
  // error message don't reveal whether the email is registered.
  const saltBytes = account
    ? base64ToBytes(account.salt)
    : crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iterations = account ? account.iterations : PBKDF2_ITERATIONS
  const candidate = await derivePasscodeHash(passcode || '', saltBytes, iterations)

  const ok = account && safeEqual(candidate, account.hash)
  if (!ok) {
    if (account) {
      account.failedAttempts = (account.failedAttempts || 0) + 1
      if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        account.lockedUntil = Date.now() + LOCKOUT_MS
        account.failedAttempts = 0
      }
      writeAccounts(accounts)
    }
    throw new AuthError('invalid', 'Incorrect email or passcode.')
  }

  // Success: clear throttling state and open a session.
  account.failedAttempts = 0
  account.lockedUntil = 0
  writeAccounts(accounts)
  const session = createSession(account)
  notify()
  return session
}

export function accountExists(email) {
  return Boolean(readAccounts()[normalizeEmail(email)])
}

export function subscribe(fn) {
  subscribers.add(fn)
  const onStorage = (e) => {
    if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    subscribers.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

// Lightweight skipper identity.
//
// A boater "signs in" with their name and email; the email (lower-cased) is
// used as a stable owner id that every float plan they file is tagged with.
// Views are scoped to the signed-in skipper so each boater only sees their
// own plans.
//
// This is identity-based scoping for a client-only prototype — it is NOT a
// security boundary (anyone with the device can read localStorage). A real
// deployment would authenticate against a server and enforce ownership there.

const SESSION_KEY = 'floatplan.session.v1'

const subscribers = new Set()

function notify() {
  subscribers.forEach((fn) => fn())
}

function read() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getCurrentUser() {
  return read()
}

export function signIn({ name, email }) {
  const user = {
    id: email.trim().toLowerCase(),
    name: name.trim(),
    email: email.trim(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  notify()
  return user
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  notify()
}

export function subscribe(fn) {
  subscribers.add(fn)
  const onStorage = (e) => {
    if (e.key === SESSION_KEY) fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    subscribers.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

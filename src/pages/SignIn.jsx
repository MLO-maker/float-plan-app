import { useState } from 'react'
import { register, login, MIN_PASSCODE_LENGTH } from '../lib/auth.js'

// Brand mark shared with the top bar: an anchor that hides a W&A monogram.
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="brand-mark signin-mark" aria-hidden="true">
      <circle cx="12" cy="4" r="1.7" />
      <path d="M12 5.7 L9.2 9 M12 5.7 L14.8 9" />
      <path d="M7.3 9 H16.7" />
      <path d="M12 9 V16.4" />
      <path d="M5.4 14.8 L9 20 L12 16.4 L15 20 L18.6 14.8" />
    </svg>
  )
}

export default function SignIn() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setFormError('')
    setPasscode('')
  }

  function validate() {
    const e = {}
    if (isRegister && !name.trim()) e.name = 'Enter your name.'
    if (!email.trim()) e.email = 'Enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email address.'
    if (!passcode) e.passcode = 'Enter your passcode.'
    else if (isRegister && passcode.length < MIN_PASSCODE_LENGTH)
      e.passcode = `Use at least ${MIN_PASSCODE_LENGTH} characters.`
    return e
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      if (isRegister) {
        await register({ name, email, passcode })
      } else {
        await login({ email, passcode })
      }
      // On success the auth subscription re-renders App into the app shell.
    } catch (err) {
      // Map typed auth errors onto fields where useful, else a form-level note.
      if (err.code === 'name' || err.code === 'email' || err.code === 'passcode') {
        setErrors((prev) => ({ ...prev, [err.code]: err.message }))
      } else if (err.code === 'exists') {
        setFormError(err.message)
        setMode('login')
        setPasscode('')
      } else {
        setFormError(err.message || 'Something went wrong. Try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <LogoMark />
        <h1>
          Float<span className="brand-accent">Plan</span>
        </h1>
        <p className="signin-sub">
          {isRegister
            ? 'Create a skipper account to file and monitor your voyages.'
            : 'Sign in as the skipper. You only ever see the float plans filed under your own account.'}
        </p>

        <div className="signin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            className={'signin-tab' + (!isRegister ? ' active' : '')}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            className={'signin-tab' + (isRegister ? ' active' : '')}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>

        {formError && <p className="error-text signin-formerror">{formError}</p>}

        <form onSubmit={submit} noValidate>
          {isRegister && (
            <div className="field">
              <label>Skipper name</label>
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. James Cook"
                className={errors.name ? 'invalid' : ''}
                autoComplete="name"
                autoFocus
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="e.g. james.cook@example.com"
              className={errors.email ? 'invalid' : ''}
              autoComplete="email"
              autoFocus={!isRegister}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="field">
            <label>
              Passcode
              {isRegister && (
                <span className="hint"> — at least {MIN_PASSCODE_LENGTH} characters</span>
              )}
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(ev) => setPasscode(ev.target.value)}
              placeholder={isRegister ? 'Choose a passcode' : 'Your passcode'}
              className={errors.passcode ? 'invalid' : ''}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {errors.passcode && (
              <span className="error-text">{errors.passcode}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary signin-btn"
            disabled={busy}
          >
            {busy ? 'Working…' : isRegister ? '⚓ Create account' : '⚓ Sign in'}
          </button>
        </form>

        <p className="signin-switch">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New skipper?{' '}
              <button type="button" onClick={() => switchMode('register')}>
                Create an account
              </button>
            </>
          )}
        </p>

        <p className="note signin-note">
          Your passcode is kept secure, and sessions expire automatically after
          12 hours.
        </p>
      </div>
    </div>
  )
}

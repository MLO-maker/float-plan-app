import { useState } from 'react'
import { signIn } from '../lib/auth.js'

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (!email.trim()) next.email = 'Enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length === 0) signIn({ name, email })
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <LogoMark />
        <h1>
          Float<span className="brand-accent">Plan</span>
        </h1>
        <p className="signin-sub">
          Sign in as the skipper to file and monitor your voyages. You&apos;ll
          only ever see the float plans you file.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label>Skipper name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dana Reyes"
              className={errors.name ? 'invalid' : ''}
              autoFocus
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dana@example.com"
              className={errors.email ? 'invalid' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <button type="submit" className="btn btn-primary signin-btn">
            ⚓ Sign in
          </button>
        </form>
        <p className="note signin-note">
          Prototype sign-in — your identity is stored locally on this device to
          scope your float plans. No password required.
        </p>
      </div>
    </div>
  )
}

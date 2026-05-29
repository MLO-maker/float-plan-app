# ⚓ FloatPlan — Vessel Float Plan & Voyage Safety

A clean, maritime-themed web app for filing **float plans** (voyage safety
plans) and getting your emergency contacts alerted automatically if a vessel
doesn't make it back on time.

> A float plan is the boating equivalent of a flight plan: before you leave,
> you record where you're going, when you'll be back, and who to call if you
> don't return. FloatPlan digitizes that and watches the clock for you.

## Features

- **Per-skipper access** — boaters sign in with their name & email; every float
  plan is tagged with its owner and the dashboard, check-in, and detail views
  are scoped so each skipper only sees the plans they filed (with a URL-level
  ownership guard). See the security note below — this is identity scoping for a
  prototype, not a hardened auth boundary.
- **Multi-step plan filing** — a guided 4-step form captures the vessel & crew,
  voyage details (departure, destination, departure & expected-return times,
  planned route), and one or more emergency contacts, with a final review step.
- **Safe-return check-in** — captains confirm they're back at the dock, which
  closes the voyage and cancels any pending alerts.
- **Automatic overdue alerts** — a background watcher continuously checks every
  active plan. If a vessel passes its expected return time (plus a configurable
  grace window), the plan is flagged **overdue** and alerts are dispatched to
  every emergency contact.
- **Live dashboard** — see what's underway, overdue, or safely returned, with
  countdowns to each vessel's return window.
- **One-tap contact** — overdue vessels surface ready-to-send email / SMS / call
  links pre-filled with the voyage details to relay to rescue services.

## How alerting works

The overdue scan runs every 15 seconds (see [`src/hooks/usePlans.js`](src/hooks/usePlans.js)).
When `now > expectedReturn + GRACE_MINUTES` and the captain hasn't checked in,
[`src/lib/alerts.js`](src/lib/alerts.js) marks the plan overdue and dispatches
alerts.

This is a **client-only prototype**: plans are stored in the browser's
`localStorage` and alerts are dispatched in-app (logged to the console, with
pre-filled `mailto:` / `sms:` links for one-tap follow-up). In production the
`dispatchAlerts` function would call a server-side SMS/email gateway (Twilio,
SendGrid, etc.) so contacts are notified even when the app isn't open.

## Tech stack

- [React 18](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) for dev server & build
- No backend — state persists in `localStorage`

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  pages/
    SignIn.jsx       # skipper sign-in gate
    Dashboard.jsx    # overview of the skipper's plans + overdue alerts
    FilePlan.jsx     # multi-step voyage-plan form
    CheckIn.jsx      # captain safe-return check-in
    PlanDetail.jsx   # full plan view + emergency-contact actions (owner-only)
  lib/
    auth.js          # skipper identity (sign in/out) + pub/sub
    storage.js       # localStorage persistence + pub/sub
    alerts.js        # overdue detection & alert dispatch
    format.js        # date / time helpers
  hooks/
    useAuth.js       # current signed-in skipper
    usePlans.js      # live plans (scoped to skipper) + periodic overdue scan
  App.jsx            # shell + routing + auth gate
  index.css          # maritime theme
```

## Safety notice

FloatPlan is a demonstration project. Always file your real float plan with a
trusted shoreside contact, carry proper safety equipment, and monitor VHF
Channel 16. In an emergency in US waters, hail the Coast Guard on Channel 16 or
dial 911.

// Overdue detection and emergency-contact alerting.
//
// A vessel is "overdue" when the current time is past its expected return time
// (plus a grace window) and the captain has not checked in. When that happens
// we mark the plan overdue and "dispatch" alerts to every emergency contact.
//
// In a production deployment the dispatch step would call a server-side
// SMS/email gateway (Twilio, SendGrid, etc.). In this client-only build we
// record the alert on the plan and surface ready-to-send mailto:/sms: links
// in the UI so a human can fire them immediately, plus log them to the console.

import { getPlans, updatePlan } from './storage.js'

// How long after the expected return time before we consider a vessel overdue.
export const GRACE_MINUTES = 30

export function graceMs() {
  return GRACE_MINUTES * 60 * 1000
}

// Returns true if an active plan is now past its expected return + grace.
export function isOverdue(plan, now = Date.now()) {
  if (plan.status === 'returned') return false
  const due = new Date(plan.expectedReturn).getTime()
  if (Number.isNaN(due)) return false
  return now > due + graceMs()
}

// Milliseconds until a plan goes overdue (negative if already overdue).
export function msUntilOverdue(plan, now = Date.now()) {
  const due = new Date(plan.expectedReturn).getTime()
  return due + graceMs() - now
}

// Compose the alert message sent to emergency contacts.
export function buildAlertMessage(plan) {
  const due = new Date(plan.expectedReturn)
  return (
    `⚠️ OVERDUE VESSEL ALERT\n\n` +
    `The vessel "${plan.vesselName}" (Captain ${plan.captainName}) has not ` +
    `checked in and is now overdue.\n\n` +
    `Departed: ${plan.departurePoint}\n` +
    `Destination: ${plan.destination}\n` +
    `Expected return: ${due.toLocaleString()}\n` +
    (plan.souls ? `Persons on board: ${plan.souls}\n` : '') +
    (plan.vesselDescription ? `Vessel: ${plan.vesselDescription}\n` : '') +
    `\nIf you cannot reach the captain, contact the Coast Guard (in the US, ` +
    `call the USCG on VHF Channel 16 or dial 911) and provide these details.`
  )
}

// Build clickable mailto:/sms: links so a human can dispatch the alert now.
export function buildContactLinks(plan) {
  const message = buildAlertMessage(plan)
  const subject = `OVERDUE: ${plan.vesselName} has not checked in`
  return (plan.contacts || []).map((c) => ({
    name: c.name,
    email: c.email,
    phone: c.phone,
    mailto: c.email
      ? `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(message)}`
      : null,
    sms: c.phone
      ? `sms:${c.phone.replace(/[^+\d]/g, '')}?&body=${encodeURIComponent(
          message,
        )}`
      : null,
  }))
}

// Scan all plans, flag any that have gone overdue, and dispatch alerts once.
// Returns the list of plans that transitioned to overdue on this scan.
export function runOverdueScan(now = Date.now()) {
  const newlyOverdue = []
  for (const plan of getPlans()) {
    if (plan.status === 'active' && isOverdue(plan, now)) {
      dispatchAlerts(plan)
      newlyOverdue.push(plan)
    }
  }
  return newlyOverdue
}

// Mark a plan overdue and "send" alerts to its emergency contacts.
export function dispatchAlerts(plan) {
  const message = buildAlertMessage(plan)
  const contacts = plan.contacts || []

  // Stand-in for a real SMS/email gateway call.
  contacts.forEach((c) => {
    // eslint-disable-next-line no-console
    console.warn(
      `[ALERT DISPATCHED] To ${c.name} <${c.email || c.phone || 'no contact'}>\n${message}`,
    )
  })

  return updatePlan(plan.id, {
    status: 'overdue',
    alertsSentAt: new Date().toISOString(),
  })
}

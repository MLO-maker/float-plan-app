// Persistence layer for float plans.
//
// Float plans are stored in localStorage as a single JSON array under
// STORAGE_KEY. This keeps the app fully client-side with no backend, which is
// appropriate for a prototype / single-device safety log. Swapping this module
// for a real API client would not require changes elsewhere in the app.

const STORAGE_KEY = 'floatplan.plans.v1'

// A subscriber set so React views re-render when plans change in any tab.
const subscribers = new Set()

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  subscribers.forEach((fn) => fn())
}

export function getPlans() {
  return read()
}

export function getPlan(id) {
  return read().find((p) => p.id === id) || null
}

// Cheap unique id without pulling in a uuid dependency.
function makeId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase()
}

export function createPlan(data) {
  const plans = read()
  const plan = {
    id: makeId(),
    status: 'active', // active | returned | overdue
    filedAt: new Date().toISOString(),
    returnedAt: null,
    alertsSentAt: null,
    ...data,
  }
  plans.unshift(plan)
  write(plans)
  return plan
}

export function updatePlan(id, patch) {
  const plans = read()
  const idx = plans.findIndex((p) => p.id === id)
  if (idx === -1) return null
  plans[idx] = { ...plans[idx], ...patch }
  write(plans)
  return plans[idx]
}

export function deletePlan(id) {
  write(read().filter((p) => p.id !== id))
}

// Subscribe to plan changes. Returns an unsubscribe function.
export function subscribe(fn) {
  subscribers.add(fn)
  // Cross-tab updates.
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    subscribers.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

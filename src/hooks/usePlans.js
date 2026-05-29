// React hook that exposes the signed-in skipper's float plans and keeps them
// live: it subscribes to storage (and auth) changes and runs the overdue scan
// on an interval so vessels are automatically flagged and alerted the moment
// they pass their return time.
//
// Plans are scoped to the current skipper — each boater only sees their own.
// The overdue scan, however, runs across ALL plans so alerts still fire for
// every overdue vessel regardless of who is currently signed in.

import { useEffect, useState, useCallback } from 'react'
import { getPlans, subscribe } from '../lib/storage.js'
import { getCurrentUser, subscribe as subscribeAuth } from '../lib/auth.js'
import { runOverdueScan } from '../lib/alerts.js'

const SCAN_INTERVAL_MS = 15 * 1000

function ownPlans() {
  const user = getCurrentUser()
  if (!user) return []
  return getPlans().filter((p) => p.ownerId === user.id)
}

export function usePlans() {
  const [plans, setPlans] = useState(() => ownPlans())

  const refresh = useCallback(() => setPlans(ownPlans()), [])

  useEffect(() => {
    // Re-render whenever the stored plans or the signed-in skipper change.
    const unsub = subscribe(refresh)
    const unsubAuth = subscribeAuth(refresh)

    // Run a scan immediately, then on a steady interval. The scan dispatches
    // alerts for any vessel that has just gone overdue and updates storage,
    // which feeds back through `subscribe` to refresh the view.
    runOverdueScan()
    const timer = setInterval(() => {
      runOverdueScan()
      refresh()
    }, SCAN_INTERVAL_MS)

    return () => {
      unsub()
      unsubAuth()
      clearInterval(timer)
    }
  }, [refresh])

  return { plans, refresh }
}

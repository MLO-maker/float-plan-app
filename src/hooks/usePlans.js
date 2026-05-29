// React hook that exposes the float plans and keeps them live: it subscribes
// to storage changes and runs the overdue scan on an interval so vessels are
// automatically flagged and alerted the moment they pass their return time.

import { useEffect, useState, useCallback } from 'react'
import { getPlans, subscribe } from '../lib/storage.js'
import { runOverdueScan } from '../lib/alerts.js'

const SCAN_INTERVAL_MS = 15 * 1000

export function usePlans() {
  const [plans, setPlans] = useState(() => getPlans())

  const refresh = useCallback(() => setPlans(getPlans()), [])

  useEffect(() => {
    // Re-render whenever the stored plans change.
    const unsub = subscribe(refresh)

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
      clearInterval(timer)
    }
  }, [refresh])

  return { plans, refresh }
}

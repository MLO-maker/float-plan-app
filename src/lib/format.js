// Small date / time formatting helpers shared across views.

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Human-friendly relative time, e.g. "in 2h 15m" or "3h 4m ago".
export function formatRelative(ms) {
  const past = ms < 0
  let s = Math.abs(Math.round(ms / 1000))
  const days = Math.floor(s / 86400)
  s -= days * 86400
  const hours = Math.floor(s / 3600)
  s -= hours * 3600
  const minutes = Math.floor(s / 60)

  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes || (!days && !hours)) parts.push(`${minutes}m`)
  const body = parts.join(' ')
  return past ? `${body} ago` : `in ${body}`
}

// Value for a datetime-local input from a Date (local time, no seconds).
export function toLocalInputValue(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

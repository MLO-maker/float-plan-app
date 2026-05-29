import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans.js'
import { updatePlan } from '../lib/storage.js'
import { msUntilOverdue } from '../lib/alerts.js'
import { formatDateTime, formatRelative } from '../lib/format.js'

export default function CheckIn() {
  const { plans } = usePlans()
  const [justChecked, setJustChecked] = useState(null)

  // Captains can check in any voyage that hasn't already returned.
  const open = plans.filter((p) => p.status !== 'returned')

  function checkIn(plan) {
    updatePlan(plan.id, {
      status: 'returned',
      returnedAt: new Date().toISOString(),
    })
    setJustChecked(plan)
  }

  return (
    <div>
      <div className="page-head">
        <h1>Safe-Return Check-In</h1>
        <p>
          Back at the dock? Confirm your safe return to stand down the voyage
          and cancel any pending alerts to your emergency contacts.
        </p>
      </div>

      {justChecked && (
        <div
          className="alert-banner"
          style={{
            background: 'linear-gradient(180deg,#2e9e6b,#1f7d52)',
          }}
        >
          <span className="pulse" style={{ animation: 'none' }}>
            ✅
          </span>
          <div>
            <h3>{justChecked.vesselName} checked in safely</h3>
            <p>The voyage is closed and no alerts will be sent. Fair winds!</p>
          </div>
        </div>
      )}

      {open.length === 0 ? (
        <div className="empty">
          <h3>No voyages awaiting check-in</h3>
          <p>Every filed plan has been closed out. File a new plan when you head out again.</p>
          <Link
            to="/file"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            ⚓ File a plan
          </Link>
        </div>
      ) : (
        <div className="plan-list">
          {open.map((p) => {
            const remaining = msUntilOverdue(p)
            const isOverdue = p.status === 'overdue'
            return (
              <div
                key={p.id}
                className={`plan-card status-${p.status}`}
                style={{ cursor: 'default' }}
              >
                <div>
                  <p className="vessel">{p.vesselName}</p>
                  <p className="route">
                    {p.departurePoint} → {p.destination}
                  </p>
                  <p className="meta">
                    Expected return:{' '}
                    <strong>{formatDateTime(p.expectedReturn)}</strong>
                    {' · '}
                    {isOverdue ? (
                      <span className="countdown warn">overdue</span>
                    ) : (
                      <span className="countdown">
                        due {formatRelative(remaining)}
                      </span>
                    )}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                  }}
                >
                  <span className={`badge ${p.status}`}>{p.status}</span>
                  <button
                    className="btn btn-safe"
                    onClick={() => checkIn(p)}
                    type="button"
                  >
                    ✓ I&apos;m back safely
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

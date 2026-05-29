import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPlan, deletePlan, updatePlan, subscribe } from '../lib/storage.js'
import { getCurrentUser } from '../lib/auth.js'
import {
  buildContactLinks,
  msUntilOverdue,
  GRACE_MINUTES,
} from '../lib/alerts.js'
import { formatDateTime, formatRelative } from '../lib/format.js'

export default function PlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(() => getPlan(id))

  useEffect(() => {
    const refresh = () => setPlan(getPlan(id))
    refresh()
    return subscribe(refresh)
  }, [id])

  // Scope access to the owner. A skipper can only view their own plans;
  // anything else (missing, or owned by someone else) is treated the same so
  // we don't reveal that another skipper's plan exists.
  const user = getCurrentUser()
  if (!plan || !user || plan.ownerId !== user.id) {
    return (
      <div>
        <Link to="/" className="back-link">
          ← Back to dashboard
        </Link>
        <div className="empty">
          <h3>Float plan not available</h3>
          <p>
            This plan doesn&apos;t exist or was filed by another skipper. You
            can only view float plans filed under your own account.
          </p>
        </div>
      </div>
    )
  }

  const remaining = msUntilOverdue(plan)
  const contactLinks = buildContactLinks(plan)

  function checkIn() {
    updatePlan(plan.id, {
      status: 'returned',
      returnedAt: new Date().toISOString(),
    })
  }

  function remove() {
    if (window.confirm('Delete this float plan? This cannot be undone.')) {
      deletePlan(plan.id)
      navigate('/')
    }
  }

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to dashboard
      </Link>

      <div className="detail-head">
        <h1>{plan.vesselName}</h1>
        <span className={`badge ${plan.status}`}>{plan.status}</span>
      </div>

      {plan.status === 'overdue' && (
        <div className="alert-banner">
          <span className="pulse">🚨</span>
          <div>
            <h3>Vessel overdue — alerts dispatched</h3>
            <p>
              Alerts were sent to emergency contacts at{' '}
              {formatDateTime(plan.alertsSentAt)}. Use the contact buttons
              below to follow up, and relay the voyage details to rescue
              services if you cannot reach the captain.
            </p>
          </div>
        </div>
      )}

      {plan.status === 'returned' && (
        <div
          className="alert-banner"
          style={{ background: 'linear-gradient(180deg,#2e9e6b,#1f7d52)' }}
        >
          <span className="pulse" style={{ animation: 'none' }}>
            ✅
          </span>
          <div>
            <h3>Returned safely</h3>
            <p>Checked in at {formatDateTime(plan.returnedAt)}.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="summary-grid">
          <Item k="Captain / skipper" v={plan.captainName} />
          <Item k="Captain phone" v={plan.captainPhone || '—'} />
          <Item k="Persons on board" v={plan.souls ?? '—'} />
          <Item k="Vessel description" v={plan.vesselDescription || '—'} />
          <Item k="Departure point" v={plan.departurePoint} />
          <Item k="Destination" v={plan.destination} />
          <Item k="Departed" v={formatDateTime(plan.departureTime)} />
          <Item k="Expected return" v={formatDateTime(plan.expectedReturn)} />
          <Item k="Filed" v={formatDateTime(plan.filedAt)} />
          <Item
            k="Status window"
            v={
              plan.status === 'active'
                ? remaining > 0
                  ? `Alerts fire ${formatRelative(remaining)} (${GRACE_MINUTES} min grace)`
                  : 'Overdue — alerts imminent'
                : plan.status === 'overdue'
                  ? 'Past return window'
                  : 'Closed'
            }
          />
        </div>

        {plan.route && (
          <>
            <div className="section-label">Planned route</div>
            <p style={{ margin: 0 }}>{plan.route}</p>
          </>
        )}

        {plan.status !== 'returned' && (
          <div className="btn-row" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-safe" onClick={checkIn} type="button">
              ✓ Check in — back safely
            </button>
            <button className="btn btn-ghost" onClick={remove} type="button">
              Delete plan
            </button>
          </div>
        )}
        {plan.status === 'returned' && (
          <div className="btn-row" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={remove} type="button">
              Delete plan
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>
          Emergency contacts
          {plan.status === 'overdue' && ' — alerted'}
        </div>
        {contactLinks.map((c, i) => (
          <div className="contact-card" key={i}>
            <div className="cname">{c.name}</div>
            {(c.phone || c.email) && (
              <div className="crel">
                {[c.phone, c.email].filter(Boolean).join(' · ')}
              </div>
            )}
            <div className="clinks">
              {c.sms && (
                <a className="link-btn" href={c.sms}>
                  💬 Text alert
                </a>
              )}
              {c.mailto && (
                <a className="link-btn" href={c.mailto}>
                  ✉️ Email alert
                </a>
              )}
              {c.phone && (
                <a className="link-btn" href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}>
                  📞 Call
                </a>
              )}
            </div>
          </div>
        ))}
        <p className="note">
          In this prototype, alerts are dispatched in-app (and logged to the
          browser console). The buttons above open your device&apos;s
          messaging apps with a pre-filled overdue alert so you can notify
          contacts immediately.
        </p>
      </div>
    </div>
  )
}

function Item({ k, v }) {
  return (
    <div className="summary-item">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans.js'
import { msUntilOverdue } from '../lib/alerts.js'
import { formatDateTime, formatRelative } from '../lib/format.js'

export default function Dashboard() {
  const { plans } = usePlans()

  const active = plans.filter((p) => p.status === 'active')
  const overdue = plans.filter((p) => p.status === 'overdue')
  const returned = plans.filter((p) => p.status === 'returned')

  return (
    <div>
      <div className="page-head">
        <h1>Voyage Dashboard</h1>
        <p>
          Monitor every filed float plan. Overdue vessels are flagged the
          moment they pass their expected return window.
        </p>
      </div>

      {overdue.length > 0 && (
        <div className="alert-banner">
          <span className="pulse">🚨</span>
          <div>
            <h3>
              {overdue.length} vessel{overdue.length > 1 ? 's' : ''} overdue —
              emergency contacts alerted
            </h3>
            <p>
              Open the vessel to dispatch follow-up messages and review the
              details to relay to rescue services.
            </p>
          </div>
        </div>
      )}

      <div className="stat-row">
        <div className="stat">
          <div className="num">{active.length}</div>
          <div className="lbl">Underway</div>
        </div>
        <div className={'stat' + (overdue.length ? ' alert' : '')}>
          <div className="num">{overdue.length}</div>
          <div className="lbl">Overdue</div>
        </div>
        <div className="stat">
          <div className="num">{returned.length}</div>
          <div className="lbl">Returned safely</div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="empty">
          <h3>No float plans filed yet</h3>
          <p>File a voyage plan before you head out so someone ashore knows where you are.</p>
          <Link
            to="/file"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            ⚓ File your first plan
          </Link>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="Overdue">
              {overdue.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </Section>
          )}
          {active.length > 0 && (
            <Section title="Underway">
              {active.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </Section>
          )}
          {returned.length > 0 && (
            <Section title="Returned">
              {returned.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="section-label">{title}</div>
      <div className="plan-list">{children}</div>
    </div>
  )
}

function PlanCard({ plan }) {
  const remaining = msUntilOverdue(plan)
  const warn = plan.status === 'active' && remaining < 60 * 60 * 1000

  return (
    <Link to={`/plan/${plan.id}`} className={`plan-card status-${plan.status}`}>
      <div>
        <p className="vessel">{plan.vesselName}</p>
        <p className="route">
          {plan.departurePoint} → {plan.destination}
        </p>
        <p className="meta">
          Expected return:{' '}
          <strong>{formatDateTime(plan.expectedReturn)}</strong>
          {plan.status === 'active' && (
            <>
              {' · '}
              <span className={'countdown' + (warn ? ' warn' : '')}>
                {remaining > 0
                  ? `due ${formatRelative(remaining)}`
                  : 'overdue'}
              </span>
            </>
          )}
          {plan.status === 'returned' && plan.returnedAt && (
            <> · checked in {formatDateTime(plan.returnedAt)}</>
          )}
        </p>
      </div>
      <span className={`badge ${plan.status}`}>{plan.status}</span>
    </Link>
  )
}

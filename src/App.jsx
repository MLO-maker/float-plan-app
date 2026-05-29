import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import FilePlan from './pages/FilePlan.jsx'
import CheckIn from './pages/CheckIn.jsx'
import PlanDetail from './pages/PlanDetail.jsx'

function AnchorMark() {
  return (
    <svg viewBox="0 0 24 24" className="brand-mark" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <AnchorMark />
            <span className="brand-text">
              Float<span className="brand-accent">Plan</span>
            </span>
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/file" className="nav-link">
              File a Plan
            </NavLink>
            <NavLink to="/check-in" className="nav-link">
              Check In
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/file" element={<FilePlan />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/plan/:id" element={<PlanDetail />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          FloatPlan is a voyage-safety prototype. Always file your real float
          plan with a trusted shoreside contact and monitor VHF Channel 16.
        </p>
      </footer>
    </div>
  )
}

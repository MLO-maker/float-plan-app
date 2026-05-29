import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import FilePlan from './pages/FilePlan.jsx'
import CheckIn from './pages/CheckIn.jsx'
import PlanDetail from './pages/PlanDetail.jsx'

// W&A monogram: an "A" peak (sail / bow) riding over a "W" rendered as waves.
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="brand-mark" aria-hidden="true">
      {/* A — peak with crossbar */}
      <path d="M12 3.5 L7.4 15 M12 3.5 L16.6 15" />
      <path d="M9.2 11 H14.8" />
      {/* W — waves */}
      <path d="M3 18 L7 21.5 L12 18 L17 21.5 L21 18" />
    </svg>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <LogoMark />
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

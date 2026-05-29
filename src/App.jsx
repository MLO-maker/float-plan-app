import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import FilePlan from './pages/FilePlan.jsx'
import CheckIn from './pages/CheckIn.jsx'
import PlanDetail from './pages/PlanDetail.jsx'

// Anchor that hides a W&A monogram: the ring + A-frame top form an "A"
// (the anchor's stock crossbar doubles as the A's crossbar), while the
// flukes at the bottom are drawn as a "W".
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="brand-mark" aria-hidden="true">
      {/* ring / shackle */}
      <circle cx="12" cy="4" r="1.7" />
      {/* A — apex below the ring, legs landing on the stock */}
      <path d="M12 5.7 L9.2 9 M12 5.7 L14.8 9" />
      {/* stock = the A's crossbar */}
      <path d="M7.3 9 H16.7" />
      {/* shank down the centre to the crown */}
      <path d="M12 9 V16.4" />
      {/* W — the flukes */}
      <path d="M5.4 14.8 L9 20 L12 16.4 L15 20 L18.6 14.8" />
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

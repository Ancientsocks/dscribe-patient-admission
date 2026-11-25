import { NavLink } from 'react-router-dom'

import { IconClose, IconDashboard, IconUserPlus, IconUsers } from './icons'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/patients', label: 'Patients', icon: IconUsers, end: true },
  { to: '/patients/new', label: 'Add Patient', icon: IconUserPlus, end: true },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path d="M12 4v16M4 12h16" strokeLinecap="round" />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="text-base font-bold tracking-tight text-slate-900">DScribe</p>
        <p className="text-xs font-medium text-slate-500">Admissions Desk</p>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
        </div>
        <NavItems onNavigate={onClose} />

        <div className="m-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">Patient Admission System</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Demo build for the DScribe Software Engineer Intern assessment.
          </p>
        </div>
      </aside>
    </>
  )
}

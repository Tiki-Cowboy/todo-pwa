import { NavLink } from 'react-router-dom'

const TABS = [
  { path: '/today',     label: 'Today' },
  { path: '/projects',  label: 'Projects' },
  { path: '/reporting', label: 'Reporting' },
]

export default function NavBar({ user, onSignOut }) {
  return (
    <div className="sticky top-0 z-10">
      <header className="bg-navy-deep" style={{ height: 52 }}>
        <div className="max-w-4xl mx-auto px-4 h-full flex items-center gap-4">
          <span className="font-sans font-semibold text-gold uppercase tracking-[3px] text-[14px] shrink-0">
            TIKI TO-DOS
          </span>

          {/* Desktop tab nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {TABS.map(tab => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-[1px] transition"
                style={({ isActive }) => isActive
                  ? { background: 'rgba(196,162,78,0.15)', color: '#C4A24E' }
                  : { color: '#6B7793' }}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          <button
            onClick={onSignOut}
            className="text-xs px-3 py-1.5 rounded-lg border border-navy-light text-text-secondary hover:text-cream transition shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>
      <div className="h-[2px] w-full bg-gold opacity-40" />
    </div>
  )
}

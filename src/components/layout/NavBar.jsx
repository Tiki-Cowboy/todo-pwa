const TABS = [
  { id: 'home',      label: 'Today' },
  { id: 'projects',  label: 'Projects' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'configure', label: 'Configure' },
]

export default function NavBar({ activeTab, onTabChange, user, onSignOut }) {
  return (
    <div className="sticky top-0 z-10">
      <header className="bg-navy-deep" style={{ height: 52 }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center gap-2 sm:gap-4">

          <span className="font-sans font-semibold text-gold uppercase tracking-[2px] sm:tracking-[3px] text-[13px] sm:text-[15px] shrink-0">
            TIKI TO-DOS
          </span>

          {/* Tabs — scrollable on mobile so they never overflow */}
          <nav className="flex flex-1 overflow-x-auto scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-2 sm:px-4 h-[52px] text-[12px] sm:text-[13px] whitespace-nowrap transition border-b-2 shrink-0 ${
                  activeTab === tab.id
                    ? 'text-cream border-gold'
                    : 'text-text-tertiary border-transparent hover:text-cream'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-text-secondary text-xs hidden sm:block truncate max-w-[140px]">
              {user?.email}
            </span>
            <button
              onClick={onSignOut}
              className="text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-navy-light text-text-secondary hover:text-cream transition whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>
      <div className="h-[2px] w-full bg-gold opacity-40" />
    </div>
  )
}

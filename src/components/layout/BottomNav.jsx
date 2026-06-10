function TodayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <line x1="10" y1="1.5" x2="10" y2="3.5" />
      <line x1="10" y1="16.5" x2="10" y2="18.5" />
      <line x1="1.5" y1="10" x2="3.5" y2="10" />
      <line x1="16.5" y1="10" x2="18.5" y2="10" />
      <line x1="3.6" y1="3.6" x2="5.1" y2="5.1" />
      <line x1="14.9" y1="14.9" x2="16.4" y2="16.4" />
      <line x1="3.6" y1="16.4" x2="5.1" y2="14.9" />
      <line x1="14.9" y1="5.1" x2="16.4" y2="3.6" />
    </svg>
  )
}

function ProjectsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7a2 2 0 0 1 2-2h3.17l1.83 2H16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

function ReportingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="11" width="4" height="7" rx="1" />
      <rect x="8" y="7" width="4" height="11" rx="1" />
      <rect x="14" y="3" width="4" height="15" rx="1" />
    </svg>
  )
}

const TABS = [
  { id: 'home',      label: 'Today',     Icon: TodayIcon },
  { id: 'projects',  label: 'Projects',  Icon: ProjectsIcon },
  { id: 'reporting', label: 'Reporting', Icon: ReportingIcon },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 md:hidden"
      style={{
        background: '#0C1A33',
        borderTop: '1px solid rgba(196,162,78,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-4xl mx-auto flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
              style={{ color: active ? '#C4A24E' : '#6B7793' }}
              aria-label={label}
            >
              <Icon />
              <span
                className="text-[10px] font-medium uppercase tracking-[1px]"
                style={{ color: active ? '#C4A24E' : '#6B7793' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

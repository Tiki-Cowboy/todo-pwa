const OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'daily', label: '↻ Daily' },
  { value: 'frequent', label: '⟳ Frequent' },
]

export default function TaskTypeToggle({ value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 p-1 rounded-xl ${className}`} style={{ background: '#F4F2ED' }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
          style={(value ?? 'standard') === opt.value
            ? { background: 'white', color: '#0C1A33', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
            : { background: 'transparent', color: '#8B93A1' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

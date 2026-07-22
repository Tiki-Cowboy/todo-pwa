import { DAY_LABELS, DAY_LABELS_FULL } from '../../lib/recurrence'

const TYPE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'interval', label: 'Every N days' },
]

const MONTHLY_MODE_OPTIONS = [
  { value: 'days', label: 'On day(s)' },
  { value: 'weekday', label: 'On a weekday' },
]

const ORDINAL_OPTIONS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
]

const borderStyle = { borderColor: 'rgba(12,26,51,0.12)' }

function MonthDayGrid({ selected, onToggle }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onToggle(d)}
          className="h-7 rounded-md text-[11px] font-medium transition"
          style={selected.includes(d)
            ? { background: '#C4A24E', color: 'white' }
            : { background: 'white', color: '#8B93A1', border: '1px solid rgba(12,26,51,0.12)' }}
        >
          {d}
        </button>
      ))}
    </div>
  )
}

export default function RecurrencePicker({ value, onChange }) {
  const type = value?.type ?? 'weekly'
  const daysOfWeek = value?.daysOfWeek ?? []
  const intervalDays = value?.intervalDays ?? 7
  const monthlyMode = value?.monthlyMode ?? 'days'
  const daysOfMonth = value?.daysOfMonth?.length ? value.daysOfMonth : [value?.dayOfMonth ?? 1]
  const weekdayOrdinal = value?.weekdayOrdinal ?? 1
  const weekday = value?.weekday ?? 0

  function setType(t) { onChange({ ...value, type: t }) }

  function toggleDay(d) {
    const next = daysOfWeek.includes(d) ? daysOfWeek.filter(x => x !== d) : [...daysOfWeek, d].sort()
    onChange({ ...value, type: 'weekly', daysOfWeek: next })
  }

  function setIntervalDays(n) { onChange({ ...value, type: 'interval', intervalDays: n }) }

  function setMonthlyMode(mode) {
    if (mode === 'weekday') {
      onChange({ ...value, type: 'monthly', monthlyMode: 'weekday', weekdayOrdinal, weekday })
    } else {
      onChange({ ...value, type: 'monthly', monthlyMode: 'days', daysOfMonth })
    }
  }

  function toggleMonthDay(d) {
    const next = daysOfMonth.includes(d) ? daysOfMonth.filter(x => x !== d) : [...daysOfMonth, d].sort((a, b) => a - b)
    onChange({ ...value, type: 'monthly', monthlyMode: 'days', daysOfMonth: next.length ? next : [d] })
  }

  function setWeekdayOrdinal(ord) { onChange({ ...value, type: 'monthly', monthlyMode: 'weekday', weekdayOrdinal: ord }) }
  function setWeekday(wd) { onChange({ ...value, type: 'monthly', monthlyMode: 'weekday', weekday: wd }) }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F2ED' }}>
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className="flex-1 py-1 rounded-md text-[11px] font-medium transition"
            style={type === opt.value
              ? { background: 'white', color: '#0C1A33', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
              : { color: '#8B93A1' }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {type === 'weekly' && (
        <div className="flex gap-1 flex-wrap">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              title={label}
              className="w-8 h-8 rounded-lg text-[11px] font-medium transition"
              style={daysOfWeek.includes(i)
                ? { background: '#C4A24E', color: 'white' }
                : { background: 'white', color: '#8B93A1', border: '1px solid rgba(12,26,51,0.12)' }}
            >
              {label[0]}
            </button>
          ))}
        </div>
      )}

      {type === 'monthly' && (
        <div className="space-y-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F2ED' }}>
            {MONTHLY_MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMonthlyMode(opt.value)}
                className="flex-1 py-1 rounded-md text-[11px] font-medium transition"
                style={monthlyMode === opt.value
                  ? { background: 'white', color: '#0C1A33', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: '#8B93A1' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {monthlyMode === 'days' ? (
            <div>
              <p className="text-[11px] text-text-tertiary mb-1">
                Runs the last day of the month if a picked day doesn't exist in it (e.g. 31 in April).
              </p>
              <MonthDayGrid selected={daysOfMonth} onToggle={toggleMonthDay} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={weekdayOrdinal}
                onChange={e => setWeekdayOrdinal(parseInt(e.target.value, 10))}
                className="text-xs bg-white border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                style={borderStyle}
              >
                {ORDINAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={weekday}
                onChange={e => setWeekday(parseInt(e.target.value, 10))}
                className="text-xs bg-white border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                style={borderStyle}
              >
                {DAY_LABELS_FULL.map((label, i) => <option key={i} value={i}>{label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {type === 'interval' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Every</span>
          <input
            type="number"
            min="1"
            value={intervalDays}
            onChange={e => setIntervalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 text-xs bg-white border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
            style={borderStyle}
          />
          <span className="text-xs text-text-secondary">days</span>
        </div>
      )}
    </div>
  )
}

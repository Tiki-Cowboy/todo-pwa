import { useState, useMemo } from 'react'
import { subDays, startOfDay, endOfDay, parseISO, isToday } from 'date-fns'
import CompletedByDay from './CompletedByDay'
import Charts from './Charts'

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7',     label: 'Last 7 days' },
  { value: '30',    label: 'Last 30 days' },
  { value: 'all',   label: 'All time' },
  { value: 'custom', label: 'Custom' },
]

function filterByRange(tasks, range, customStart, customEnd) {
  if (range === 'today') {
    return tasks.filter(t => t.completedAt && isToday(t.completedAt))
  }
  if (range === 'custom') {
    if (!customStart || !customEnd) return []
    const start = startOfDay(parseISO(customStart))
    const end   = endOfDay(parseISO(customEnd))
    return tasks.filter(t => t.completedAt && t.completedAt >= start && t.completedAt <= end)
  }
  if (range === 'all') return tasks
  const cutoff = subDays(new Date(), parseInt(range))
  return tasks.filter(t => t.completedAt && t.completedAt >= cutoff)
}

export default function ReportingTab({ completedTasks, categories, projects }) {
  const [range, setRange]           = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')

  const filtered = useMemo(
    () => filterByRange(completedTasks, range, customStart, customEnd),
    [completedTasks, range, customStart, customEnd]
  )

  const cardStyle = { border: '1px solid rgba(12, 26, 51, 0.06)' }

  return (
    <div>
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-[22px] font-medium text-text-primary">Reporting</h2>
        <div className="flex gap-1 bg-white rounded-xl p-1" style={cardStyle}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
              style={
                range === r.value
                  ? { background: '#C4A24E', color: 'white' }
                  : { color: '#8B93A1' }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl px-4 py-3" style={cardStyle}>
          <span className="text-xs text-text-tertiary font-medium">From</span>
          <input
            type="date"
            value={customStart}
            max={customEnd || undefined}
            onChange={e => setCustomStart(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 bg-page-bg"
            style={{ border: '1px solid rgba(12,26,51,0.12)', colorScheme: 'light' }}
          />
          <span className="text-xs text-text-tertiary font-medium">To</span>
          <input
            type="date"
            value={customEnd}
            min={customStart || undefined}
            onChange={e => setCustomEnd(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 bg-page-bg"
            style={{ border: '1px solid rgba(12,26,51,0.12)', colorScheme: 'light' }}
          />
        </div>
      )}

      {/* Summary strip */}
      {(() => {
        const withDue = filtered.filter(t => t.dueDate && t.completedAt)
        const onTime  = withDue.filter(t => {
          const due = new Date(t.dueDate); due.setHours(23, 59, 59)
          return t.completedAt <= due
        })
        const onTimeRate = withDue.length > 0 ? Math.round((onTime.length / withDue.length) * 100) : null

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Completed',     value: filtered.length },
              { label: 'High Priority', value: filtered.filter(t => t.priority === 'High').length },
              { label: 'Categories',    value: new Set(filtered.map(t => t.category)).size },
              { label: 'On-Time Rate',  value: onTimeRate !== null ? `${onTimeRate}%` : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 text-center" style={cardStyle}>
                <p className="text-2xl font-semibold" style={{ color: '#C4A24E' }}>{stat.value}</p>
                <p className="text-xs text-text-tertiary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Charts */}
      <Charts tasks={filtered} categories={categories} range={range} />

      {/* Completed log */}
      <h3 className="text-lg font-medium text-text-primary mt-8 mb-4">Completed Tasks</h3>
      <CompletedByDay tasks={filtered} projects={projects} />
    </div>
  )
}

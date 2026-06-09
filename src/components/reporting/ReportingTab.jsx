import { useState, useMemo } from 'react'
import { subDays } from 'date-fns'
import CompletedByDay from './CompletedByDay'
import Charts from './Charts'

const RANGES = [
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

function filterByRange(tasks, range) {
  if (range === 'all') return tasks
  const cutoff = subDays(new Date(), parseInt(range))
  return tasks.filter(t => t.completedAt && t.completedAt >= cutoff)
}

export default function ReportingTab({ completedTasks, categories }) {
  const [range, setRange] = useState('7')

  const filtered = useMemo(
    () => filterByRange(completedTasks, range),
    [completedTasks, range]
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
      <CompletedByDay tasks={filtered} />
    </div>
  )
}

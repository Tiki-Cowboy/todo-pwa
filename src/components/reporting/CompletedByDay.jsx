import { useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

const PRIORITY_BG   = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }

function dayLabel(date) {
  if (isToday(date))     return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEE, MMM d')
}

export default function CompletedByDay({ tasks }) {
  const grouped = useMemo(() => {
    const byDay = {}
    tasks.forEach(t => {
      if (!t.completedAt) return
      const key = format(t.completedAt, 'yyyy-MM-dd')
      if (!byDay[key]) byDay[key] = { date: t.completedAt, byCategory: {} }
      const cat = t.category ?? 'Uncategorized'
      if (!byDay[key].byCategory[cat]) byDay[key].byCategory[cat] = []
      byDay[key].byCategory[cat].push(t)
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, v]) => v)
  }, [tasks])

  const cardStyle = { border: '1px solid rgba(12, 26, 51, 0.06)' }

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-text-tertiary text-sm italic" style={cardStyle}>
        No completed tasks in this period
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
      {grouped.map((day, di) => (
        <div
          key={format(day.date, 'yyyy-MM-dd')}
          style={{ borderBottom: di < grouped.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none' }}
        >
          {/* Day header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: '#F4F2ED', borderBottom: '1px solid rgba(12,26,51,0.06)' }}
          >
            <span className="font-medium text-text-primary text-sm">
              {dayLabel(day.date)}
            </span>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full text-text-tertiary"
              style={{ background: 'rgba(12,26,51,0.06)' }}
            >
              {Object.values(day.byCategory).flat().length} tasks
            </span>
          </div>

          {/* Categories */}
          {Object.entries(day.byCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, catTasks]) => (
              <div
                key={cat}
                className="px-5 py-3"
                style={{ borderBottom: '1px solid rgba(12,26,51,0.04)' }}
              >
                <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">{cat}</p>
                <div className="space-y-2">
                  {catTasks
                    .sort((a, b) => {
                      const po = { High: 1, Medium: 2, Low: 3 }
                      return (po[a.priority] - po[b.priority]) || (a.completedAt - b.completedAt)
                    })
                    .map(task => (
                      <div key={task.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-xs mt-0.5 shrink-0" style={{ color: '#2D8F65' }}>✓</span>
                          <span className={`text-sm text-text-secondary line-through opacity-70 break-words ${task.parentId ? 'italic' : ''}`}>
                            {task.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                            style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_TEXT[task.priority] }}
                          >
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-text-tertiary">
                              due {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                          <span className="text-xs text-text-tertiary">
                            {format(task.completedAt, 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

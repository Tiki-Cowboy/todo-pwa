import { useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

const PRIORITY_BG   = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }
const COLS = '3fr 1.5fr 1fr 1.2fr'
const THEAD_H = 36

function dayLabel(date) {
  if (isToday(date))     return format(date, "'Today —' EEEE, MMMM d")
  if (isYesterday(date)) return format(date, "'Yesterday —' EEEE, MMMM d")
  return format(date, 'EEEE, MMMM d')
}

export default function CompletedByDay({ tasks, projects }) {
  const projectMap = useMemo(
    () => new Map((projects ?? []).map(p => [p.id, p])),
    [projects]
  )

  const grouped = useMemo(() => {
    const byDay = {}
    tasks.forEach(t => {
      if (!t.completedAt) return
      const key = format(t.completedAt, 'yyyy-MM-dd')
      if (!byDay[key]) byDay[key] = { date: t.completedAt, tasks: [] }
      byDay[key].tasks.push(t)
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, v]) => ({
        key,
        label: dayLabel(v.date),
        tasks: v.tasks.sort((a, b) => b.completedAt - a.completedAt),
      }))
  }, [tasks])

  const cardStyle = {
    border: '1px solid rgba(12,26,51,0.14)',
    boxShadow: '0 1px 4px rgba(12,26,51,0.07)',
  }
  const gridStyle = { display: 'grid', gridTemplateColumns: COLS, gap: '0 12px', alignItems: 'center' }

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-text-tertiary text-sm italic" style={cardStyle}>
        No completed tasks in this period
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
      <div style={{ maxHeight: '600px', overflowY: 'auto', position: 'relative' }}>

        {/* Sticky column headers */}
        <div
          style={{
            ...gridStyle,
            position: 'sticky',
            top: 0,
            zIndex: 3,
            height: `${THEAD_H}px`,
            background: '#F4F2ED',
            borderBottom: '1px solid rgba(12,26,51,0.08)',
            padding: '0 20px',
          }}
        >
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">Title</span>
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">Project</span>
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">Priority</span>
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">Completed</span>
        </div>

        {/* Day groups */}
        {grouped.map(group => (
          <div key={group.key}>
            {/* Sticky day sub-header */}
            <div
              style={{
                position: 'sticky',
                top: THEAD_H,
                zIndex: 2,
                background: 'rgba(244,242,237,0.97)',
                borderBottom: '1px solid rgba(12,26,51,0.06)',
                padding: '5px 20px',
              }}
            >
              <span className="text-xs font-medium text-text-secondary">{group.label}</span>
            </div>

            {/* Task rows */}
            {group.tasks.map((task, ti) => (
              <div
                key={task.id}
                style={{
                  ...gridStyle,
                  padding: '10px 20px',
                  borderBottom: ti < group.tasks.length - 1
                    ? '1px solid rgba(12,26,51,0.04)'
                    : 'none',
                }}
              >
                <span className="text-sm text-text-secondary line-through opacity-70 break-words leading-snug">
                  {task.text}
                </span>

                <span className="text-xs text-text-tertiary truncate">
                  {task.projectId ? (projectMap.get(task.projectId)?.name ?? '—') : '—'}
                </span>

                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg w-fit"
                  style={{
                    background: PRIORITY_BG[task.priority] ?? 'rgba(12,26,51,0.04)',
                    color: PRIORITY_TEXT[task.priority] ?? '#8B93A1',
                  }}
                >
                  {task.priority ?? '—'}
                </span>

                <span className="text-xs text-text-tertiary whitespace-nowrap">
                  {format(task.completedAt, 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

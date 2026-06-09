import { useState, useMemo } from 'react'
import { isToday, parseISO, format } from 'date-fns'
import { motion } from 'framer-motion'
import TaskEditModal from './TaskEditModal'
import { useToast } from '../ui/Toast'
import { formatDueDate, isOverdue } from '../../lib/dateUtils'

const PRIORITY_BAR  = { High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }
const PRIORITY_BG   = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }

function TodayTaskRow({ task, onComplete, onOpenEdit }) {
  const [completing, setCompleting] = useState(false)
  const due = task.dueDate ? formatDueDate(task.dueDate) : null
  const overdue = due?.overdue ?? false
  const barColor = overdue ? '#C0392B' : (PRIORITY_BAR[task.priority] ?? '#8B93A1')

  async function handleComplete() {
    setCompleting(true)
    await new Promise(r => setTimeout(r, 200))
    onComplete(task.id)
  }

  return (
    <motion.div
      layout
      animate={completing ? { opacity: 0, x: 30 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(12,26,51,0.05)' }}
    >
      {/* Priority bar */}
      <div className="w-[3px] self-stretch rounded-full shrink-0 mt-0.5" style={{ background: barColor }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug break-words">{task.text}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-text-tertiary">{task.category}</span>
          {due && (
            <span className="text-xs font-medium" style={{ color: overdue ? '#C0392B' : '#C4A24E' }}>
              {overdue && '⚠ '}{due.label}
            </span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
          style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_TEXT[task.priority] }}
        >
          {task.priority}
        </span>
        <button
          onClick={() => onOpenEdit(task)}
          className="text-xs text-text-tertiary hover:text-text-secondary transition"
        >
          Edit
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
          style={{ border: '1.5px solid rgba(12,26,51,0.15)' }}
          aria-label="Complete task"
        />
      </div>
    </motion.div>
  )
}

const TODAY = new Date().toISOString().split('T')[0]

function DailyChecklistRow({ task, onToggle }) {
  const doneToday = task.lastCompletedDate === TODAY
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(12,26,51,0.05)' }}
    >
      <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ background: 'rgba(74,111,165,0.3)' }} />
      <p className={`flex-1 text-sm leading-snug ${doneToday ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
        {task.text}
      </p>
      <button
        onClick={() => onToggle(task.id, doneToday)}
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all shrink-0"
        style={doneToday
          ? { background: '#2D8F65', border: '1.5px solid #2D8F65' }
          : { background: 'transparent', border: '1.5px solid rgba(12,26,51,0.2)' }}
        aria-label={doneToday ? 'Mark undone' : 'Mark done'}
      >
        {doneToday && (
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,5 4,7.5 8.5,2.5" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function HomeTab({
  tasks,
  categories,
  activeProjects = [],
  onComplete,
  onUpdate,
  onToggleDailyTask,
}) {
  const toast = useToast()
  const [editingTask, setEditingTask] = useState(null)

  const todayDate = format(new Date(), 'EEEE, MMMM d')

  // Daily checklist tasks — from daily-type projects
  const dailyProjectIds = useMemo(() =>
    new Set(activeProjects.filter(p => p.type === 'daily').map(p => p.id)),
    [activeProjects]
  )

  const dailyTasks = useMemo(() =>
    tasks.filter(t => !t.parentId && t.projectId && dailyProjectIds.has(t.projectId))
      .sort((a, b) => a.text.localeCompare(b.text)),
    [tasks, dailyProjectIds]
  )

  const visibleTasks = useMemo(() => {
    const eligible = tasks.filter(t =>
      !t.parentId &&
      !t.completedAt &&
      t.dueDate &&
      (isOverdue(t.dueDate) || isToday(parseISO(t.dueDate)))
    )
    // Overdue first (oldest first), then today
    return eligible.sort((a, b) => {
      const aOver = isOverdue(a.dueDate)
      const bOver = isOverdue(b.dueDate)
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [tasks])

  async function handleComplete(taskId) {
    try { await onComplete(taskId) } catch { toast('Failed to complete task', 'error') }
  }

  async function handleSaveEdit(taskId, updates) {
    try { await onUpdate(taskId, updates) } catch { toast('Failed to save changes', 'error') }
  }

  const cardStyle = { border: '1px solid rgba(12,26,51,0.06)' }

  return (
    <div>
      <h2 className="text-[22px] font-medium text-text-primary mb-5">{todayDate}</h2>

      {visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-text-tertiary gap-3">
          <span className="text-4xl">✓</span>
          <p className="text-lg text-text-secondary font-medium">All clear.</p>
          <p className="text-sm">Nothing due today.</p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">
            DUE &amp; OVERDUE
          </p>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {visibleTasks.map(task => (
              <TodayTaskRow
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onOpenEdit={setEditingTask}
              />
            ))}
          </div>
        </div>
      )}

      {dailyTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">
            Daily Checklist
          </p>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {dailyTasks.map(task => (
              <DailyChecklistRow
                key={task.id}
                task={task}
                onToggle={onToggleDailyTask}
              />
            ))}
          </div>
        </div>
      )}

      <TaskEditModal
        task={editingTask}
        categories={categories}
        activeProjects={activeProjects}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDueDate, isOverdue } from '../../lib/dateUtils'

const ACCENT_COLORS = ['#C4A24E', '#C0392B', '#4A6FA5', '#2D8F65', '#9b7fd4', '#e87c4a']

const PRIORITY_BAR  = { High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }
const PRIORITY_BG   = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }

const STATUS_STYLE = {
  active:    { bg: 'rgba(45,143,101,0.08)',  color: '#2D8F65' },
  'on-hold': { bg: 'rgba(196,162,78,0.08)',  color: '#8B7332' },
  archived:  { bg: 'rgba(139,147,161,0.1)',  color: '#8B93A1' },
  completed: { bg: 'rgba(74,111,165,0.1)',   color: '#4A6FA5' },
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.active
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg" style={{ background: s.bg, color: s.color }}>
      {status === 'on-hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5l2.5 2.5L4 11.5H1.5V9L9 1.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 3.5h10M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M11 3.5l-.6 7.6a1 1 0 0 1-1 .9H3.6a1 1 0 0 1-1-.9L2 3.5" />
      <line x1="5.5" y1="6" x2="5.5" y2="9.5" />
      <line x1="7.5" y1="6" x2="7.5" y2="9.5" />
    </svg>
  )
}

const TODAY = new Date().toISOString().split('T')[0]

function DailyTaskRow({ task, onToggle, onOpenEdit }) {
  const doneToday = task.lastCompletedDate === TODAY

  return (
    <div
      className="flex items-center gap-3 py-2.5 group"
      style={{ borderTop: '1px solid rgba(12,26,51,0.04)' }}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${doneToday ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
          {task.text}
        </p>
      </div>
      <button
        onClick={() => onOpenEdit(task)}
        className="text-[11px] text-text-tertiary hover:text-text-secondary transition hidden group-hover:inline shrink-0"
      >
        Edit
      </button>
      <button
        onClick={() => onToggle(task.id, doneToday)}
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all shrink-0"
        style={doneToday
          ? { background: '#2D8F65', border: '1.5px solid #2D8F65' }
          : { background: 'transparent', border: '1.5px solid rgba(12,26,51,0.2)' }}
        aria-label={doneToday ? 'Mark undone' : 'Mark done'}
      >
        {doneToday && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,5 4,7.5 8.5,2.5" />
          </svg>
        )}
      </button>
    </div>
  )
}

function TaskRow({ task, onComplete, onDelete, onOpenEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [completing, setCompleting]       = useState(false)
  const due     = task.dueDate ? formatDueDate(task.dueDate) : null
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false
  const barColor = overdue ? '#C0392B' : (PRIORITY_BAR[task.priority] ?? '#8B93A1')

  async function handleComplete() {
    setCompleting(true)
    await new Promise(r => setTimeout(r, 200))
    onComplete(task.id, task.parentId)
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
    else onDelete(task.id)
  }

  return (
    <motion.div
      layout
      animate={completing ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 py-2.5 group"
      style={{ borderTop: '1px solid rgba(12,26,51,0.04)' }}
    >
      <div className="w-[3px] self-stretch rounded-full shrink-0 mt-0.5" style={{ background: barColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug break-words">{task.text}</p>
        {due && (
          <p className="text-xs mt-0.5" style={{ color: due.overdue ? '#C0392B' : '#8B93A1' }}>
            {due.overdue && '⚠ '}{due.label}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-lg hidden group-hover:inline"
          style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_TEXT[task.priority] }}
        >
          {task.priority}
        </span>
        <button
          onClick={() => onOpenEdit(task)}
          className="text-[11px] text-text-tertiary hover:text-text-secondary transition hidden group-hover:inline"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-[11px] transition hidden group-hover:inline"
          style={{ color: confirmDelete ? '#C0392B' : '#8B93A1' }}
        >
          {confirmDelete ? 'Sure?' : 'Del'}
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
          style={{ background: 'transparent', border: '1.5px solid rgba(12,26,51,0.15)' }}
          aria-label="Complete task"
        />
      </div>
    </motion.div>
  )
}

export default function ProjectCard({
  project,
  index,
  tasks,
  onComplete,
  onDelete,
  onOpenEdit,
  onAddTask,
  defaultExpanded,
  onEditProject,
  onDeleteProject,
  onToggleDailyTask,
}) {
  const isDaily = project.type === 'daily'
  const [expanded, setExpanded]           = useState(defaultExpanded ?? false)
  const [addingTask, setAddingTask]       = useState(false)
  const [newTaskText, setNewTaskText]     = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [newTaskDue, setNewTaskDue]       = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const cardStyle   = { border: '1px solid rgba(12,26,51,0.06)' }
  const divider     = { borderTop: '1px solid rgba(12,26,51,0.06)' }

  async function handleQuickAdd(e) {
    e.preventDefault()
    const trimmed = newTaskText.trim()
    if (!trimmed) return
    await onAddTask({
      text: trimmed,
      priority: newTaskPriority,
      category: project.categoryName,
      projectId: project.id,
      dueDate: newTaskDue || null,
    })
    setNewTaskText('')
    setNewTaskPriority('Medium')
    setNewTaskDue('')
    setAddingTask(false)
  }

  function openAddTask() {
    setExpanded(true)
    setAddingTask(true)
  }

  function cancelAddTask() {
    setAddingTask(false)
    setNewTaskText('')
    setNewTaskPriority('Medium')
    setNewTaskDue('')
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="flex">
        {/* Accent bar */}
        <div className="w-[4px] shrink-0" style={{ background: accentColor }} />

        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Header ── */}
          <div className="px-3 pt-3 pb-2.5">

            {/* Row 1: name · icons · chevron */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Name — click to expand */}
              <p
                className="flex-1 text-[14px] font-semibold text-text-primary leading-snug truncate cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
              >
                {project.name}
              </p>

              {/* Project-level actions — right of title */}
              <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                {onEditProject && (
                  <button
                    title="Edit project"
                    onClick={() => onEditProject(project)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
                  >
                    <PencilIcon />
                  </button>
                )}
                {onDeleteProject && (
                  <button
                    title={confirmDelete ? 'Click again to confirm' : 'Delete project'}
                    onClick={() => {
                      if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
                      else onDeleteProject(project.id)
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                    style={{ color: confirmDelete ? '#C0392B' : '#8B93A1' }}
                  >
                    {confirmDelete
                      ? <span className="text-[10px] font-bold leading-none">Sure?</span>
                      : <TrashIcon />}
                  </button>
                )}
              </div>

              {/* Chevron — click to expand */}
              <span
                className="text-text-tertiary text-[10px] shrink-0 cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? '▾' : '▶'}
              </span>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-[12px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Row 2: meta */}
            <div
              className="flex items-center gap-1.5 mt-1 cursor-pointer select-none"
              onClick={() => setExpanded(e => !e)}
            >
              <span className="text-[11px] text-text-tertiary">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
              <StatusPill status={project.status} />
              {isDaily && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg" style={{ background: 'rgba(74,111,165,0.08)', color: '#4A6FA5' }}>
                  ↻ Daily
                </span>
              )}
            </div>

          </div>

          {/* ── Task list (animated) ── */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4" style={divider}>
                  {tasks.map(task => isDaily ? (
                    <DailyTaskRow
                      key={task.id}
                      task={task}
                      onToggle={onToggleDailyTask}
                      onOpenEdit={onOpenEdit}
                    />
                  ) : (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={onComplete}
                      onDelete={onDelete}
                      onOpenEdit={onOpenEdit}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Always-visible bottom strip ── */}
          <div className="px-4" style={divider}>
            {addingTask ? (
              <form onSubmit={handleQuickAdd} className="flex flex-col gap-2 py-2.5">
                <input
                  autoFocus
                  type="text"
                  placeholder="Task description…"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  className="w-full text-sm bg-page-bg border rounded-lg px-3 py-1.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold"
                  style={{ borderColor: 'rgba(12,26,51,0.12)' }}
                />
                <div className="flex flex-wrap gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    className="text-xs bg-page-bg border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                    style={{ borderColor: 'rgba(12,26,51,0.12)' }}
                  >
                    {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p} Priority</option>)}
                  </select>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="text-xs bg-page-bg border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                    style={{ borderColor: 'rgba(12,26,51,0.12)', colorScheme: 'light' }}
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                    style={{ background: accentColor }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddTask}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition"
                  >
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={openAddTask}
                className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition py-2.5 w-full"
              >
                <span className="text-base leading-none">+</span> Add task
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

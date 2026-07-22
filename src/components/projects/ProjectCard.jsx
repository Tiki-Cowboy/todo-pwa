import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDueDate, isOverdue } from '../../lib/dateUtils'
import { describeRecurrence, initialDueDate } from '../../lib/recurrence'
import RecurrencePicker from '../tasks/RecurrencePicker'
import TaskTypeToggle from '../tasks/TaskTypeToggle'

export const ACCENT_COLORS = ['#C4A24E', '#C0392B', '#4A6FA5', '#2D8F65', '#9b7fd4', '#e87c4a']
const PRIORITY_BAR  = { High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }
const PRIORITY_BG   = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }

const STATUS_STYLE = {
  active:    { bg: 'rgba(45,143,101,0.08)',  color: '#2D8F65' },
  'on-hold': { bg: 'rgba(196,162,78,0.08)',  color: '#8B7332' },
  archived:  { bg: 'rgba(139,147,161,0.1)',  color: '#8B93A1' },
  completed: { bg: 'rgba(74,111,165,0.1)',   color: '#4A6FA5' },
}

const STATUS_OPTIONS_LIST = [
  { value: 'active',    label: 'Active' },
  { value: 'on-hold',   label: 'On Hold' },
  { value: 'archived',  label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

export function StatusPill({ status, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.active
  const label = status === 'on-hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)

  function handleOpen(e) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.top, left: r.left })
    }
    setOpen(o => !o)
  }

  function handleSelect(e, value) {
    e.stopPropagation()
    onStatusChange?.(value)
    setOpen(false)
  }

  if (!onStatusChange) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg" style={{ background: s.bg, color: s.color }}>
        {label}
      </span>
    )
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="text-[11px] font-medium px-2 py-0.5 rounded-lg cursor-pointer transition-opacity hover:opacity-75"
        style={{ background: s.bg, color: s.color }}
      >
        {label}
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 999 }} onClick={() => setOpen(false)} />
          <div
            className="fixed bg-white rounded-xl shadow-lg py-1 min-w-[130px]"
            style={{
              zIndex: 1000,
              top: pos.top,
              left: pos.left,
              transform: 'translateY(calc(-100% - 4px))',
              border: '1px solid rgba(12,26,51,0.1)',
            }}
          >
            {STATUS_OPTIONS_LIST.map(opt => {
              const os = STATUS_STYLE[opt.value] ?? STATUS_STYLE.active
              return (
                <button
                  key={opt.value}
                  onClick={e => handleSelect(e, opt.value)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-black/5 transition"
                >
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: os.bg, color: os.color }}>
                    {opt.label}
                  </span>
                  {opt.value === status && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-text-tertiary">
                      <polyline points="1,4.5 3.5,7 8,1.5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5l2.5 2.5L4 11.5H1.5V9L9 1.5z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" />
      <line x1="9.5" y1="1.5" x2="1.5" y2="9.5" />
    </svg>
  )
}

function PlusIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  )
}

function ChainLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a2.5 2.5 0 003.5.2l1.8-1.8a2.5 2.5 0 00-3.5-3.5L6.7 4" />
      <path d="M8 6a2.5 2.5 0 00-3.5-.2L2.7 7.6a2.5 2.5 0 003.5 3.5L7.3 10" />
    </svg>
  )
}

function OpenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 1.5H1.5V4.5" />
      <path d="M7.5 10.5H10.5V7.5" />
      <path d="M10.5 1.5L6.5 5.5" />
      <path d="M1.5 10.5L5.5 6.5" />
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

export function HubSpotLinks({ dealName, dealUrl, contactName, contactUrl }) {
  const hasDeal    = !!dealUrl
  const hasContact = !!contactUrl
  if (!hasDeal && !hasContact) return null
  return (
    <div className="flex flex-wrap gap-2 mt-0.5">
      {hasDeal && (
        <a
          href={dealUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-[10px] font-medium text-[#4A6FA5] hover:underline"
        >
          {dealName || 'HubSpot Deal'} ↗
        </a>
      )}
      {hasContact && (
        <a
          href={contactUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-[10px] font-medium text-[#4A6FA5] hover:underline"
        >
          {contactName || 'HubSpot Contact'} ↗
        </a>
      )}
    </div>
  )
}

// ── Daily task row ─────────────────────────────────────────────────────────────

export function DailyTaskRow({ task, onToggle, onOpenEdit, onDelete, onAddSubtask, hasSubtasks, subtasksCollapsed, onToggleSubtasks }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const doneToday = task.lastCompletedDate === TODAY

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
    else onDelete(task.id)
  }

  return (
    <div
      className="flex items-center gap-3 py-2.5 group"
      style={{ borderTop: '1px solid rgba(12,26,51,0.04)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`flex-1 text-sm leading-snug ${doneToday ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
            {task.text}
          </p>
          {hasSubtasks && (
            <button
              onClick={onToggleSubtasks}
              title={subtasksCollapsed ? 'Show sub-tasks' : 'Hide sub-tasks'}
              className="text-[10px] text-text-tertiary hover:text-text-secondary shrink-0 transition leading-none"
            >
              {subtasksCollapsed ? '▶' : '▾'}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onOpenEdit(task)}
          title="Edit task"
          aria-label="Edit task"
          className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
        >
          <PencilIcon />
        </button>
        {onAddSubtask && (
          <button
            onClick={onAddSubtask}
            title="Add sub-task"
            aria-label="Add sub-task"
            className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
          >
            <PlusIcon />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete task'}
            aria-label="Delete task"
            className="w-6 h-6 flex items-center justify-center rounded-md transition"
            style={{ color: confirmDelete ? '#C0392B' : 'rgba(192,57,43,0.45)' }}
          >
            <XIcon />
          </button>
        )}
      </div>
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

// ── Frequent task row (weekly / monthly / interval recurrence) ─────────────────

export function FrequentTaskRow({ task, onComplete, onOpenEdit, onDelete, onAddSubtask, hasSubtasks, subtasksCollapsed, onToggleSubtasks }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nextDue = task.recurrence?.nextDueDate ?? null
  const due = nextDue ? formatDueDate(nextDue) : null

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
    else onDelete(task.id)
  }

  return (
    <div className="flex items-center gap-3 py-2.5 group" style={{ borderTop: '1px solid rgba(12,26,51,0.04)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="flex-1 text-sm text-text-primary leading-snug">{task.text}</p>
          {hasSubtasks && (
            <button
              onClick={onToggleSubtasks}
              title={subtasksCollapsed ? 'Show sub-tasks' : 'Hide sub-tasks'}
              className="text-[10px] text-text-tertiary hover:text-text-secondary shrink-0 transition leading-none"
            >
              {subtasksCollapsed ? '▶' : '▾'}
            </button>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: due?.overdue ? '#C0392B' : '#8B93A1' }}>
          {due?.overdue && '⚠ '}{describeRecurrence(task.recurrence)}{due ? ` · ${due.label}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onOpenEdit(task)}
          title="Edit task"
          aria-label="Edit task"
          className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
        >
          <PencilIcon />
        </button>
        {onAddSubtask && (
          <button
            onClick={onAddSubtask}
            title="Add sub-task"
            aria-label="Add sub-task"
            className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
          >
            <PlusIcon />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete task'}
            aria-label="Delete task"
            className="w-6 h-6 flex items-center justify-center rounded-md transition"
            style={{ color: confirmDelete ? '#C0392B' : 'rgba(192,57,43,0.45)' }}
          >
            <XIcon />
          </button>
        )}
      </div>
      <button
        onClick={() => onComplete(task.id)}
        className="w-[22px] h-[22px] rounded-full shrink-0"
        style={{ border: '1.5px solid rgba(12,26,51,0.2)' }}
        aria-label="Mark done"
      />
    </div>
  )
}

// ── Standard task row ──────────────────────────────────────────────────────────

export function TaskRow({ task, onComplete, onDelete, onOpenEdit, onAddSubtask, hasSubtasks, subtasksCollapsed, onToggleSubtasks }) {
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
        <div className="flex items-center gap-1.5">
          {task.fuChain?.enabled && (
            <span title="Follow-up chain" className="text-text-tertiary shrink-0"><ChainLinkIcon /></span>
          )}
          <p className="flex-1 text-sm text-text-primary leading-snug break-words">{task.text}</p>
          {hasSubtasks && (
            <button
              onClick={onToggleSubtasks}
              title={subtasksCollapsed ? 'Show sub-tasks' : 'Hide sub-tasks'}
              className="text-[10px] text-text-tertiary hover:text-text-secondary shrink-0 transition leading-none"
            >
              {subtasksCollapsed ? '▶' : '▾'}
            </button>
          )}
        </div>
        {due && (
          <p className="text-xs mt-0.5" style={{ color: due.overdue ? '#C0392B' : '#8B93A1' }}>
            {due.overdue && '⚠ '}{due.label}
          </p>
        )}
        <HubSpotLinks dealName={task.dealName} dealUrl={task.dealUrl} contactName={task.contactName} contactUrl={task.contactUrl} />
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity mr-1"
          style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_TEXT[task.priority] }}
        >
          {task.priority}
        </span>
        <button
          onClick={() => onOpenEdit(task)}
          title="Edit task"
          aria-label="Edit task"
          className="w-6 h-6 flex items-center justify-center rounded-md transition opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary hover:bg-black/5"
        >
          <PencilIcon />
        </button>
        {onAddSubtask && (
          <button
            onClick={onAddSubtask}
            title="Add sub-task"
            aria-label="Add sub-task"
            className="w-6 h-6 flex items-center justify-center rounded-md transition opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary hover:bg-black/5"
          >
            <PlusIcon />
          </button>
        )}
        <button
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm' : 'Delete task'}
          aria-label="Delete task"
          className="w-6 h-6 flex items-center justify-center rounded-md transition opacity-0 group-hover:opacity-100"
          style={{ color: confirmDelete ? '#C0392B' : 'rgba(192,57,43,0.45)' }}
        >
          <XIcon />
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40 ml-0.5"
          style={{ background: 'transparent', border: '1.5px solid rgba(12,26,51,0.15)' }}
          aria-label="Complete task"
        />
      </div>
    </motion.div>
  )
}

// ── Subtask row ────────────────────────────────────────────────────────────────

export function SubtaskRow({ task, onComplete, onDelete, onOpenEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [completing, setCompleting]       = useState(false)

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
      className="flex items-center gap-2 py-1.5 pl-6 group"
      style={{ borderTop: '1px solid rgba(12,26,51,0.03)' }}
    >
      <div className="w-[2px] self-stretch rounded-full shrink-0" style={{ background: 'rgba(12,26,51,0.12)' }} />
      {task.fuChain?.enabled && (
        <span title="Follow-up chain" className="text-text-tertiary shrink-0"><ChainLinkIcon /></span>
      )}
      <p className="flex-1 text-xs text-text-secondary leading-snug break-words">{task.text}</p>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onOpenEdit(task)}
          title="Edit sub-task"
          aria-label="Edit sub-task"
          className="w-5 h-5 flex items-center justify-center rounded transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
        >
          <PencilIcon />
        </button>
        <button
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm' : 'Delete sub-task'}
          aria-label="Delete sub-task"
          className="w-5 h-5 flex items-center justify-center rounded transition"
          style={{ color: confirmDelete ? '#C0392B' : 'rgba(192,57,43,0.45)' }}
        >
          <XIcon />
        </button>
      </div>
      <button
        onClick={handleComplete}
        disabled={completing}
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
        style={{ background: 'transparent', border: '1.5px solid rgba(12,26,51,0.15)' }}
        aria-label="Complete subtask"
      />
    </motion.div>
  )
}

// ── Subtask add form ───────────────────────────────────────────────────────────

export function SubtaskAddRow({ parentId, category, onAdd, onCancel }) {
  const [text, setText]         = useState('')
  const [priority, setPriority] = useState('Medium')
  const [saving, setSaving]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    await onAdd(parentId, { text: trimmed, priority, category })
    setSaving(false)
    onCancel()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 pl-6 py-2"
      style={{ borderTop: '1px solid rgba(12,26,51,0.04)', background: 'rgba(12,26,51,0.015)' }}
    >
      <div className="w-[2px] self-stretch rounded-full shrink-0" style={{ background: 'rgba(12,26,51,0.12)' }} />
      <input
        autoFocus
        type="text"
        placeholder="Sub-task description…"
        value={text}
        onChange={e => setText(e.target.value)}
        className="flex-1 min-w-0 text-xs bg-white border rounded-lg px-2 py-1 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
        style={{ borderColor: 'rgba(12,26,51,0.12)' }}
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value)}
        className="text-xs bg-white border rounded-lg px-1.5 py-1 text-text-primary focus:outline-none"
        style={{ borderColor: 'rgba(12,26,51,0.12)' }}
      >
        {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <button
        type="submit"
        disabled={saving || !text.trim()}
        className="text-[11px] font-medium text-white px-2.5 py-1 rounded-lg disabled:opacity-50"
        style={{ background: '#C4A24E' }}
      >Add</button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[11px] text-text-tertiary hover:text-text-secondary"
      >✕</button>
    </form>
  )
}

// ── Project Card ───────────────────────────────────────────────────────────────

export default function ProjectCard({
  project,
  index,
  tasks,
  onComplete,
  onDelete,
  onOpenEdit,
  onAddTask,
  onAddSubtask,
  defaultExpanded,
  onEditProject,
  onDeleteProject,
  onUpdateProject,
  onToggleDailyTask,
  onCompleteFrequentTask,
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded]                   = useState(defaultExpanded ?? false)
  const [addingTask, setAddingTask]               = useState(false)
  const [addingSubtaskFor, setAddingSubtaskFor]   = useState(null)
  const [collapsedSubtasks, setCollapsedSubtasks] = useState(new Set())
  const [newTaskText, setNewTaskText]             = useState('')
  const [newTaskType, setNewTaskType]             = useState('standard')
  const [newTaskPriority, setNewTaskPriority]     = useState('Medium')
  const [newTaskDue, setNewTaskDue]               = useState('')
  const [newTaskRecurrence, setNewTaskRecurrence] = useState({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
  const [confirmDelete, setConfirmDelete]         = useState(false)

  const topLevelTasks = tasks.filter(t => !t.parentId)
  const subtaskMap    = new Map()
  tasks.filter(t => t.parentId).forEach(t => {
    if (!subtaskMap.has(t.parentId)) subtaskMap.set(t.parentId, [])
    subtaskMap.get(t.parentId).push(t)
  })

  function toggleSubtasks(taskId) {
    setCollapsedSubtasks(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const cardStyle   = { border: '1px solid rgba(12,26,51,0.06)' }
  const divider     = { borderTop: '1px solid rgba(12,26,51,0.06)' }

  async function handleQuickAdd(e) {
    e.preventDefault()
    const trimmed = newTaskText.trim()
    if (!trimmed) return
    const base = {
      text: trimmed,
      priority: newTaskPriority,
      category: project.categoryName,
      projectId: project.id,
      type: newTaskType,
    }
    if (newTaskType === 'frequent') {
      await onAddTask({ ...base, recurrence: { ...newTaskRecurrence, nextDueDate: initialDueDate(newTaskRecurrence, TODAY) } })
    } else if (newTaskType === 'daily') {
      await onAddTask(base)
    } else {
      await onAddTask({ ...base, dueDate: newTaskDue || null })
    }
    setNewTaskText('')
    setNewTaskType('standard')
    setNewTaskPriority('Medium')
    setNewTaskDue('')
    setNewTaskRecurrence({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
    setAddingTask(false)
  }

  function openAddTask() {
    setExpanded(true)
    setAddingTask(true)
  }

  function cancelAddTask() {
    setAddingTask(false)
    setNewTaskText('')
    setNewTaskType('standard')
    setNewTaskPriority('Medium')
    setNewTaskDue('')
    setNewTaskRecurrence({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="flex">
        {/* Accent bar */}
        <div className="w-[4px] shrink-0" style={{ background: accentColor }} />

        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Header ── */}
          <div className="px-3 pt-3 pb-2.5">

            {/* Row 1: name + chevron */}
            <div
              className="flex items-center gap-1.5 min-w-0 cursor-pointer select-none"
              onClick={() => setExpanded(e => !e)}
            >
              <p className="flex-1 text-[14px] font-semibold text-text-primary leading-snug truncate">
                {project.name}
              </p>
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="text-text-tertiary shrink-0"
                style={{ transition: 'transform 175ms ease', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                <polyline points="2,2 7,5 2,8" />
              </svg>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-[12px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Status Note */}
            {project.statusNote && (
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: '#C4A24E' }}>
                  Status
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                  {project.statusNote}
                </p>
              </div>
            )}
            <HubSpotLinks dealName={project.dealName} dealUrl={project.dealUrl} contactName={project.contactName} contactUrl={project.contactUrl} />

            {/* Row 2: meta + action icons */}
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
              >
                <span className="text-[11px] text-text-tertiary">
                  {topLevelTasks.length} task{topLevelTasks.length !== 1 ? 's' : ''}
                </span>
                <StatusPill
                  status={project.status}
                  onStatusChange={onUpdateProject ? newStatus => onUpdateProject(project.id, { status: newStatus }) : undefined}
                />
              </div>

              {/* Project-level actions */}
              <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  title="Open project page"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
                >
                  <OpenIcon />
                </button>
                {onAddTask && (
                  <button
                    title="Add task"
                    onClick={openAddTask}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
                  >
                    <PlusIcon />
                  </button>
                )}
                {onEditProject && (
                  <button
                    title="Edit project"
                    onClick={() => onEditProject(project)}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition text-text-tertiary hover:text-text-secondary hover:bg-black/5"
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
                    className="w-6 h-6 flex items-center justify-center rounded-md transition"
                    style={{ color: confirmDelete ? '#C0392B' : '#8B93A1' }}
                  >
                    {confirmDelete ? <span className="text-[10px] font-bold leading-none">Sure?</span> : <TrashIcon />}
                  </button>
                )}
              </div>
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
                <div
                  className="px-4"
                  style={{
                    ...divider,
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                >
                  {topLevelTasks.map(task => {
                    const subs = subtaskMap.get(task.id) ?? []
                    const collapsed = collapsedSubtasks.has(task.id)
                    return (
                      <div key={task.id}>
                        {task.type === 'daily' ? (
                          <DailyTaskRow
                            task={task}
                            onToggle={onToggleDailyTask}
                            onOpenEdit={onOpenEdit}
                            onDelete={onDelete}
                            onAddSubtask={onAddSubtask ? () => setAddingSubtaskFor(task.id) : undefined}
                            hasSubtasks={subs.length > 0}
                            subtasksCollapsed={collapsed}
                            onToggleSubtasks={() => toggleSubtasks(task.id)}
                          />
                        ) : task.type === 'frequent' ? (
                          <FrequentTaskRow
                            task={task}
                            onComplete={onCompleteFrequentTask}
                            onOpenEdit={onOpenEdit}
                            onDelete={onDelete}
                            onAddSubtask={onAddSubtask ? () => setAddingSubtaskFor(task.id) : undefined}
                            hasSubtasks={subs.length > 0}
                            subtasksCollapsed={collapsed}
                            onToggleSubtasks={() => toggleSubtasks(task.id)}
                          />
                        ) : (
                          <TaskRow
                            task={task}
                            onComplete={onComplete}
                            onDelete={onDelete}
                            onOpenEdit={onOpenEdit}
                            onAddSubtask={onAddSubtask ? () => setAddingSubtaskFor(task.id) : undefined}
                            hasSubtasks={subs.length > 0}
                            subtasksCollapsed={collapsed}
                            onToggleSubtasks={() => toggleSubtasks(task.id)}
                          />
                        )}
                        {addingSubtaskFor === task.id && (
                          <SubtaskAddRow
                            parentId={task.id}
                            category={task.category}
                            onAdd={onAddSubtask}
                            onCancel={() => setAddingSubtaskFor(null)}
                          />
                        )}
                        {!collapsed && subs.map(sub => (
                          <SubtaskRow
                            key={sub.id}
                            task={sub}
                            onComplete={onComplete}
                            onDelete={onDelete}
                            onOpenEdit={onOpenEdit}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Task add form (shown when triggered from header +) ── */}
          {addingTask && (
            <div className="px-4" style={divider}>
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
                  {newTaskType === 'standard' && (
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={e => setNewTaskDue(e.target.value)}
                      className="text-xs bg-page-bg border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                      style={{ borderColor: 'rgba(12,26,51,0.12)', colorScheme: 'light' }}
                    />
                  )}
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
                <TaskTypeToggle value={newTaskType} onChange={setNewTaskType} />
                {newTaskType === 'frequent' && (
                  <RecurrencePicker value={newTaskRecurrence} onChange={setNewTaskRecurrence} />
                )}
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

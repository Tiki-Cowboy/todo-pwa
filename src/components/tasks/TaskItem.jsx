import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { formatDueDate } from '../../lib/dateUtils'

const PRIORITY_BAR   = { High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }
const PRIORITY_BG    = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT  = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }

export default function TaskItem({
  task,
  isSubtask = false,
  onComplete,
  onDelete,
  onOpenEdit,
  onAddSubtask,
  children,
}) {
  const [completing, setCompleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimer = useRef(null)

  const due = task.dueDate ? formatDueDate(task.dueDate) : null
  const overdue = due?.overdue ?? false
  const priorityBar = overdue ? '#C0392B' : (PRIORITY_BAR[task.priority] ?? '#8B93A1')

  async function handleComplete() {
    setCompleting(true)
    await new Promise(r => setTimeout(r, 220))
    onComplete(task.id, task.parentId)
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      deleteTimer.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      clearTimeout(deleteTimer.current)
      onDelete(task.id)
    }
  }

  return (
    <motion.div
      layout
      animate={completing ? { opacity: 0, x: 40, scale: 0.97 } : { opacity: 1, x: 0, scale: 1 }}
      whileHover={completing ? {} : { y: -1 }}
      transition={{ duration: 0.22, ease: 'easeIn' }}
      className={isSubtask ? 'ml-6' : ''}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden mb-2 hover:shadow-sm transition-shadow"
        style={{
          border: '1px solid rgba(12, 26, 51, 0.06)',
          borderLeft: `3px solid ${priorityBar}`,
        }}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm leading-snug break-words">{task.text}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {!isSubtask && (
                <span className="text-xs text-text-tertiary">{task.category}</span>
              )}
              {due && (
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: due.overdue ? '#C0392B' : '#8B93A1' }}
                >
                  {due.overdue && '⚠'} {due.label}
                </span>
              )}
            </div>
          </div>

          {/* Right: priority pill + done circle */}
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
              style={{
                background: PRIORITY_BG[task.priority],
                color: PRIORITY_TEXT[task.priority],
              }}
            >
              {task.priority}
            </span>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
              style={{
                background: completing ? '#2D8F65' : 'transparent',
                border: completing ? 'none' : '1.5px solid rgba(12, 26, 51, 0.15)',
              }}
              aria-label="Complete task"
            >
              {completing && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 flex items-center gap-4">
          <button
            onClick={() => onOpenEdit(task)}
            className="text-xs text-text-tertiary hover:text-text-secondary transition"
          >
            Edit
          </button>
          {!isSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition"
            >
              + Subtask
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            className="text-xs transition ml-auto"
            style={{ color: confirmDelete ? '#C0392B' : '#8B93A1' }}
          >
            {confirmDelete ? 'Sure?' : 'Delete'}
          </button>
        </div>
      </div>

      {children}
    </motion.div>
  )
}

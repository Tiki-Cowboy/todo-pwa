import { useState, useMemo, useEffect, useRef } from 'react'
import { isToday, parseISO, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import TaskEditModal from './TaskEditModal'
import { useToast } from '../ui/Toast'
import { formatDueDate, isOverdue } from '../../lib/dateUtils'

const PRIORITY_BAR    = { High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }
const PRIORITY_BG     = { High: 'rgba(192,57,43,0.06)',  Medium: 'rgba(196,162,78,0.08)', Low: 'rgba(45,143,101,0.08)' }
const PRIORITY_TEXT   = { High: '#C0392B', Medium: '#8B7332', Low: '#2D8F65' }
const PRIORITY_ORDER  = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const ACCENT_COLORS   = ['#C4A24E', '#C0392B', '#4A6FA5', '#2D8F65', '#9b7fd4', '#e87c4a']

function CelebrationBanner({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="rounded-2xl px-6 py-4 text-center shadow-2xl max-w-xs mx-auto"
            style={{ background: '#0C1A33', border: '1px solid rgba(196,162,78,0.3)' }}
          >
            <p className="text-lg mb-1">🌴</p>
            <p className="text-sm font-medium text-white leading-snug">
              Congrats! You've completed the sisyphean challenge of accomplishing all of today's tasks.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TodayTaskRow({ task, projectInfo, onComplete, onCompleteSubtask, onOpenEdit, subtasks = [] }) {
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
    <div>
      <motion.div
        layout
        animate={completing ? { opacity: 0, x: 30 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3 py-3"
        style={{ borderBottom: subtasks.length > 0 ? 'none' : '1px solid rgba(12,26,51,0.05)' }}
      >
        {/* Priority bar */}
        <div className="w-[3px] self-stretch rounded-full shrink-0 mt-0.5" style={{ background: barColor }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-snug break-words">{task.text}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-text-tertiary">{task.category}</span>
            {projectInfo && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ background: projectInfo.color + '22', color: projectInfo.color }}
              >
                {projectInfo.name}
              </span>
            )}
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

      {subtasks.map(sub => (
        <div
          key={sub.id}
          className="flex items-center gap-2 py-1.5 pl-8"
          style={{ borderBottom: '1px solid rgba(12,26,51,0.04)' }}
        >
          <div className="w-[2px] self-stretch rounded-full shrink-0" style={{ background: 'rgba(12,26,51,0.1)' }} />
          <p className="flex-1 text-xs text-text-secondary leading-snug break-words">{sub.text}</p>
          <button
            onClick={() => onCompleteSubtask?.(sub.id, sub.parentId)}
            className="w-[20px] h-[20px] rounded-full flex items-center justify-center transition-all shrink-0"
            style={{ background: 'transparent', border: '1.5px solid rgba(12,26,51,0.15)' }}
            aria-label="Complete subtask"
          />
        </div>
      ))}
    </div>
  )
}

const TODAY = format(new Date(), 'yyyy-MM-dd')

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
  onCompleteSubtask,
  onUpdate,
  onToggleDailyTask,
}) {
  const toast = useToast()
  const [editingTask, setEditingTask] = useState(null)
  const [sort, setSort] = useState('due')
  const [showBanner, setShowBanner] = useState(false)

  // Tracks which lists have already celebrated today — { dueOverdue: 'yyyy-MM-dd', daily: 'yyyy-MM-dd' }
  const celebratedRef = useRef({ dueOverdue: null, daily: null })

  const todayDate = format(new Date(), 'EEEE, MMMM d')

  const projectMapById = useMemo(() =>
    new Map(activeProjects.map((p, i) => [p.id, { name: p.name, color: ACCENT_COLORS[i % ACCENT_COLORS.length] }])),
    [activeProjects]
  )

  const subtaskMap = useMemo(() => {
    const map = new Map()
    tasks.filter(t => t.parentId && !t.completedAt).forEach(t => {
      if (!map.has(t.parentId)) map.set(t.parentId, [])
      map.get(t.parentId).push(t)
    })
    return map
  }, [tasks])

  // Daily checklist tasks — from daily-type projects
  const dailyProjectIds = useMemo(() =>
    new Set(activeProjects.filter(p => p.type === 'daily').map(p => p.id)),
    [activeProjects]
  )

  const groupedDailyTasks = useMemo(() => {
    const projectMap = new Map(activeProjects.map(p => [p.id, p]))
    const groups = new Map()
    tasks
      .filter(t => !t.parentId && t.projectId && dailyProjectIds.has(t.projectId))
      .forEach(task => {
        if (!groups.has(task.projectId)) {
          groups.set(task.projectId, {
            projectName: projectMap.get(task.projectId)?.name ?? 'Uncategorized',
            tasks: [],
          })
        }
        groups.get(task.projectId).tasks.push(task)
      })
    return Array.from(groups.values())
      .map(g => ({ ...g, tasks: g.tasks.sort((a, b) => a.text.localeCompare(b.text)) }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName))
  }, [tasks, dailyProjectIds, activeProjects])

  const visibleTasks = useMemo(() => {
    const eligible = tasks.filter(t =>
      !t.parentId &&
      !t.completedAt &&
      t.dueDate &&
      (isOverdue(t.dueDate) || isToday(parseISO(t.dueDate)))
    )
    if (sort === 'priority') {
      return eligible.sort((a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
      )
    }
    if (sort === 'project') {
      return eligible.sort((a, b) => {
        const na = projectMapById.get(a.projectId)?.name ?? ''
        const nb = projectMapById.get(b.projectId)?.name ?? ''
        return na.localeCompare(nb)
      })
    }
    // Default: overdue first (oldest first), then today
    return eligible.sort((a, b) => {
      const aOver = isOverdue(a.dueDate)
      const bOver = isOverdue(b.dueDate)
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [tasks, sort, projectMapById])

  function celebrate() {
    setShowBanner(true)
    confetti({ particleCount: 160, spread: 75, origin: { y: 0.55 }, colors: ['#C4A24E', '#0C1A33', '#2D8F65', '#ffffff'] })
    setTimeout(() => setShowBanner(false), 3000)
  }

  // Fire when Due & Overdue list empties (but not on initial load when tasks.length is 0)
  const prevVisibleCount = useRef(null)
  useEffect(() => {
    if (prevVisibleCount.current === null) { prevVisibleCount.current = visibleTasks.length; return }
    if (visibleTasks.length === 0 && prevVisibleCount.current > 0) {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (celebratedRef.current.dueOverdue !== today) {
        celebratedRef.current.dueOverdue = today
        celebrate()
      }
    }
    prevVisibleCount.current = visibleTasks.length
  }, [visibleTasks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fire when all daily tasks are done
  const allDailyDone = groupedDailyTasks.length > 0 &&
    groupedDailyTasks.every(g => g.tasks.every(t => t.lastCompletedDate === TODAY))
  const prevAllDailyDone = useRef(null)
  useEffect(() => {
    if (prevAllDailyDone.current === null) { prevAllDailyDone.current = allDailyDone; return }
    if (allDailyDone && !prevAllDailyDone.current) {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (celebratedRef.current.daily !== today) {
        celebratedRef.current.daily = today
        celebrate()
      }
    }
    prevAllDailyDone.current = allDailyDone
  }, [allDailyDone]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="flex items-center mb-2 gap-2">
            <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] flex-1">
              DUE &amp; OVERDUE
            </p>
            <div className="flex gap-0.5 rounded-lg p-0.5 bg-white" style={{ border: '1px solid rgba(12,26,51,0.08)' }}>
              {[['due', 'Due Date'], ['priority', 'Priority'], ['project', 'Project']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  className="px-2 py-1 rounded text-[11px] font-medium transition"
                  style={sort === val
                    ? { background: '#C4A24E', color: 'white' }
                    : { color: '#8B93A1' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {visibleTasks.map(task => (
              <TodayTaskRow
                key={task.id}
                task={task}
                projectInfo={projectMapById.get(task.projectId) ?? null}
                subtasks={subtaskMap.get(task.id) ?? []}
                onComplete={handleComplete}
                onCompleteSubtask={onCompleteSubtask}
                onOpenEdit={setEditingTask}
              />
            ))}
          </div>
        </div>
      )}

      {groupedDailyTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">
            Daily Checklist
          </p>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {groupedDailyTasks.map((group, gi) => (
              <div key={group.projectName}>
                <div className={gi > 0 ? 'mt-2' : ''} style={{ paddingTop: '10px', paddingBottom: '4px' }}>
                  <p
                    className="text-[11px] font-medium uppercase tracking-[1.5px]"
                    style={{ color: '#8B93A1' }}
                  >
                    {group.projectName}
                  </p>
                  <div style={{ height: '1px', background: 'rgba(12,26,51,0.06)', marginTop: '4px' }} />
                </div>
                {group.tasks.map(task => (
                  <DailyChecklistRow
                    key={task.id}
                    task={task}
                    onToggle={onToggleDailyTask}
                  />
                ))}
              </div>
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

      <CelebrationBanner visible={showBanner} />
    </div>
  )
}

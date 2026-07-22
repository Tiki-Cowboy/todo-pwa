import { useState, useMemo, useEffect, useRef } from 'react'
import { isToday, parseISO, format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
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

function ChainLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a2.5 2.5 0 003.5.2l1.8-1.8a2.5 2.5 0 00-3.5-3.5L6.7 4" />
      <path d="M8 6a2.5 2.5 0 00-3.5-.2L2.7 7.6a2.5 2.5 0 003.5 3.5L7.3 10" />
    </svg>
  )
}

function CelebrationBanner({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          <div
            className="rounded-2xl px-6 py-5 text-center shadow-2xl max-w-xs mx-4"
            style={{ background: '#0C1A33', border: '1px solid rgba(196,162,78,0.3)' }}
          >
            <p className="text-2xl mb-2">🌴</p>
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
  const navigate = useNavigate()
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
          <div className="flex items-center gap-1.5">
            {task.fuChain?.enabled && (
              <span title="Follow-up chain" className="text-text-tertiary shrink-0"><ChainLinkIcon /></span>
            )}
            <p className="flex-1 text-sm text-text-primary leading-snug break-words">{task.text}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-text-tertiary">{task.category}</span>
            {projectInfo && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); navigate(`/projects/${projectInfo.id}`) }}
                title={`Open ${projectInfo.name}`}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md hover:opacity-75 transition-opacity"
                style={{ background: projectInfo.color + '22', color: projectInfo.color }}
              >
                {projectInfo.name}
              </button>
            )}
            {due && (
              <span className="text-xs font-medium" style={{ color: overdue ? '#C0392B' : '#C4A24E' }}>
                {overdue && '⚠ '}{due.label}
              </span>
            )}
          </div>
          {(task.dealUrl || task.contactUrl) && (
            <div className="flex flex-wrap gap-2 mt-0.5">
              {task.dealUrl && (
                <a href={task.dealUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-[#4A6FA5] hover:underline">
                  {task.dealName || 'HubSpot Deal'} ↗
                </a>
              )}
              {task.contactUrl && (
                <a href={task.contactUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-[#4A6FA5] hover:underline">
                  {task.contactName || 'HubSpot Contact'} ↗
                </a>
              )}
            </div>
          )}
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
          {sub.fuChain?.enabled && (
            <span title="Follow-up chain" className="text-text-tertiary shrink-0"><ChainLinkIcon /></span>
          )}
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

function FrequentChecklistRow({ task, onComplete }) {
  const [completing, setCompleting] = useState(false)
  const due = task.recurrence?.nextDueDate ? formatDueDate(task.recurrence.nextDueDate) : null

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
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(12,26,51,0.05)' }}
    >
      <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ background: due?.overdue ? '#C0392B' : 'rgba(155,127,212,0.4)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug">{task.text}</p>
        {due && (
          <p className="text-xs mt-0.5" style={{ color: due.overdue ? '#C0392B' : '#8B93A1' }}>
            {due.overdue && '⚠ '}{due.label}
          </p>
        )}
      </div>
      <button
        onClick={handleComplete}
        disabled={completing}
        className="w-[26px] h-[26px] rounded-full shrink-0 disabled:opacity-40"
        style={{ background: 'transparent', border: '1.5px solid rgba(12,26,51,0.2)' }}
        aria-label="Mark done"
      />
    </motion.div>
  )
}

export default function HomeTab({
  tasks,
  completedTasks = [],
  categories,
  activeProjects = [],
  fuTemplates = [],
  onComplete,
  onCompleteSubtask,
  onUpdate,
  onToggleDailyTask,
  onCompleteFrequentTask,
}) {
  const toast = useToast()
  const [editingTask, setEditingTask] = useState(null)
  const [sort, setSort] = useState('due')
  const [groupByProject, setGroupByProject] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  // Tracks which lists have already celebrated today — { dueOverdue: 'yyyy-MM-dd', daily: 'yyyy-MM-dd' }
  const celebratedRef = useRef({ dueOverdue: null, daily: null })

  const todayDate = format(new Date(), 'EEEE, MMMM d')

  const projectMapById = useMemo(() =>
    new Map(activeProjects.map((p, i) => [p.id, { id: p.id, name: p.name, color: ACCENT_COLORS[i % ACCENT_COLORS.length] }])),
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

  // Daily checklist tasks — driven by each task's own type, grouped by its project (any project can mix task types)
  const groupedDailyTasks = useMemo(() => {
    const projectMap = new Map(activeProjects.map(p => [p.id, p]))
    const groups = new Map()
    tasks
      .filter(t => !t.parentId && t.type === 'daily')
      .forEach(task => {
        const key = task.projectId ?? '__general__'
        if (!groups.has(key)) {
          groups.set(key, {
            projectName: task.projectId ? (projectMap.get(task.projectId)?.name ?? 'Uncategorized') : 'General',
            tasks: [],
          })
        }
        groups.get(key).tasks.push(task)
      })
    return Array.from(groups.values())
      .map(g => ({ ...g, tasks: g.tasks.sort((a, b) => a.text.localeCompare(b.text)) }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName))
  }, [tasks, activeProjects])

  // Frequents checklist — driven by each task's own type, only currently-due tasks
  const groupedFrequentTasks = useMemo(() => {
    const projectMap = new Map(activeProjects.map(p => [p.id, p]))
    const groups = new Map()
    tasks
      .filter(t => !t.parentId && t.type === 'frequent' && t.recurrence?.nextDueDate && t.recurrence.nextDueDate <= TODAY)
      .forEach(task => {
        const key = task.projectId ?? '__general__'
        if (!groups.has(key)) {
          groups.set(key, {
            projectName: task.projectId ? (projectMap.get(task.projectId)?.name ?? 'Uncategorized') : 'General',
            tasks: [],
          })
        }
        groups.get(key).tasks.push(task)
      })
    return Array.from(groups.values())
      .map(g => ({ ...g, tasks: g.tasks.sort((a, b) => a.recurrence.nextDueDate.localeCompare(b.recurrence.nextDueDate)) }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName))
  }, [tasks, activeProjects])

  const visibleTasks = useMemo(() => {
    const eligible = tasks.filter(t =>
      !t.parentId &&
      !t.completedAt &&
      (t.type ?? 'standard') === 'standard' &&
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

  const groupedVisibleTasks = useMemo(() => {
    const groups = {}
    visibleTasks.forEach(task => {
      const cat = task.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(task)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [visibleTasks])

  // Each category's tasks further split into per-project subgroups (General last)
  const groupedVisibleTasksByProject = useMemo(() => {
    return groupedVisibleTasks.map(([categoryName, catTasks]) => {
      const byProject = new Map()
      catTasks.forEach(task => {
        const key = task.projectId ?? '__general__'
        if (!byProject.has(key)) byProject.set(key, [])
        byProject.get(key).push(task)
      })
      const subgroups = [...byProject.entries()]
        .map(([key, subTasks]) => ({
          key,
          projectName: key === '__general__' ? 'General' : (projectMapById.get(key)?.name ?? 'General'),
          tasks: subTasks,
        }))
        .sort((a, b) => {
          if (a.key === '__general__') return 1
          if (b.key === '__general__') return -1
          return a.projectName.localeCompare(b.projectName)
        })
      return [categoryName, subgroups]
    })
  }, [groupedVisibleTasks, projectMapById])

  const completedToday = useMemo(() =>
    completedTasks.filter(t => t.completedAt && isToday(t.completedAt)),
    [completedTasks]
  )

  const completedTodayByCategory = useMemo(() => {
    const groups = {}
    completedToday.forEach(t => {
      const cat = t.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [completedToday])

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
          <div className="flex items-center mb-2 gap-2 flex-wrap">
            <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] flex-1">
              DUE &amp; OVERDUE
            </p>
            <button
              onClick={() => setGroupByProject(g => !g)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium transition"
              style={groupByProject
                ? { background: '#0C1A33', color: '#F5EDD8' }
                : { background: 'white', color: '#8B93A1', border: '1px solid rgba(12,26,51,0.08)' }}
            >
              Group by Project
            </button>
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
            {(groupByProject ? groupedVisibleTasksByProject : groupedVisibleTasks).map(([categoryName, catTasksOrSubgroups], gi) => (
              <div key={categoryName}>
                <div className={gi > 0 ? 'mt-3' : ''} style={{ paddingTop: '10px', paddingBottom: '6px' }}>
                  <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-primary">
                    {categoryName}
                  </p>
                  <div style={{ height: '2px', background: 'rgba(196,162,78,0.4)', marginTop: '4px', width: '28px', borderRadius: '2px' }} />
                </div>
                {groupByProject ? (
                  catTasksOrSubgroups.map((sub, si) => (
                    <div key={sub.key}>
                      <div className={si > 0 ? 'mt-1.5' : ''} style={{ paddingTop: '4px', paddingBottom: '2px' }}>
                        <p className="text-[10px] font-medium uppercase tracking-[1px] pl-2" style={{ color: '#8B93A1' }}>
                          {sub.projectName}
                        </p>
                      </div>
                      {sub.tasks.map(task => (
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
                  ))
                ) : (
                  catTasksOrSubgroups.map(task => (
                    <TodayTaskRow
                      key={task.id}
                      task={task}
                      projectInfo={projectMapById.get(task.projectId) ?? null}
                      subtasks={subtaskMap.get(task.id) ?? []}
                      onComplete={handleComplete}
                      onCompleteSubtask={onCompleteSubtask}
                      onOpenEdit={setEditingTask}
                    />
                  ))
                )}
              </div>
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

      {groupedFrequentTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">
            Frequents
          </p>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {groupedFrequentTasks.map((group, gi) => (
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
                  <FrequentChecklistRow
                    key={task.id}
                    task={task}
                    onComplete={onCompleteFrequentTask}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {completedToday.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">
            Completed Today
          </p>
          <div className="bg-white rounded-2xl px-4 pb-1" style={cardStyle}>
            {completedTodayByCategory.map(([categoryName, catTasks], gi) => (
              <div key={categoryName}>
                <div className={gi > 0 ? 'mt-2' : ''} style={{ paddingTop: '10px', paddingBottom: '4px' }}>
                  <p className="text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: '#8B93A1' }}>
                    {categoryName}
                  </p>
                  <div style={{ height: '1px', background: 'rgba(12,26,51,0.06)', marginTop: '4px' }} />
                </div>
                {catTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: '1px solid rgba(12,26,51,0.05)' }}
                  >
                    <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ background: 'rgba(45,143,101,0.4)' }} />
                    <p className="flex-1 text-sm text-text-tertiary line-through leading-snug break-words">{task.text}</p>
                    <span className="text-[10px] text-text-tertiary shrink-0 whitespace-nowrap">
                      {format(task.completedAt, 'h:mm a')}
                    </span>
                  </div>
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
        fuTemplates={fuTemplates}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />

      <CelebrationBanner visible={showBanner} />
    </div>
  )
}

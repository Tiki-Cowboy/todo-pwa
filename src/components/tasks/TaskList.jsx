import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import { isOverdue } from '../../lib/dateUtils'

const SORT_OPTIONS = [
  { value: 'default',        label: 'Default' },
  { value: 'priority-high',  label: 'Priority: High → Low' },
  { value: 'priority-low',   label: 'Priority: Low → High' },
  { value: 'due-date',       label: 'Due Date: Soonest' },
  { value: 'name-asc',       label: 'Name: A → Z' },
  { value: 'name-desc',      label: 'Name: Z → A' },
]

const PRIORITY_ORDER = { High: 1, Medium: 2, Low: 3 }

function sortTasks(tasks, sortBy) {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority-high': return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      case 'priority-low':  return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      case 'due-date': {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      case 'name-asc':  return a.text.localeCompare(b.text)
      case 'name-desc': return b.text.localeCompare(a.text)
      default: return a.createdAt - b.createdAt
    }
  })
}

function todayCompletionPct(tasks, completedTasks) {
  const today = new Date().toDateString()
  const completedToday = completedTasks.filter(t => t.completedAt?.toDateString() === today)
  const total = tasks.length + completedToday.length
  if (total === 0) return null
  return Math.round((completedToday.length / total) * 100)
}

export default function TaskList({
  tasks,
  completedTasks,
  categories,
  onComplete,
  onDelete,
  onOpenEdit,
  onAddSubtask,
  addingSubtaskFor,
  subtaskInputEl,
}) {
  const [sort, setSort]           = useState('default')
  const [collapsed, setCollapsed] = useState({})

  const topLevel   = useMemo(() => tasks.filter(t => !t.parentId), [tasks])
  const subtaskMap = useMemo(() => {
    const map = {}
    tasks.filter(t => t.parentId).forEach(t => {
      if (!map[t.parentId]) map[t.parentId] = []
      map[t.parentId].push(t)
    })
    return map
  }, [tasks])

  const sorted = useMemo(() => sortTasks(topLevel, sort), [topLevel, sort])

  // Sort overdue tasks to the top within each category
  const sortedWithOverdue = useMemo(() =>
    [...sorted].sort((a, b) => {
      const aOver = isOverdue(a.dueDate) ? -1 : 0
      const bOver = isOverdue(b.dueDate) ? -1 : 0
      return aOver - bOver
    }),
    [sorted]
  )

  const categoryNames = useMemo(() => {
    const names = new Set(sortedWithOverdue.map(t => t.category))
    return [...names].sort()
  }, [sortedWithOverdue])

  const pct = todayCompletionPct(topLevel, completedTasks)

  function toggleCollapse(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  if (topLevel.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-text-tertiary gap-3">
        <span className="text-5xl">🤠</span>
        <p className="text-lg text-text-secondary">Nothing on the docket.</p>
        <p className="text-sm">Add a task above to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-text-tertiary">Sort:</span>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-white border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-gold transition"
          style={{ borderColor: 'rgba(12, 26, 51, 0.12)' }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tasks grouped by category */}
      {categoryNames.map(cat => {
        const catTasks = sortedWithOverdue.filter(t => t.category === cat)
        const isCollapsed = collapsed[cat]
        return (
          <div key={cat} className="mb-6">
            {/* Section label */}
            <button
              onClick={() => toggleCollapse(cat)}
              className="flex items-center gap-2 w-full mb-3 group"
            >
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">
                {cat}
              </span>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(12,26,51,0.06)', color: '#8B93A1' }}
              >
                {catTasks.length}
              </span>
              <div className="flex-1 h-px ml-1" style={{ background: 'rgba(12,26,51,0.08)' }} />
              <span className="text-text-tertiary text-xs group-hover:text-text-secondary transition">
                {isCollapsed ? '▶' : '▼'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {sortedWithOverdue.filter(t => t.category === cat).map((task, i) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.04 }}
                    >
                      <TaskItem
                        task={task}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onOpenEdit={onOpenEdit}
                        onAddSubtask={onAddSubtask}
                      >
                        {addingSubtaskFor === task.id && subtaskInputEl}
                        {(subtaskMap[task.id] ?? []).map(sub => (
                          <TaskItem
                            key={sub.id}
                            task={sub}
                            isSubtask
                            onComplete={onComplete}
                            onDelete={onDelete}
                            onOpenEdit={onOpenEdit}
                            onAddSubtask={() => {}}
                          />
                        ))}
                      </TaskItem>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Completion pct */}
      {pct !== null && (
        <div
          className="text-right text-sm text-text-tertiary mt-2 pb-4 pt-4"
          style={{ borderTop: '1px solid rgba(12,26,51,0.08)' }}
        >
          Today's completion:{' '}
          <span className="font-semibold text-base" style={{ color: '#C4A24E' }}>{pct}%</span>
        </div>
      )}
    </div>
  )
}

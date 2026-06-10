import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProjectCard from './ProjectCard'
import ProjectModal from './ProjectModal'
import TaskEditModal from '../tasks/TaskEditModal'
import { useToast } from '../ui/Toast'
import { isOverdue } from '../../lib/dateUtils'

// ── Manage Categories Panel ────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#5b9bd5', '#9b7fd4', '#2D8F65', '#C4A24E',
  '#C0392B', '#e87c4a', '#4ab8b8', '#4A6FA5',
]

function ManageCategoriesPanel({ categories, onAddCategory, onDeleteCategory }) {
  const toast = useToast()
  const [catName, setCatName]         = useState('')
  const [color, setColor]             = useState(PRESET_COLORS[0])
  const [confirmCatId, setConfirmCatId] = useState(null)
  const [saving, setSaving]           = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = catName.trim()
    if (!trimmed) return
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast('A category with that name already exists', 'error'); return
    }
    setSaving(true)
    try {
      await onAddCategory(trimmed, color)
      setCatName(''); setColor(PRESET_COLORS[0])
      toast('Category added')
    } catch { toast('Failed to add category', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(cat) {
    if (confirmCatId !== cat.id) {
      setConfirmCatId(cat.id); setTimeout(() => setConfirmCatId(null), 3000); return
    }
    try {
      await onDeleteCategory(cat.id, cat.name)
      setConfirmCatId(null)
      toast(`"${cat.name}" deleted — tasks moved to Uncategorized`)
    } catch { toast('Failed to delete category', 'error') }
  }

  const panelCardStyle = { border: '1px solid rgba(12,26,51,0.06)' }
  const divider = { borderBottom: '1px solid rgba(12,26,51,0.06)' }

  return (
    <div className="mt-2 space-y-4">
      {/* Add form */}
      <div className="bg-white rounded-2xl p-5" style={panelCardStyle}>
        <p className="text-sm font-medium text-text-primary mb-4">Add Category</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            placeholder="Category name"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            maxLength={32}
            className="w-full bg-page-bg border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold transition"
            style={{ borderColor: 'rgba(12,26,51,0.12)' }}
          />
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c} type="button" onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: color === c ? '#0C1A33' : 'transparent', transform: color === c ? 'scale(1.15)' : undefined }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !catName.trim()}
            className="text-sm font-semibold px-5 py-2 rounded-xl text-white disabled:opacity-50"
            style={{ background: '#C4A24E' }}
          >
            {saving ? 'Adding…' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={panelCardStyle}>
        <div className="px-5 py-3" style={{ ...divider, background: '#F4F2ED' }}>
          <p className="text-sm font-medium text-text-primary">Your Categories</p>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {categories.map((cat, i) => (
              <motion.li
                key={cat.id} layout
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < categories.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-text-primary">{cat.name}</span>
                  {cat.isDefault && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-text-tertiary" style={{ background: 'rgba(12,26,51,0.06)' }}>
                      default
                    </span>
                  )}
                </div>
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition"
                    style={confirmCatId === cat.id
                      ? { background: '#C0392B', color: 'white', borderColor: '#C0392B' }
                      : { background: 'transparent', color: '#8B93A1', borderColor: 'rgba(12,26,51,0.12)' }}
                  >
                    {confirmCatId === cat.id ? 'Sure?' : '✕ Delete'}
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputClass = "bg-white border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 transition"
const inputBorder = { borderColor: 'rgba(12, 26, 51, 0.12)', '--tw-ring-color': '#C4A24E' }
const cardStyle = { border: '1px solid rgba(12,26,51,0.06)' }

// ── Hero Card ──────────────────────────────────────────────────────────────────

const STAT_COLORS = {
  active:    '#2D8F65',
  'on-hold': '#8B7332',
  archived:  '#8B93A1',
  completed: '#4A6FA5',
  pct:       '#C4A24E',
}

function HeroCard({ projects }) {
  const active    = projects.filter(p => p.status === 'active').length
  const onHold    = projects.filter(p => p.status === 'on-hold').length
  const archived  = projects.filter(p => p.status === 'archived').length
  const completed = projects.filter(p => p.status === 'completed').length
  const total     = projects.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : null

  const stats = [
    { label: 'Active',    value: active,                      color: STAT_COLORS.active },
    { label: 'On Hold',   value: onHold,                      color: STAT_COLORS['on-hold'] },
    { label: 'Archived',  value: archived,                    color: STAT_COLORS.archived },
    { label: 'Completed', value: completed,                   color: STAT_COLORS.completed },
    { label: '% Done',    value: pct !== null ? `${pct}%` : '—', color: STAT_COLORS.pct },
  ]

  return (
    <div className="bg-white rounded-2xl mb-4 overflow-hidden" style={cardStyle}>
      <div className="grid grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center justify-center py-4 px-2"
            style={{ borderRight: i < stats.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none' }}
          >
            <span className="text-[22px] font-semibold leading-none" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-[11px] text-text-tertiary mt-1 text-center leading-tight">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Filter Toggle ──────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'on-hold',   label: 'On Hold' },
  { value: 'archived',  label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

function FilterToggle({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0"
          style={value === opt.value
            ? { background: '#0C1A33', color: '#F5EDD8' }
            : { background: 'rgba(12,26,51,0.06)', color: '#5A6478' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── New Project Panel ──────────────────────────────────────────────────────────

function NewProjectPanel({ categories, onSave }) {
  const [name, setName]                 = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [status, setStatus]             = useState('active')
  const [type, setType]                 = useState('standard')
  const [saving, setSaving]             = useState(false)

  const defaultCategory = categories[0]?.name ?? ''

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    await onSave({ name: trimmed, categoryName: categoryName || defaultCategory, status, description: '', type })
    setName('')
    setCategoryName('')
    setStatus('active')
    setType('standard')
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 mb-6 flex flex-col gap-3"
      style={cardStyle}
    >
      <input
        type="text"
        placeholder="New project name…"
        value={name}
        onChange={e => setName(e.target.value)}
        className={`w-full ${inputClass}`}
        style={inputBorder}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={categoryName || defaultCategory}
          onChange={e => setCategoryName(e.target.value)}
          className={`${inputClass} flex-1 min-w-[120px]`}
          style={inputBorder}
        >
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className={inputClass}
          style={inputBorder}
        >
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
        </select>
        {/* Type toggle */}
        <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ background: '#F4F2ED' }}>
          {[{ value: 'standard', label: 'Standard' }, { value: 'daily', label: '↻ Daily' }].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
              style={type === opt.value
                ? { background: 'white', color: '#0C1A33', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { background: 'transparent', color: '#8B93A1' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="font-semibold px-5 py-2.5 rounded-xl transition text-sm ml-auto text-white disabled:opacity-50"
          style={{ background: '#C4A24E' }}
        >
          {saving ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

export default function ProjectsTab({
  tasks,
  categories,
  projects = [],
  activeProjects,
  onAdd,
  onAddSubtask,
  onComplete,
  onDelete,
  onUpdate,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onToggleDailyTask,
  onAddCategory,
  onDeleteCategory,
}) {
  const toast = useToast()
  const [editingTask, setEditingTask]           = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject]     = useState(null)
  const [statusFilter, setStatusFilter]         = useState('all')
  const [managingCats, setManagingCats]         = useState(false)

  // Which projects to show based on filter
  const visibleProjects = useMemo(() =>
    statusFilter === 'all'
      ? projects
      : projects.filter(p => p.status === statusFilter),
    [projects, statusFilter]
  )

  const topLevel = useMemo(() => tasks.filter(t => !t.parentId && !t.completedAt), [tasks])

  const projectTaskMap = useMemo(() => {
    const map = {}
    visibleProjects.forEach(p => { map[p.id] = [] })
    // Include both top-level and subtasks so ProjectCard can build the hierarchy
    tasks.filter(t => !t.completedAt).forEach(t => {
      if (t.projectId && map[t.projectId] !== undefined) map[t.projectId].push(t)
    })
    return map
  }, [tasks, visibleProjects])

  // Standalone tasks only shown in All / Active view
  const standaloneTasks = useMemo(() =>
    (statusFilter === 'all' || statusFilter === 'active')
      ? topLevel.filter(t => !t.projectId)
      : [],
    [topLevel, statusFilter]
  )

  const standaloneByCategory = useMemo(() => {
    const map = {}
    standaloneTasks.forEach(t => {
      if (!map[t.category]) map[t.category] = []
      map[t.category].push(t)
    })
    return map
  }, [standaloneTasks])

  const projectsByCategory = useMemo(() => {
    const map = {}
    visibleProjects.forEach(p => {
      if (!map[p.categoryName]) map[p.categoryName] = []
      map[p.categoryName].push(p)
    })
    return map
  }, [visibleProjects])

  const categoryNames = useMemo(() => {
    const names = new Set([
      ...Object.keys(standaloneByCategory),
      ...Object.keys(projectsByCategory),
    ])
    return [...names].sort()
  }, [standaloneByCategory, projectsByCategory])

  async function handleAdd(data) {
    try { await onAdd(data) } catch { toast('Failed to add task', 'error') }
  }

  async function handleAddProject({ name, categoryName, status, description, type }) {
    try {
      await onAddProject(name, categoryName, status, description, type)
      toast('Project created')
    } catch { toast('Failed to create project', 'error') }
  }

  async function handleSaveEditProject(data) {
    try {
      await onUpdateProject(editingProject.id, data)
      toast('Project updated')
    } catch { toast('Failed to update project', 'error') }
    setEditingProject(null)
  }

  async function handleDeleteProject(projectId) {
    try {
      await onDeleteProject(projectId)
      toast('Project deleted')
    } catch { toast('Failed to delete project', 'error') }
  }

  async function handleComplete(taskId, parentId) {
    try {
      if (parentId) await onComplete(taskId, parentId)
      else await onComplete(taskId)
    } catch { toast('Failed to complete task', 'error') }
  }

  async function handleDelete(taskId) {
    try { await onDelete(taskId) } catch { toast('Failed to delete task', 'error') }
  }

  async function handleSaveEdit(taskId, updates) {
    try { await onUpdate(taskId, updates) } catch { toast('Failed to save changes', 'error') }
  }

  const isEmpty = categoryNames.length === 0

  return (
    <div>
      <h2 className="text-[22px] font-medium text-text-primary mb-4">Projects</h2>

      <HeroCard projects={projects} />

      <FilterToggle value={statusFilter} onChange={setStatusFilter} />

      <NewProjectPanel categories={categories} onSave={handleAddProject} />

      {isEmpty && (
        <div className="flex flex-col items-center py-12 text-text-tertiary gap-3">
          <span className="text-5xl">🗂️</span>
          <p className="text-lg text-text-secondary">
            {statusFilter === 'all' ? 'No projects yet.' : `No ${statusFilter} projects.`}
          </p>
          {statusFilter === 'all' && (
            <p className="text-sm">Name your first project above to get started.</p>
          )}
        </div>
      )}

      {categoryNames.map(cat => (
        <div key={cat} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px]">{cat}</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(12,26,51,0.08)' }} />
          </div>

          {/* Standalone tasks */}
          {(standaloneByCategory[cat] ?? []).map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden mb-2 flex items-start gap-3 px-4 py-3 hover:shadow-sm transition-shadow"
              style={{
                ...cardStyle,
                borderLeft: `3px solid ${isOverdue(task.dueDate) ? '#C0392B' : ({ High: '#C0392B', Medium: '#C4A24E', Low: '#2D8F65' }[task.priority] ?? '#8B93A1')}`,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{task.text}</p>
              </div>
              <button
                onClick={() => setEditingTask(task)}
                className="text-xs text-text-tertiary hover:text-text-secondary transition shrink-0"
              >
                Edit
              </button>
              <button
                onClick={() => handleComplete(task.id)}
                className="w-[22px] h-[22px] rounded-full shrink-0"
                style={{ border: '1.5px solid rgba(12,26,51,0.15)' }}
                aria-label="Complete"
              />
            </motion.div>
          ))}

          {/* Project cards — 2-col grid on md+ */}
          {(projectsByCategory[cat] ?? []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(projectsByCategory[cat] ?? []).map((project, i) => {
                const projectTasks = projectTaskMap[project.id] ?? []
                const hasOverdue = projectTasks.some(t => isOverdue(t.dueDate))
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={i}
                    tasks={projectTasks}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onOpenEdit={setEditingTask}
                    onAddTask={handleAdd}
                    onAddSubtask={onAddSubtask}
                    defaultExpanded={hasOverdue}
                    onEditProject={p => { setEditingProject(p); setShowProjectModal(true) }}
                    onDeleteProject={handleDeleteProject}
                    onToggleDailyTask={onToggleDailyTask}
                  />
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Manage Categories */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(12,26,51,0.08)' }}>
        <button
          onClick={() => setManagingCats(o => !o)}
          className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="2" />
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41" />
          </svg>
          <span>Manage Categories</span>
          <span className="text-[11px]">{managingCats ? '▾' : '▶'}</span>
        </button>
        <AnimatePresence initial={false}>
          {managingCats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ManageCategoriesPanel
                categories={categories}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TaskEditModal
        task={editingTask}
        categories={categories}
        activeProjects={activeProjects}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />

      <AnimatePresence>
        {showProjectModal && (
          <ProjectModal
            categories={categories}
            project={editingProject}
            onSave={editingProject ? handleSaveEditProject : handleAddProject}
            onClose={() => { setShowProjectModal(false); setEditingProject(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ACCENT_COLORS, StatusPill, HubSpotLinks,
  DailyTaskRow, FrequentTaskRow, TaskRow, SubtaskRow, SubtaskAddRow,
} from './ProjectCard'
import CompletedByDay from '../reporting/CompletedByDay'
import TaskEditModal from '../tasks/TaskEditModal'
import RecurrencePicker from '../tasks/RecurrencePicker'
import TaskTypeToggle from '../tasks/TaskTypeToggle'
import { initialDueDate } from '../../lib/recurrence'
import { useToast } from '../ui/Toast'

const TODAY = new Date().toISOString().split('T')[0]

function accentForProject(projectId) {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0
  return ACCENT_COLORS[hash % ACCENT_COLORS.length]
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,3 4,8 10,13" />
    </svg>
  )
}

function AddTaskRow({ project, onAdd }) {
  const [text, setText]         = useState('')
  const [type, setType]         = useState('standard')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate]   = useState('')
  const [recurrence, setRecurrence] = useState({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
  const [saving, setSaving]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    const base = { text: trimmed, priority, category: project.categoryName, projectId: project.id, type }
    if (type === 'frequent') {
      await onAdd({ ...base, recurrence: { ...recurrence, nextDueDate: initialDueDate(recurrence, TODAY) } })
    } else if (type === 'daily') {
      await onAdd(base)
    } else {
      await onAdd({ ...base, dueDate: dueDate || null })
    }
    setText(''); setType('standard'); setPriority('Medium'); setDueDate('')
    setRecurrence({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="py-3" style={{ borderTop: '1px solid rgba(12,26,51,0.06)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Task description…"
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 min-w-[160px] text-sm bg-page-bg border rounded-lg px-3 py-1.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold"
          style={{ borderColor: 'rgba(12,26,51,0.12)' }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="text-xs bg-page-bg border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none"
          style={{ borderColor: 'rgba(12,26,51,0.12)' }}
        >
          {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p} Priority</option>)}
        </select>
        {type === 'standard' && (
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-xs bg-page-bg border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none"
            style={{ borderColor: 'rgba(12,26,51,0.12)', colorScheme: 'light' }}
          />
        )}
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="text-xs font-medium text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ background: '#C4A24E' }}
        >
          Add
        </button>
      </div>
      <div className="mt-2">
        <TaskTypeToggle value={type} onChange={setType} />
      </div>
      {type === 'frequent' && (
        <div className="mt-2">
          <RecurrencePicker value={recurrence} onChange={setRecurrence} />
        </div>
      )}
    </form>
  )
}

export default function ProjectDetailView({
  tasks,
  completedTasks,
  projects,
  categories,
  activeProjects,
  fuTemplates,
  onAdd,
  onAddSubtask,
  onComplete,
  onDelete,
  onUpdate,
  onUpdateProject,
  onToggleDailyTask,
  onCompleteFrequentTask,
}) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [editingTask, setEditingTask]           = useState(null)
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null)
  const [collapsedSubtasks, setCollapsedSubtasks] = useState(new Set())

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId])

  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId])
  const projectCompleted = useMemo(() => completedTasks.filter(t => t.projectId === projectId), [completedTasks, projectId])

  const topLevelTasks = useMemo(() => projectTasks.filter(t => !t.parentId), [projectTasks])
  const subtaskMap = useMemo(() => {
    const map = new Map()
    projectTasks.filter(t => t.parentId).forEach(t => {
      if (!map.has(t.parentId)) map.set(t.parentId, [])
      map.get(t.parentId).push(t)
    })
    return map
  }, [projectTasks])

  // Blended progress across mixed task types: standard tasks count against their
  // historical completion record, daily/frequent tasks count against their current cycle.
  const { doneCount, totalCount } = useMemo(() => {
    if (!project) return { doneCount: 0, totalCount: 0 }
    const standardOpen = topLevelTasks.filter(t => (t.type ?? 'standard') === 'standard').length
    const standardDone = projectCompleted.filter(t => (t.type ?? 'standard') === 'standard').length
    const dailyTasks = topLevelTasks.filter(t => t.type === 'daily')
    const dailyDone = dailyTasks.filter(t => t.lastCompletedDate === TODAY).length
    const frequentTasks = topLevelTasks.filter(t => t.type === 'frequent')
    const frequentDone = frequentTasks.filter(t => (t.recurrence?.nextDueDate ?? '') > TODAY).length
    return {
      doneCount: standardDone + dailyDone + frequentDone,
      totalCount: (standardOpen + standardDone) + dailyTasks.length + frequentTasks.length,
    }
  }, [project, topLevelTasks, projectCompleted])

  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : null

  function toggleSubtasks(taskId) {
    setCollapsedSubtasks(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  async function handleAdd(data) {
    try { await onAdd(data) } catch { toast('Failed to add task', 'error') }
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

  if (!project) {
    return (
      <div className="flex flex-col items-center py-16 text-text-tertiary gap-3">
        <p className="text-lg text-text-secondary">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="text-sm font-medium" style={{ color: '#C4A24E' }}>
          Back to Projects
        </button>
      </div>
    )
  }

  const accentColor = accentForProject(project.id)
  const cardStyle = { border: '1px solid rgba(12,26,51,0.06)' }

  return (
    <div>
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition mb-4"
      >
        <BackArrow />
        Back to Projects
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl overflow-hidden mb-4" style={cardStyle}>
        <div className="flex">
          <div className="w-[4px] shrink-0" style={{ background: accentColor }} />
          <div className="flex-1 min-w-0 p-5">
            <h2 className="text-[22px] font-medium text-text-primary leading-snug">{project.name}</h2>

            {project.description && (
              <p className="text-sm text-text-secondary mt-1.5 leading-snug">{project.description}</p>
            )}

            {project.statusNote && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: '#C4A24E' }}>Status</p>
                <p className="text-sm text-text-secondary mt-0.5 leading-snug">{project.statusNote}</p>
              </div>
            )}

            <HubSpotLinks dealName={project.dealName} dealUrl={project.dealUrl} contactName={project.contactName} contactUrl={project.contactUrl} />

            <div className="flex items-center flex-wrap gap-2 mt-3">
              <StatusPill
                status={project.status}
                onStatusChange={onUpdateProject ? newStatus => onUpdateProject(project.id, { status: newStatus }) : undefined}
              />
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg" style={{ background: 'rgba(12,26,51,0.06)', color: '#5A6478' }}>
                {project.categoryName}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,26,51,0.08)' }}>
                {pct !== null && (
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#2D8F65' : accentColor }}
                  />
                )}
              </div>
              <span className="text-xs font-medium text-text-tertiary shrink-0">
                {totalCount > 0 ? `${doneCount} of ${totalCount} · ${pct}%` : 'No tasks yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Open tasks */}
      <div className="bg-white rounded-2xl px-5 mb-4" style={cardStyle}>
        <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] pt-4 pb-1">Open Tasks</p>
        {topLevelTasks.length === 0 && (
          <p className="text-sm text-text-tertiary py-3">No open tasks.</p>
        )}
        {topLevelTasks.map(task => {
          const subs = subtaskMap.get(task.id) ?? []
          const collapsed = collapsedSubtasks.has(task.id)
          return (
            <div key={task.id}>
              {task.type === 'daily' ? (
                <DailyTaskRow
                  task={task}
                  onToggle={onToggleDailyTask}
                  onOpenEdit={setEditingTask}
                  onDelete={handleDelete}
                  onAddSubtask={() => setAddingSubtaskFor(task.id)}
                  hasSubtasks={subs.length > 0}
                  subtasksCollapsed={collapsed}
                  onToggleSubtasks={() => toggleSubtasks(task.id)}
                />
              ) : task.type === 'frequent' ? (
                <FrequentTaskRow
                  task={task}
                  onComplete={onCompleteFrequentTask}
                  onOpenEdit={setEditingTask}
                  onDelete={handleDelete}
                  onAddSubtask={() => setAddingSubtaskFor(task.id)}
                  hasSubtasks={subs.length > 0}
                  subtasksCollapsed={collapsed}
                  onToggleSubtasks={() => toggleSubtasks(task.id)}
                />
              ) : (
                <TaskRow
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onOpenEdit={setEditingTask}
                  onAddSubtask={() => setAddingSubtaskFor(task.id)}
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
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onOpenEdit={setEditingTask}
                />
              ))}
            </div>
          )
        })}
        <AddTaskRow project={project} onAdd={handleAdd} />
      </div>

      {/* Completed, by day */}
      <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-[1.5px] mb-2">Completed</p>
      <CompletedByDay tasks={projectCompleted} projects={[project]} />

      <TaskEditModal
        task={editingTask}
        categories={categories}
        activeProjects={activeProjects}
        fuTemplates={fuTemplates}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />
    </div>
  )
}

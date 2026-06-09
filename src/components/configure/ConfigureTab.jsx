import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../ui/Toast'
import ProjectModal from '../projects/ProjectModal'

// ── Categories ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#5b9bd5', '#9b7fd4', '#2D8F65', '#C4A24E',
  '#C0392B', '#e87c4a', '#4ab8b8', '#4A6FA5',
]

const cardStyle  = { border: '1px solid rgba(12, 26, 51, 0.06)' }
const inputClass = "w-full bg-page-bg border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
const inputBorder = { borderColor: 'rgba(12, 26, 51, 0.12)' }

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'on-hold',   label: 'On Hold' },
  { value: 'archived',  label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_STYLE = {
  active:    { bg: 'rgba(45,143,101,0.08)',  color: '#2D8F65' },
  'on-hold': { bg: 'rgba(196,162,78,0.08)',  color: '#8B7332' },
  archived:  { bg: 'rgba(139,147,161,0.1)',  color: '#8B93A1' },
  completed: { bg: 'rgba(74,111,165,0.1)',   color: '#4A6FA5' },
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.active
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg shrink-0" style={{ background: s.bg, color: s.color }}>
      {status === 'on-hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export default function ConfigureTab({
  categories, onAdd, onDelete,
  projects = [], onUpdateProject, onArchiveProject, onDeleteProject,
}) {
  const toast = useToast()

  // Categories state
  const [catName, setCatName]       = useState('')
  const [color, setColor]           = useState(PRESET_COLORS[0])
  const [confirmCatId, setConfirmCatId] = useState(null)
  const [addingCat, setAddingCat]   = useState(false)

  // Projects state
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject]     = useState(null)
  const [confirmProjId, setConfirmProjId]       = useState(null)
  const [archivedOpen, setArchivedOpen]         = useState(false)

  const activeProjects   = projects.filter(p => p.status !== 'archived' && p.status !== 'completed')
  const archivedProjects = projects.filter(p => p.status === 'archived' || p.status === 'completed')

  // ── Category handlers ──

  async function handleAddCat(e) {
    e.preventDefault()
    const trimmed = catName.trim()
    if (!trimmed) return
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast('A category with that name already exists', 'error'); return
    }
    setAddingCat(true)
    try {
      await onAdd(trimmed, color)
      setCatName(''); setColor(PRESET_COLORS[0])
      toast('Category added')
    } catch { toast('Failed to add category', 'error') }
    finally { setAddingCat(false) }
  }

  async function handleDeleteCat(cat) {
    if (confirmCatId !== cat.id) {
      setConfirmCatId(cat.id); setTimeout(() => setConfirmCatId(null), 3000); return
    }
    try {
      await onDelete(cat.id, cat.name)
      setConfirmCatId(null)
      toast(`"${cat.name}" deleted — tasks moved to Uncategorized`)
    } catch { toast('Failed to delete category', 'error') }
  }

  // ── Project handlers ──

  async function handleSaveProject(data) {
    try {
      await onUpdateProject(editingProject.id, data)
      toast('Project updated')
    } catch { toast('Failed to save project', 'error') }
    setEditingProject(null)
  }

  async function handleArchiveProject(project) {
    try {
      await onArchiveProject(project.id)
      toast(`"${project.name}" archived`)
    } catch { toast('Failed to archive project', 'error') }
  }

  async function handleDeleteProject(project) {
    if (confirmProjId !== project.id) {
      setConfirmProjId(project.id); setTimeout(() => setConfirmProjId(null), 3000); return
    }
    try {
      await onDeleteProject(project.id)
      setConfirmProjId(null)
      toast(`"${project.name}" deleted`)
    } catch { toast('Failed to delete project', 'error') }
  }

  const divider = { borderBottom: '1px solid rgba(12,26,51,0.06)' }

  return (
    <div>
      <h2 className="text-[22px] font-medium text-text-primary mb-6">Configure</h2>

      {/* ── Categories ── */}
      <div className="bg-white rounded-2xl p-5 mb-6" style={cardStyle}>
        <h3 className="font-medium text-text-primary mb-4">Add Category</h3>
        <form onSubmit={handleAddCat} className="space-y-4">
          <input type="text" placeholder="Category name" value={catName}
            onChange={e => setCatName(e.target.value)} maxLength={32}
            className={inputClass} style={inputBorder} />
          <div>
            <p className="text-xs text-text-tertiary mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: c, borderColor: color === c ? '#0C1A33' : 'transparent', transform: color === c ? 'scale(1.15)' : undefined }}
                  aria-label={`Select color ${c}`} />
              ))}
            </div>
          </div>
          {catName.trim() && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-text-primary">{catName.trim()}</span>
            </div>
          )}
          <button type="submit" disabled={addingCat || !catName.trim()}
            className="font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 text-sm text-white"
            style={{ background: '#C4A24E' }}>
            {addingCat ? 'Adding…' : 'Add Category'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden mb-8" style={cardStyle}>
        <div className="px-5 py-3" style={{ ...divider, background: '#F4F2ED' }}>
          <h3 className="font-medium text-text-primary text-sm">Your Categories</h3>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {categories.map((cat, i) => (
              <motion.li key={cat.id} layout
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < categories.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-text-primary">{cat.name}</span>
                  {cat.isDefault && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-text-tertiary"
                      style={{ background: 'rgba(12,26,51,0.06)' }}>default</span>
                  )}
                </div>
                {!cat.isDefault && (
                  <button onClick={() => handleDeleteCat(cat)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition"
                    style={confirmCatId === cat.id
                      ? { background: '#C0392B', color: 'white', borderColor: '#C0392B' }
                      : { background: 'transparent', color: '#8B93A1', borderColor: 'rgba(12,26,51,0.12)' }}>
                    {confirmCatId === cat.id ? 'Sure?' : '✕ Delete'}
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* ── Projects ── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-text-primary">Projects</h3>
      </div>

      {activeProjects.length === 0 && (
        <p className="text-sm text-text-tertiary italic mb-6">No active projects.</p>
      )}

      {activeProjects.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden mb-4" style={cardStyle}>
          <ul>
            {activeProjects.map((project, i) => (
              <li key={project.id} className="flex items-start justify-between gap-3 px-5 py-4"
                style={{ borderBottom: i < activeProjects.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">{project.name}</span>
                    <StatusPill status={project.status} />
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{project.categoryName}</p>
                  {project.description && (
                    <p className="text-xs text-text-secondary mt-1 truncate">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setEditingProject(project); setShowProjectModal(true) }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border transition text-text-secondary"
                    style={{ borderColor: 'rgba(12,26,51,0.12)' }}>Edit</button>
                  <button onClick={() => handleArchiveProject(project)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border transition text-text-secondary"
                    style={{ borderColor: 'rgba(12,26,51,0.12)' }}>Archive</button>
                  <button onClick={() => handleDeleteProject(project)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border transition"
                    style={confirmProjId === project.id
                      ? { background: '#C0392B', color: 'white', borderColor: '#C0392B' }
                      : { color: '#8B93A1', borderColor: 'rgba(12,26,51,0.12)' }}>
                    {confirmProjId === project.id ? 'Sure?' : '✕'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Archived projects (collapsible) */}
      {archivedProjects.length > 0 && (
        <div className="mb-6">
          <button onClick={() => setArchivedOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-text-tertiary mb-3 hover:text-text-secondary transition">
            <span>{archivedOpen ? '▾' : '▶'}</span>
            <span>Archived ({archivedProjects.length})</span>
          </button>
          <AnimatePresence initial={false}>
            {archivedOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="overflow-hidden">
                <div className="bg-white rounded-2xl overflow-hidden" style={cardStyle}>
                  {archivedProjects.map((project, i) => (
                    <div key={project.id} className="flex items-start justify-between gap-3 px-5 py-4"
                      style={{ borderBottom: i < archivedProjects.length - 1 ? '1px solid rgba(12,26,51,0.06)' : 'none', opacity: 0.7 }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{project.name}</span>
                          <StatusPill status="archived" />
                        </div>
                        <p className="text-xs text-text-tertiary">{project.categoryName}</p>
                      </div>
                      <button onClick={() => handleDeleteProject(project)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition shrink-0"
                        style={confirmProjId === project.id
                          ? { background: '#C0392B', color: 'white', borderColor: '#C0392B' }
                          : { color: '#8B93A1', borderColor: 'rgba(12,26,51,0.12)' }}>
                        {confirmProjId === project.id ? 'Sure?' : '✕ Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Project modal */}
      <AnimatePresence>
        {showProjectModal && (
          <ProjectModal
            categories={categories}
            project={editingProject}
            onSave={handleSaveProject}
            onClose={() => { setShowProjectModal(false); setEditingProject(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'on-hold',   label: 'On Hold' },
  { value: 'archived',  label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

const cardStyle  = { border: '1px solid rgba(12, 26, 51, 0.06)' }
const inputClass = "w-full bg-page-bg border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
const inputBorder = { borderColor: 'rgba(12, 26, 51, 0.12)' }

export default function ProjectModal({ categories, project, onSave, onClose }) {
  const [name, setName]               = useState(project?.name ?? '')
  const [categoryName, setCategoryName] = useState(project?.categoryName ?? categories[0]?.name ?? '')
  const [status, setStatus]           = useState(project?.status ?? 'active')
  const [description, setDescription] = useState(project?.description ?? '')
  const [type, setType]               = useState(project?.type ?? 'standard')
  const [saving, setSaving]           = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), categoryName, status, description: description.trim(), type })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        style={cardStyle}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className={inputClass} style={inputBorder}
              placeholder="Project name" autoFocus
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
              <select value={categoryName} onChange={e => setCategoryName(e.target.value)}
                className={inputClass} style={inputBorder}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className={inputClass} style={inputBorder}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Type</label>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F4F2ED' }}>
              {[{ value: 'standard', label: 'Standard' }, { value: 'daily', label: '↻ Daily' }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition"
                  style={type === opt.value
                    ? { background: 'white', color: '#0C1A33', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { background: 'transparent', color: '#8B93A1' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {type === 'daily' && (
              <p className="text-[11px] text-text-tertiary mt-1.5">
                Tasks reset each day — check them off and they'll be back tomorrow.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description <span className="text-text-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className={`${inputClass} resize-none`} style={inputBorder}
              placeholder="Brief notes…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 font-semibold py-2.5 rounded-xl border transition text-text-secondary"
              style={{ borderColor: 'rgba(12,26,51,0.12)', background: '#F4F2ED' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving || !name.trim()}
              className="flex-1 font-semibold py-2.5 rounded-xl transition disabled:opacity-50 text-white"
              style={{ background: '#C4A24E' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

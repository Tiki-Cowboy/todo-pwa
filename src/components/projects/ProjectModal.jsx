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
const errorBorder = { borderColor: '#C0392B' }

function isValidUrl(url) {
  if (!url) return true
  try { new URL(url); return true } catch { return false }
}

export default function ProjectModal({ categories, project, defaultCategoryName, onSave, onClose }) {
  const [name, setName]               = useState(project?.name ?? '')
  const [categoryName, setCategoryName] = useState(project?.categoryName ?? defaultCategoryName ?? categories[0]?.name ?? '')
  const [status, setStatus]           = useState(project?.status ?? 'active')
  const [description, setDescription] = useState(project?.description ?? '')
  const [statusNote, setStatusNote]   = useState(project?.statusNote ?? '')
  const [dealName, setDealName]       = useState(project?.dealName ?? '')
  const [dealUrl, setDealUrl]         = useState(project?.dealUrl ?? '')
  const [contactName, setContactName] = useState(project?.contactName ?? '')
  const [contactUrl, setContactUrl]   = useState(project?.contactUrl ?? '')
  const [urlErrors, setUrlErrors]     = useState({})
  const [saving, setSaving]           = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const errors = {}
    if (!isValidUrl(dealUrl.trim()))     errors.dealUrl = 'Invalid URL'
    if (!isValidUrl(contactUrl.trim())) errors.contactUrl = 'Invalid URL'
    if (Object.keys(errors).length > 0) { setUrlErrors(errors); return }
    setSaving(true)
    await onSave({
      name: name.trim(), categoryName, status, description: description.trim(),
      statusNote: statusNote.trim(),
      dealName: dealName.trim() || null,
      dealUrl: dealUrl.trim() || null,
      contactName: contactName.trim() || null,
      contactUrl: contactUrl.trim() || null,
    })
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
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description <span className="text-text-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className={`${inputClass} resize-none`} style={inputBorder}
              placeholder="Brief notes…"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-xs font-medium text-text-secondary">
                Status Note <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <span className={`text-[10px] ${statusNote.length > 500 ? 'text-red-500' : 'text-text-tertiary'}`}>
                {statusNote.length}/500
              </span>
            </div>
            <textarea
              rows={2} value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              className={`${inputClass} resize-none`} style={inputBorder}
              placeholder="Where does this project stand?"
            />
          </div>
          {/* HubSpot links */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(12,26,51,0.025)', border: '1px solid rgba(12,26,51,0.07)' }}>
            <p className="text-xs font-medium text-text-tertiary">HubSpot Links <span className="font-normal">(optional)</span></p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text" placeholder="Deal name" value={dealName}
                onChange={e => setDealName(e.target.value)}
                className="bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                style={inputBorder}
              />
              <div>
                <input
                  type="text" placeholder="Deal URL" value={dealUrl}
                  onChange={e => { setDealUrl(e.target.value); setUrlErrors(p => ({ ...p, dealUrl: undefined })) }}
                  className="w-full bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                  style={urlErrors.dealUrl ? errorBorder : inputBorder}
                />
                {urlErrors.dealUrl && <p className="text-[10px] text-red-500 mt-0.5">{urlErrors.dealUrl}</p>}
              </div>
              <input
                type="text" placeholder="Contact name" value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                style={inputBorder}
              />
              <div>
                <input
                  type="text" placeholder="Contact URL" value={contactUrl}
                  onChange={e => { setContactUrl(e.target.value); setUrlErrors(p => ({ ...p, contactUrl: undefined })) }}
                  className="w-full bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                  style={urlErrors.contactUrl ? errorBorder : inputBorder}
                />
                {urlErrors.contactUrl && <p className="text-[10px] text-red-500 mt-0.5">{urlErrors.contactUrl}</p>}
              </div>
            </div>
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

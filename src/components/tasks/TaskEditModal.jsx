import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'

const PRIORITIES = ['High', 'Medium', 'Low']

const inputClass = "w-full bg-page-bg border rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
const borderStyle = { borderColor: 'rgba(12, 26, 51, 0.12)' }

export default function TaskEditModal({ task, categories, activeProjects = [], onSave, onClose }) {
  const [text, setText]         = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [projectId, setProjectId] = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (task) {
      setText(task.text)
      setPriority(task.priority)
      setCategory(task.category)
      setDueDate(task.dueDate ?? '')
      setProjectId(task.projectId ?? '')
    }
  }, [task])

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    await onSave(task.id, {
      text:     trimmed,
      priority,
      category,
      dueDate:  dueDate || null,
      projectId: projectId || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {!!task && (
        <Dialog static open={!!task} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              className="w-full sm:max-w-md"
            >
              <DialogPanel
                className="w-full bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
                style={{ border: '1px solid rgba(12, 26, 51, 0.06)' }}
              >
                <DialogTitle className="text-xl font-semibold text-text-primary mb-5">
                  Edit Task
                </DialogTitle>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Task</label>
                    <textarea
                      autoFocus
                      rows={2}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      className={inputClass}
                      style={borderStyle}
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        className={inputClass}
                        style={borderStyle}
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className={inputClass}
                        style={borderStyle}
                      >
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {activeProjects.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Project <span className="text-text-tertiary font-normal">(optional — group this task under a project)</span>
                      </label>
                      <select
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        className={inputClass}
                        style={borderStyle}
                      >
                        <option value="">No project</option>
                        {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Due Date <span className="text-text-tertiary font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className={inputClass}
                      style={{ ...borderStyle, colorScheme: 'light' }}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 font-semibold py-2.5 rounded-xl border transition text-text-secondary hover:text-text-primary"
                      style={{ borderColor: 'rgba(12, 26, 51, 0.12)', background: '#F4F2ED' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !text.trim()}
                      className="flex-1 font-semibold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ background: '#C4A24E' }}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

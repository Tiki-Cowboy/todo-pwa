import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import RecurrencePicker from './RecurrencePicker'
import TaskTypeToggle from './TaskTypeToggle'
import { initialDueDate } from '../../lib/recurrence'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PRIORITIES = ['High', 'Medium', 'Low']

const inputClass = "w-full bg-page-bg border rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
const borderStyle = { borderColor: 'rgba(12, 26, 51, 0.12)' }
const errorBorder = { borderColor: '#C0392B' }

function isValidUrl(url) {
  if (!url) return true
  try { new URL(url); return true } catch { return false }
}

export default function TaskEditModal({ task, categories, activeProjects = [], fuTemplates = [], onSave, onClose }) {
  const [text, setText]           = useState('')
  const [priority, setPriority]   = useState('Medium')
  const [category, setCategory]   = useState('')
  const [dueDate, setDueDate]     = useState('')
  const [projectId, setProjectId] = useState('')
  const [dealName, setDealName]   = useState('')
  const [dealUrl, setDealUrl]     = useState('')
  const [contactName, setContactName] = useState('')
  const [contactUrl, setContactUrl]   = useState('')
  const [urlErrors, setUrlErrors] = useState({})
  const [saving, setSaving]       = useState(false)

  const [fuEnabled, setFuEnabled]   = useState(false)
  const [fuSequence, setFuSequence] = useState([])
  const [fuTemplateId, setFuTemplateId] = useState(null)
  const [addingStep, setAddingStep] = useState(false)
  const [newStepDays, setNewStepDays] = useState('')

  const [recurrence, setRecurrence] = useState({ type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
  const [taskType, setTaskType] = useState('standard')

  const isFrequent = taskType === 'frequent'
  const isDaily = taskType === 'daily'

  useEffect(() => {
    if (task) {
      setText(task.text)
      setPriority(task.priority)
      setCategory(task.category)
      setDueDate(task.dueDate ?? '')
      setProjectId(task.projectId ?? '')
      setDealName(task.dealName ?? '')
      setDealUrl(task.dealUrl ?? '')
      setContactName(task.contactName ?? '')
      setContactUrl(task.contactUrl ?? '')
      setUrlErrors({})
      setFuEnabled(!!task.fuChain?.enabled)
      setFuSequence(task.fuChain?.sequence ?? [])
      setFuTemplateId(task.fuChain?.templateId ?? null)
      setAddingStep(false)
      setNewStepDays('')
      setRecurrence(task.recurrence ?? { type: 'weekly', daysOfWeek: [], dayOfMonth: 1, intervalDays: 7 })
      setTaskType(task.type ?? 'standard')
    }
  }, [task])

  function removeFuStep(index) {
    setFuSequence(s => s.filter((_, i) => i !== index))
    setFuTemplateId(null)
  }

  function handleAddFuStep() {
    const n = parseInt(newStepDays, 10)
    if (!n || n < 1) return
    setFuSequence(s => [...s, n])
    setNewStepDays('')
    setAddingStep(false)
    setFuTemplateId(null)
  }

  function applyFuTemplate(templateId) {
    const tpl = fuTemplates.find(t => t.id === templateId)
    if (!tpl) return
    if (fuSequence.length > 0 && !window.confirm('Replace the current steps with this template?')) return
    setFuSequence([...tpl.sequence])
    setFuTemplateId(templateId)
  }

  function recurrenceUnchanged(a, b) {
    if (!a || !b) return false
    return a.type === b.type &&
      JSON.stringify(a.daysOfWeek ?? []) === JSON.stringify(b.daysOfWeek ?? []) &&
      a.intervalDays === b.intervalDays &&
      a.monthlyMode === b.monthlyMode &&
      JSON.stringify(a.daysOfMonth ?? (a.dayOfMonth ? [a.dayOfMonth] : [])) === JSON.stringify(b.daysOfMonth ?? (b.dayOfMonth ? [b.dayOfMonth] : [])) &&
      a.weekdayOrdinal === b.weekdayOrdinal &&
      a.weekday === b.weekday
  }

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    if (fuEnabled && fuSequence.length === 0) return
    const errors = {}
    if (!isValidUrl(dealUrl.trim()))     errors.dealUrl = 'Invalid URL'
    if (!isValidUrl(contactUrl.trim())) errors.contactUrl = 'Invalid URL'
    if (Object.keys(errors).length > 0) { setUrlErrors(errors); return }
    setSaving(true)
    await onSave(task.id, {
      text:        trimmed,
      priority,
      category,
      type:        taskType,
      dueDate:     taskType === 'standard' ? (dueDate || null) : null,
      projectId:   projectId || null,
      recurrence: isFrequent ? {
        ...recurrence,
        nextDueDate: recurrenceUnchanged(recurrence, task.recurrence) ? task.recurrence.nextDueDate : initialDueDate(recurrence, todayStr()),
      } : null,
      dealName:    dealName.trim() || null,
      dealUrl:     dealUrl.trim() || null,
      contactName: contactName.trim() || null,
      contactUrl:  contactUrl.trim() || null,
      fuChain: fuEnabled ? {
        enabled: true,
        baseTitle: task.fuChain?.baseTitle ?? trimmed.replace(/^FU:\s*/i, ''),
        sequence: fuSequence,
        stepIndex: task.fuChain?.stepIndex ?? 0,
        templateId: fuTemplateId,
      } : null,
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
                    <label className="block text-xs font-medium text-text-secondary mb-2">Type</label>
                    <TaskTypeToggle value={taskType} onChange={setTaskType} />
                  </div>

                  {isFrequent ? (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(12,26,51,0.025)', border: '1px solid rgba(12,26,51,0.07)' }}>
                      <label className="block text-xs font-medium text-text-secondary mb-2">Recurrence</label>
                      <RecurrencePicker value={recurrence} onChange={setRecurrence} />
                    </div>
                  ) : isDaily ? (
                    <p className="text-[11px] text-text-tertiary">
                      Resets each day — check it off and it'll be back tomorrow.
                    </p>
                  ) : (
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
                  )}

                  {/* Follow-up reminder chain — standard tasks only */}
                  {taskType === 'standard' && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(12,26,51,0.025)', border: '1px solid rgba(12,26,51,0.07)' }}>
                    <label className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-secondary">Follow-up reminder</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={fuEnabled}
                        onClick={() => setFuEnabled(v => !v)}
                        className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                        style={{ background: fuEnabled ? '#C4A24E' : 'rgba(12,26,51,0.15)' }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                          style={{ transform: fuEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                        />
                      </button>
                    </label>

                    {fuEnabled && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {fuSequence.map((days, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-text-primary"
                              style={{ background: 'white', border: '1px solid rgba(12,26,51,0.12)' }}
                            >
                              +{days} days
                              <button
                                type="button"
                                onClick={() => removeFuStep(i)}
                                aria-label={`Remove step ${i + 1}`}
                                className="text-text-tertiary hover:text-red-500 leading-none"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          {addingStep ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                autoFocus
                                type="number"
                                min="1"
                                value={newStepDays}
                                onChange={e => setNewStepDays(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFuStep() } }}
                                placeholder="days"
                                className="w-16 text-xs bg-white border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold"
                                style={borderStyle}
                              />
                              <button type="button" onClick={handleAddFuStep} className="text-xs font-medium text-white px-2 py-1 rounded-lg" style={{ background: '#C4A24E' }}>
                                Add
                              </button>
                              <button type="button" onClick={() => { setAddingStep(false); setNewStepDays('') }} className="text-xs text-text-tertiary hover:text-text-secondary">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingStep(true)}
                              className="text-xs font-medium text-text-tertiary hover:text-text-secondary px-1.5 py-1"
                            >
                              + Add step
                            </button>
                          )}
                        </div>
                        {fuSequence.length === 0 && (
                          <p className="text-[11px]" style={{ color: '#C0392B' }}>Add at least one step.</p>
                        )}
                        {fuTemplates.length > 0 && (
                          <select
                            value=""
                            onChange={e => applyFuTemplate(e.target.value)}
                            className="text-xs bg-white border rounded-lg px-2 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-gold"
                            style={borderStyle}
                          >
                            <option value="" disabled>Use a template…</option>
                            {fuTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} — {t.sequence.join(', ')} days</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* HubSpot links */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(12,26,51,0.025)', border: '1px solid rgba(12,26,51,0.07)' }}>
                    <p className="text-xs font-medium text-text-tertiary">HubSpot Links <span className="font-normal">(optional)</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Deal name"
                        value={dealName}
                        onChange={e => setDealName(e.target.value)}
                        className="bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                        style={borderStyle}
                      />
                      <div>
                        <input
                          type="text"
                          placeholder="Deal URL"
                          value={dealUrl}
                          onChange={e => { setDealUrl(e.target.value); setUrlErrors(p => ({ ...p, dealUrl: undefined })) }}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                          style={urlErrors.dealUrl ? errorBorder : borderStyle}
                        />
                        {urlErrors.dealUrl && <p className="text-[10px] text-red-500 mt-0.5">{urlErrors.dealUrl}</p>}
                      </div>
                      <input
                        type="text"
                        placeholder="Contact name"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        className="bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                        style={borderStyle}
                      />
                      <div>
                        <input
                          type="text"
                          placeholder="Contact URL"
                          value={contactUrl}
                          onChange={e => { setContactUrl(e.target.value); setUrlErrors(p => ({ ...p, contactUrl: undefined })) }}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-gold"
                          style={urlErrors.contactUrl ? errorBorder : borderStyle}
                        />
                        {urlErrors.contactUrl && <p className="text-[10px] text-red-500 mt-0.5">{urlErrors.contactUrl}</p>}
                      </div>
                    </div>
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
                      disabled={saving || !text.trim() || (fuEnabled && fuSequence.length === 0)}
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

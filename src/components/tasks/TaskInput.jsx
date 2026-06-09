import { useState } from 'react'

const PRIORITIES = ['High', 'Medium', 'Low']

export default function TaskInput({ categories, activeProjects = [], onAdd }) {
  const [text, setText]         = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [projectId, setProjectId] = useState('')

  const defaultCategory = categories[0]?.name ?? ''

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({
      text: trimmed,
      priority,
      category: category || defaultCategory,
      dueDate:  dueDate || null,
      projectId: projectId || null,
    })
    setText('')
    setDueDate('')
    setProjectId('')
  }

  const inputClass = "bg-white border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 transition"

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 mb-6 flex flex-col gap-3"
      style={{ border: '1px solid rgba(12, 26, 51, 0.06)' }}
    >
      <input
        type="text"
        placeholder="What needs doing?"
        value={text}
        onChange={e => setText(e.target.value)}
        className={`w-full ${inputClass}`}
        style={{ borderColor: 'rgba(12, 26, 51, 0.12)', '--tw-ring-color': '#C4A24E' }}
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className={inputClass}
          style={{ borderColor: 'rgba(12, 26, 51, 0.12)' }}
        >
          {PRIORITIES.map(p => <option key={p} value={p}>{p} Priority</option>)}
        </select>

        <select
          value={category || defaultCategory}
          onChange={e => setCategory(e.target.value)}
          className={`${inputClass} flex-1 min-w-[120px]`}
          style={{ borderColor: 'rgba(12, 26, 51, 0.12)' }}
        >
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className={inputClass}
          style={{ borderColor: 'rgba(12, 26, 51, 0.12)', colorScheme: 'light' }}
        />

        {activeProjects.length > 0 && (
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className={inputClass}
            style={{ borderColor: 'rgba(12, 26, 51, 0.12)' }}
          >
            <option value="">No project</option>
            {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        <button
          type="submit"
          className="font-semibold px-5 py-2.5 rounded-xl transition text-sm ml-auto text-white"
          style={{ background: '#C4A24E' }}
        >
          Add Task
        </button>
      </div>
    </form>
  )
}

import { useState, useEffect } from 'react'
import {
  subscribeToTasks,
  addTask as fsAdd,
  completeTask as fsComplete,
  deleteTask as fsDelete,
  updateTask as fsUpdate,
  setDailyTaskCompletion as fsSetDailyCompletion,
} from '../lib/firestore'

export function useTasks(uid) {
  const [tasks, setTasks]               = useState([])
  const [completedTasks, setCompleted]  = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!uid) return
    return subscribeToTasks(uid, all => {
      const active    = all.filter(t => !t.completedAt)
      const completed = all.filter(t =>  t.completedAt)

      // Treat orphaned subtasks (missing parent) as top-level
      const activeIds = new Set(active.map(t => t.id))
      const normalized = active.map(t =>
        t.parentId && !activeIds.has(t.parentId) ? { ...t, parentId: null } : t
      )

      setTasks(normalized)
      setCompleted(completed)
      setLoading(false)
    })
  }, [uid])

  function subtaskIds(parentId) {
    return tasks.filter(t => t.parentId === parentId).map(t => t.id)
  }

  async function addTask(data) {
    await fsAdd(uid, data)
  }

  async function addSubtask(parentId, data) {
    const parent = tasks.find(t => t.id === parentId)
    await fsAdd(uid, {
      ...data,
      parentId,
      category:  parent?.category  ?? data.category,
      projectId: parent?.projectId ?? null,
    })
  }

  async function completeTask(taskId) {
    await fsComplete(uid, taskId, subtaskIds(taskId))
  }

  async function completeSubtask(taskId, parentId) {
    await fsComplete(uid, taskId, [])
    if (parentId) {
      const siblings = tasks.filter(t => t.parentId === parentId && t.id !== taskId)
      if (siblings.every(t => !!t.completedAt)) {
        await fsComplete(uid, parentId, [])
      }
    }
  }

  async function deleteTask(taskId) {
    await fsDelete(uid, taskId, subtaskIds(taskId))
  }

  async function updateTask(taskId, updates) {
    await fsUpdate(uid, taskId, updates)
  }

  async function toggleDailyTask(taskId, doneToday) {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    await fsSetDailyCompletion(uid, taskId, doneToday ? null : today)
  }

  return {
    tasks,
    completedTasks,
    loading,
    addTask,
    addSubtask,
    completeTask,
    completeSubtask,
    deleteTask,
    updateTask,
    toggleDailyTask,
  }
}

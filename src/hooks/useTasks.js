import { useState, useEffect } from 'react'
import {
  subscribeToTasks,
  addTask as fsAdd,
  completeTask as fsComplete,
  deleteTask as fsDelete,
  updateTask as fsUpdate,
  setDailyTaskCompletion as fsSetDailyCompletion,
  spawnFollowUpTask as fsSpawnFollowUp,
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

  // If `task` is the non-final step of an FU chain, silently spawns the next step.
  // If it's the final step, returns chain info for the End-of-Chain modal; otherwise null.
  async function handleFuChainCompletion(task) {
    const chain = task?.fuChain
    if (!chain?.enabled) return null
    const isFinal = chain.stepIndex >= chain.sequence.length - 1
    if (!isFinal) {
      await fsSpawnFollowUp(uid, { fuChain: chain, projectId: task.projectId, category: task.category, priority: task.priority })
      return null
    }
    return {
      chainComplete: true,
      baseTitle: chain.baseTitle,
      sequence: chain.sequence,
      stepIndex: chain.stepIndex,
      templateId: chain.templateId ?? null,
      projectId: task.projectId ?? null,
      category: task.category,
      priority: task.priority,
    }
  }

  async function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId)
    await fsComplete(uid, taskId, subtaskIds(taskId))
    return handleFuChainCompletion(task)
  }

  async function completeSubtask(taskId, parentId) {
    const task = tasks.find(t => t.id === taskId)
    await fsComplete(uid, taskId, [])
    if (parentId) {
      const siblings = tasks.filter(t => t.parentId === parentId && t.id !== taskId)
      if (siblings.every(t => !!t.completedAt)) {
        await fsComplete(uid, parentId, [])
      }
    }
    return handleFuChainCompletion(task)
  }

  // "Add another follow-up" from the End-of-Chain modal: extends the finished
  // chain's sequence by one more interval and spawns that final step.
  async function extendFuChain(chainInfo, days) {
    const sequence = [...chainInfo.sequence, days]
    await fsSpawnFollowUp(uid, {
      fuChain: { baseTitle: chainInfo.baseTitle, sequence, stepIndex: chainInfo.stepIndex, templateId: chainInfo.templateId },
      projectId: chainInfo.projectId,
      category: chainInfo.category,
      priority: chainInfo.priority,
    })
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
    extendFuChain,
  }
}

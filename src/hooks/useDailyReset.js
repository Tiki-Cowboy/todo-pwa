import { useEffect, useRef } from 'react'
import { getLastResetDate, resetDailyTasks } from '../lib/firestore'

function localDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useDailyReset(uid, tasks, dailyProjectIds) {
  // Always-fresh ref — avoids stale closures in the midnight timeout callback
  const stateRef = useRef({ uid, tasks, dailyProjectIds })
  stateRef.current = { uid, tasks, dailyProjectIds }

  // Prevents re-checking Firestore multiple times in the same session day
  const checkedDate = useRef(null)

  async function runReset() {
    const { uid, tasks, dailyProjectIds } = stateRef.current
    if (!uid) return

    const today = localDateStr()
    if (checkedDate.current === today) return
    checkedDate.current = today

    const lastReset = await getLastResetDate(uid)
    if (lastReset === today) return

    const taskIds = tasks
      .filter(t => !t.parentId && t.projectId && dailyProjectIds.has(t.projectId))
      .map(t => t.id)

    await resetDailyTasks(uid, taskIds)
  }

  // Run on load and whenever task count changes (catches initial data load)
  useEffect(() => {
    if (!uid || !tasks.length) return
    runReset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tasks.length])

  // Midnight re-trigger (12:01 AM)
  useEffect(() => {
    function schedule() {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0)
      return setTimeout(() => {
        checkedDate.current = null
        runReset()
        schedule()
      }, next - now)
    }
    const id = schedule()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

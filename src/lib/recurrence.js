import { addDays, format, parseISO, getDate, getDay, lastDayOfMonth } from 'date-fns'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDINAL_LABELS = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', '-1': 'last' }

function toStr(date) {
  return format(date, 'yyyy-MM-dd')
}

function clampedMonthDate(year, month, dayOfMonth) {
  const d = new Date(year, month, 1)
  const last = lastDayOfMonth(d).getDate()
  d.setDate(Math.min(dayOfMonth, last))
  return d
}

function monthlyDays(recurrence) {
  if (recurrence.daysOfMonth?.length) return [...recurrence.daysOfMonth].sort((a, b) => a - b)
  return [recurrence.dayOfMonth || 1]
}

// Nth (1-4) or last (-1) occurrence of `weekday` (0=Sun..6=Sat) within a given month.
function nthWeekdayOfMonth(year, month, weekday, ordinal) {
  if (ordinal === -1) {
    const last = lastDayOfMonth(new Date(year, month, 1)).getDate()
    for (let d = last; d >= last - 6; d--) {
      if (new Date(year, month, d).getDay() === weekday) return new Date(year, month, d)
    }
    return null
  }
  let count = 0
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d)
    if (date.getMonth() !== month) break
    if (date.getDay() === weekday) {
      count++
      if (count === ordinal) return date
    }
  }
  return null
}

function nextMonthlyWeekday(recurrence, from, { strictlyAfter }) {
  const weekday = recurrence.weekday ?? 0
  const ordinal = recurrence.weekdayOrdinal ?? 1
  let year = from.getFullYear()
  let month = from.getMonth()
  let candidate = nthWeekdayOfMonth(year, month, weekday, ordinal)
  const isValid = candidate && (strictlyAfter ? candidate > from : candidate >= from)
  if (!isValid) {
    month += 1
    if (month > 11) { month = 0; year++ }
    candidate = nthWeekdayOfMonth(year, month, weekday, ordinal)
  }
  return candidate
}

// Next due date strictly after `fromDateStr` — used after completing a cycle.
export function computeNextDueDate(recurrence, fromDateStr) {
  const from = parseISO(fromDateStr)

  if (recurrence.type === 'interval') {
    return toStr(addDays(from, recurrence.intervalDays || 1))
  }

  if (recurrence.type === 'weekly') {
    const days = recurrence.daysOfWeek?.length ? recurrence.daysOfWeek : [getDay(from)]
    for (let i = 1; i <= 7; i++) {
      const candidate = addDays(from, i)
      if (days.includes(getDay(candidate))) return toStr(candidate)
    }
    return toStr(addDays(from, 7))
  }

  if (recurrence.type === 'monthly') {
    if (recurrence.monthlyMode === 'weekday') {
      return toStr(nextMonthlyWeekday(recurrence, from, { strictlyAfter: true }))
    }
    const days = monthlyDays(recurrence)
    const thisMonth = days.find(d => d > getDate(from))
    if (thisMonth) return toStr(clampedMonthDate(from.getFullYear(), from.getMonth(), thisMonth))
    return toStr(clampedMonthDate(from.getFullYear(), from.getMonth() + 1, days[0]))
  }

  return fromDateStr
}

// First due date for a newly-created recurring task — due today if today qualifies.
export function initialDueDate(recurrence, todayStr) {
  const today = parseISO(todayStr)

  if (recurrence.type === 'interval') return todayStr

  if (recurrence.type === 'weekly') {
    const days = recurrence.daysOfWeek?.length ? recurrence.daysOfWeek : [getDay(today)]
    if (days.includes(getDay(today))) return todayStr
    for (let i = 1; i <= 7; i++) {
      const candidate = addDays(today, i)
      if (days.includes(getDay(candidate))) return toStr(candidate)
    }
    return todayStr
  }

  if (recurrence.type === 'monthly') {
    if (recurrence.monthlyMode === 'weekday') {
      return toStr(nextMonthlyWeekday(recurrence, today, { strictlyAfter: false }))
    }
    const days = monthlyDays(recurrence)
    const last = lastDayOfMonth(today).getDate()
    const todayOrLater = days.find(d => Math.min(d, last) >= getDate(today))
    if (todayOrLater) return toStr(clampedMonthDate(today.getFullYear(), today.getMonth(), todayOrLater))
    return toStr(clampedMonthDate(today.getFullYear(), today.getMonth() + 1, days[0]))
  }

  return todayStr
}

export function describeRecurrence(recurrence) {
  if (!recurrence) return ''
  if (recurrence.type === 'interval') {
    const n = recurrence.intervalDays || 1
    return n === 1 ? 'Every day' : `Every ${n} days`
  }
  if (recurrence.type === 'weekly') {
    const days = (recurrence.daysOfWeek ?? []).slice().sort()
    if (days.length === 0) return 'Weekly'
    return `Weekly · ${days.map(d => DAY_LABELS[d]).join(', ')}`
  }
  if (recurrence.type === 'monthly') {
    if (recurrence.monthlyMode === 'weekday') {
      const ord = ORDINAL_LABELS[recurrence.weekdayOrdinal] ?? 'first'
      return `Monthly · ${ord} ${DAY_LABELS_FULL[recurrence.weekday ?? 0]}`
    }
    const days = monthlyDays(recurrence)
    return `Monthly · day${days.length > 1 ? 's' : ''} ${days.join(', ')}`
  }
  return ''
}

export { DAY_LABELS, DAY_LABELS_FULL, ORDINAL_LABELS }

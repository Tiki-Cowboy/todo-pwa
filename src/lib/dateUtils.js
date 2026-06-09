import {
  parseISO, isToday, isTomorrow,
  differenceInCalendarDays, format, getYear,
} from 'date-fns'

export function formatDueDate(dueDateStr) {
  if (!dueDateStr) return null
  const date = parseISO(dueDateStr)
  const diff  = differenceInCalendarDays(date, new Date())

  if (diff < 0)          return { label: `Overdue · ${format(date, 'MMM d')}`, overdue: true }
  if (isToday(date))     return { label: 'Today',                               overdue: false }
  if (isTomorrow(date))  return { label: 'Tomorrow',                            overdue: false }
  if (diff <= 7)         return { label: format(date, 'EEEE'),                  overdue: false }
  if (getYear(date) > getYear(new Date()))
                         return { label: format(date, 'MMM d, yyyy'),           overdue: false }
  return                        { label: format(date, 'MMM d'),                 overdue: false }
}

export function isOverdue(dueDateStr) {
  if (!dueDateStr) return false
  return differenceInCalendarDays(parseISO(dueDateStr), new Date()) < 0
}

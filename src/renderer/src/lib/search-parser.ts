import type { TaskFilter, TaskPriority, TaskStatus } from '@shared/types'

export interface ParsedSearch {
  text: string
  filters: Partial<TaskFilter>
}

export function parseSearchQuery(query: string): ParsedSearch {
  const filters: Partial<TaskFilter> = {}
  let text = query

  // Extract is: filters (is:completed, is:active, is:archived)
  const isRegex = /\bis:(completed|active|archived)\b/gi
  const isMatches = [...text.matchAll(isRegex)]
  if (isMatches.length > 0) {
    const val = isMatches[isMatches.length - 1][1].toLowerCase()
    filters.status = val as TaskStatus
    text = text.replace(isRegex, '')
  }

  // Extract priority: filters
  const priorityRegex = /\bpriority:(urgent|high|medium|low|none)\b/gi
  const priorityMatches = [...text.matchAll(priorityRegex)]
  if (priorityMatches.length > 0) {
    const val = priorityMatches[priorityMatches.length - 1][1].toLowerCase()
    filters.priority = val as TaskPriority
    text = text.replace(priorityRegex, '')
  }

  // Extract project: filters
  const projectRegex = /\bproject:([\w-]+)\b/gi
  const projectMatches = [...text.matchAll(projectRegex)]
  if (projectMatches.length > 0) {
    filters.projectId = projectMatches[projectMatches.length - 1][1]
    text = text.replace(projectRegex, '')
  }

  // Extract tag: filters
  const tagRegex = /\btag:([\w-]+)\b/gi
  const tagMatches = [...text.matchAll(tagRegex)]
  if (tagMatches.length > 0) {
    filters.tagId = tagMatches[tagMatches.length - 1][1]
    text = text.replace(tagRegex, '')
  }

  // Extract due: filters (today, tomorrow, overdue, week)
  const dueRegex = /\bdue:(today|tomorrow|overdue|week)\b/gi
  const dueMatches = [...text.matchAll(dueRegex)]
  if (dueMatches.length > 0) {
    const dueType = dueMatches[dueMatches.length - 1][1].toLowerCase()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (dueType === 'today') {
      filters.dueDateFrom = todayStr
      filters.dueDateTo = todayStr
    } else if (dueType === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomStr = tomorrow.toISOString().split('T')[0]
      filters.dueDateFrom = tomStr
      filters.dueDateTo = tomStr
    } else if (dueType === 'overdue') {
      filters.isOverdue = true
    } else if (dueType === 'week') {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filters.dueDateTo = endOfWeek.toISOString().split('T')[0]
    }
    text = text.replace(dueRegex, '')
  }

  return {
    text: text.replace(/\s+/g, ' ').trim(),
    filters
  }
}

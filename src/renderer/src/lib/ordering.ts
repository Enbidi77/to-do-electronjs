import type { Task } from '@shared/types'

export const DEFAULT_SORT_GAP = 1000
export const MIN_SORT_GAP = 1

/**
 * Calculates a new sortOrder between two bounding values.
 * If above is null, item is placed at the top (below + DEFAULT_SORT_GAP).
 * If below is null, item is placed at the bottom (above - DEFAULT_SORT_GAP).
 * If both exist, item is placed in the midpoint.
 */
export function calculateFractionalSortOrder(
  aboveSortOrder: number | null,
  belowSortOrder: number | null
): { newSortOrder: number; needsRenormalization: boolean } {
  // Inserting at the top of list (higher sortOrder = top in desc order)
  if (aboveSortOrder === null && belowSortOrder !== null) {
    return {
      newSortOrder: belowSortOrder + DEFAULT_SORT_GAP,
      needsRenormalization: false
    }
  }

  // Inserting at the bottom of list
  if (aboveSortOrder !== null && belowSortOrder === null) {
    return {
      newSortOrder: Math.max(0, aboveSortOrder - DEFAULT_SORT_GAP),
      needsRenormalization: false
    }
  }

  // Inserting between two tasks
  if (aboveSortOrder !== null && belowSortOrder !== null) {
    const gap = Math.abs(aboveSortOrder - belowSortOrder)
    if (gap < MIN_SORT_GAP) {
      return {
        newSortOrder: Math.round((aboveSortOrder + belowSortOrder) / 2),
        needsRenormalization: true
      }
    }
    return {
      newSortOrder: Math.round((aboveSortOrder + belowSortOrder) / 2),
      needsRenormalization: false
    }
  }

  // List is empty
  return {
    newSortOrder: DEFAULT_SORT_GAP,
    needsRenormalization: false
  }
}

/**
 * Given a list of visible tasks and target index within visible list,
 * determine the bounding tasks to calculate new sortOrder without corrupting
 * hidden items in filtered views.
 */
export function getBoundingTasks(
  visibleTasks: Task[],
  sourceIndex: number,
  targetIndex: number
): { aboveTask: Task | null; belowTask: Task | null } {
  const filtered = visibleTasks.filter((_, idx) => idx !== sourceIndex)

  if (filtered.length === 0) {
    return { aboveTask: null, belowTask: null }
  }

  if (targetIndex <= 0) {
    // Top of list: above is null, below is first item
    return {
      aboveTask: null,
      belowTask: filtered[0]
    }
  }

  if (targetIndex >= filtered.length) {
    // Bottom of list: above is last item, below is null
    return {
      aboveTask: filtered[filtered.length - 1],
      belowTask: null
    }
  }

  // Between targetIndex - 1 and targetIndex
  return {
    aboveTask: filtered[targetIndex - 1],
    belowTask: filtered[targetIndex]
  }
}

/**
 * Checks if a task is an ancestor of potential child, preventing circular hierarchies
 */
export function isCircularSubtask(
  taskId: string,
  targetParentId: string,
  allTasks: Task[]
): boolean {
  if (taskId === targetParentId) return true

  let currentParentId: string | null = targetParentId
  const visited = new Set<string>()

  while (currentParentId) {
    if (currentParentId === taskId) return true
    if (visited.has(currentParentId)) break
    visited.add(currentParentId)

    const parentTask = allTasks.find(t => t.id === currentParentId)
    currentParentId = parentTask?.parentTaskId ?? null
  }

  return false
}

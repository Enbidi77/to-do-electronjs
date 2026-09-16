import { describe, it, expect } from 'vitest'
import {
  calculateFractionalSortOrder,
  getBoundingTasks,
  DEFAULT_SORT_GAP,
  MIN_SORT_GAP
} from '@/lib/ordering'
import type { Task } from '@shared/types'

describe('Fractional Ordering Strategy', () => {
  it('assigns DEFAULT_SORT_GAP when list is empty', () => {
    const result = calculateFractionalSortOrder(null, null)
    expect(result.newSortOrder).toBe(DEFAULT_SORT_GAP)
    expect(result.needsRenormalization).toBe(false)
  })

  it('inserts at the top with below + DEFAULT_SORT_GAP', () => {
    const result = calculateFractionalSortOrder(null, 3000)
    expect(result.newSortOrder).toBe(3000 + DEFAULT_SORT_GAP)
    expect(result.needsRenormalization).toBe(false)
  })

  it('inserts at the bottom with above - DEFAULT_SORT_GAP', () => {
    const result = calculateFractionalSortOrder(2000, null)
    expect(result.newSortOrder).toBe(1000)
    expect(result.needsRenormalization).toBe(false)
  })

  it('inserts between two tasks at the exact midpoint', () => {
    const result = calculateFractionalSortOrder(3000, 2000)
    expect(result.newSortOrder).toBe(2500)
    expect(result.needsRenormalization).toBe(false)
  })

  it('flags needsRenormalization when gap is smaller than MIN_SORT_GAP', () => {
    const result = calculateFractionalSortOrder(1001, 1001)
    expect(result.needsRenormalization).toBe(true)
  })

  it('correctly resolves bounding tasks for top insertion in visible list', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', sortOrder: 3000 } as Task,
      { id: '2', title: 'Task 2', sortOrder: 2000 } as Task,
      { id: '3', title: 'Task 3', sortOrder: 1000 } as Task
    ]

    const bounds = getBoundingTasks(tasks, 2, 0)
    expect(bounds.aboveTask).toBeNull()
    expect(bounds.belowTask?.id).toBe('1')
  })

  it('correctly resolves bounding tasks for middle insertion', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', sortOrder: 3000 } as Task,
      { id: '2', title: 'Task 2', sortOrder: 2000 } as Task,
      { id: '3', title: 'Task 3', sortOrder: 1000 } as Task
    ]

    const bounds = getBoundingTasks(tasks, 2, 1)
    expect(bounds.aboveTask?.id).toBe('1')
    expect(bounds.belowTask?.id).toBe('2')
  })

  it('correctly resolves bounding tasks for bottom insertion', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', sortOrder: 3000 } as Task,
      { id: '2', title: 'Task 2', sortOrder: 2000 } as Task,
      { id: '3', title: 'Task 3', sortOrder: 1000 } as Task
    ]

    const bounds = getBoundingTasks(tasks, 0, 2)
    expect(bounds.aboveTask?.id).toBe('3')
    expect(bounds.belowTask).toBeNull()
  })
})

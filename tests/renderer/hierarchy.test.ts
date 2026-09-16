import { describe, it, expect } from 'vitest'
import { isCircularSubtask } from '@/lib/ordering'
import type { Task } from '@shared/types'

describe('Circular Subtask Hierarchy Prevention', () => {
  const tasks: Task[] = [
    { id: 'parent-1', title: 'Parent 1', parentTaskId: null } as Task,
    { id: 'child-1', title: 'Child 1', parentTaskId: 'parent-1' } as Task,
    { id: 'grandchild-1', title: 'Grandchild 1', parentTaskId: 'child-1' } as Task,
    { id: 'other-task', title: 'Other Task', parentTaskId: null } as Task
  ]

  it('detects self as circular', () => {
    expect(isCircularSubtask('parent-1', 'parent-1', tasks)).toBe(true)
  })

  it('detects direct child as circular', () => {
    // Cannot make parent-1 a subtask of child-1
    expect(isCircularSubtask('parent-1', 'child-1', tasks)).toBe(true)
  })

  it('detects deep descendant as circular', () => {
    // Cannot make parent-1 a subtask of grandchild-1
    expect(isCircularSubtask('parent-1', 'grandchild-1', tasks)).toBe(true)
    // Cannot make child-1 a subtask of grandchild-1
    expect(isCircularSubtask('child-1', 'grandchild-1', tasks)).toBe(true)
  })

  it('allows valid non-circular subtask creation', () => {
    // Can make grandchild-1 a subtask of other-task
    expect(isCircularSubtask('grandchild-1', 'other-task', tasks)).toBe(false)
    // Can make other-task a subtask of parent-1
    expect(isCircularSubtask('other-task', 'parent-1', tasks)).toBe(false)
    // Can make other-task a subtask of grandchild-1
    expect(isCircularSubtask('other-task', 'grandchild-1', tasks)).toBe(false)
  })
})

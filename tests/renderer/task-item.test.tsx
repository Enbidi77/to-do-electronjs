import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskItem } from '../../src/renderer/src/components/task/task-item'
import type { Task } from '@shared/types'

describe('TaskItem component', () => {
  const mockTask: Task = {
    id: 'test-1',
    title: 'Review quarterly goals',
    description: 'Prepare notes for review',
    status: 'active',
    priority: 'high',
    projectId: null,
    parentTaskId: null,
    dueDate: '2026-09-25',
    dueTime: '14:00',
    reminderEnabled: false,
    reminderTime: null,
    recurrenceRule: null,
    completedAt: null,
    createdAt: '2026-09-16T08:00:00.000Z',
    updatedAt: '2026-09-16T08:00:00.000Z',
    archivedAt: null,
    sortOrder: 1
  }

  it('renders task title and due date', () => {
    const onComplete = vi.fn()
    const onSelect = vi.fn()
    const onDelete = vi.fn()

    render(
      <TaskItem
        task={mockTask}
        onComplete={onComplete}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    )

    expect(screen.getByText('Review quarterly goals')).toBeDefined()
    expect(screen.getByText('Sep 25')).toBeDefined()
  })

  it('triggers onSelect when task item is clicked', () => {
    const onComplete = vi.fn()
    const onSelect = vi.fn()
    const onDelete = vi.fn()

    render(
      <TaskItem
        task={mockTask}
        onComplete={onComplete}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    )

    fireEvent.click(screen.getByText('Review quarterly goals'))
    expect(onSelect).toHaveBeenCalledWith('test-1')
  })

  it('triggers onComplete when checkbox container is clicked', () => {
    const onComplete = vi.fn()
    const onSelect = vi.fn()
    const onDelete = vi.fn()

    render(
      <TaskItem
        task={mockTask}
        onComplete={onComplete}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(onComplete).toHaveBeenCalledWith('test-1', true)
  })
})


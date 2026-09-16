import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskBoard } from '@/components/task/task-board'
import type { Task } from '@shared/types'

describe('TaskBoard Kanban Component', () => {
  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Active Todo Item',
      status: 'active',
      priority: 'high',
      dueDate: '2026-09-20',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
      sortOrder: 1000
    } as Task,
    {
      id: 'task-2',
      title: 'In Progress Item',
      status: 'in_progress',
      priority: 'medium',
      dueDate: null,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
      sortOrder: 2000
    } as Task,
    {
      id: 'task-3',
      title: 'Completed Item',
      status: 'completed',
      priority: 'none',
      dueDate: null,
      completedAt: '2026-09-02T00:00:00Z',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z',
      sortOrder: 3000
    } as Task
  ]

  it('renders all three columns: To Do, In Progress, and Done', () => {
    render(
      <TaskBoard
        tasks={tasks}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        title="Sprint Board"
      />
    )

    expect(screen.getByText('To Do')).toBeDefined()
    expect(screen.getByText('In Progress')).toBeDefined()
    expect(screen.getByText('Done')).toBeDefined()
  })

  it('distributes tasks into their respective status columns', () => {
    render(
      <TaskBoard
        tasks={tasks}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        title="Sprint Board"
      />
    )

    expect(screen.getByText('Active Todo Item')).toBeDefined()
    expect(screen.getByText('In Progress Item')).toBeDefined()
    expect(screen.getByText('Completed Item')).toBeDefined()
  })
})

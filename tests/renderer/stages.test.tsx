import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useStageStore } from '@/stores/stage-store'
import { StageDialog } from '@/components/stage/stage-dialog'
import { TaskBoard } from '@/components/task/task-board'
import type { Stage, Task } from '@shared/types'

describe('Customizable Stages (CRUD)', () => {
  const initialStages: Stage[] = [
    { id: 'active', name: 'To Do', color: '#94a3b8', icon: 'circle', sortOrder: 1000, isCompleted: false, createdAt: '', updatedAt: '' },
    { id: 'in_progress', name: 'In Progress', color: '#f59e0b', icon: 'clock', sortOrder: 2000, isCompleted: false, createdAt: '', updatedAt: '' },
    { id: 'completed', name: 'Done', color: '#10b981', icon: 'check-circle-2', sortOrder: 3000, isCompleted: true, createdAt: '', updatedAt: '' }
  ]

  beforeEach(() => {
    useStageStore.getState().setStages(initialStages)
  })

  it('manages stage CRUD operations via store', async () => {
    // 1. Read
    expect(useStageStore.getState().stages).toHaveLength(3)

    // 2. Create
    const newStage: Stage = {
      id: 'testing',
      name: 'Testing / QA',
      color: '#8b5cf6',
      icon: 'star',
      sortOrder: 2500,
      isCompleted: false,
      createdAt: '',
      updatedAt: ''
    }
    vi.mocked(window.api.stages.create).mockResolvedValueOnce(newStage)
    await useStageStore.getState().createStage({ name: 'Testing / QA', color: '#8b5cf6', icon: 'star' })
    expect(useStageStore.getState().stages).toHaveLength(4)
    expect(useStageStore.getState().stages.some(s => s.id === 'testing')).toBe(true)

    // 3. Update
    const updatedStage = { ...newStage, name: 'QA Verified' }
    vi.mocked(window.api.stages.update).mockResolvedValueOnce(updatedStage)
    await useStageStore.getState().updateStage('testing', { name: 'QA Verified' })
    expect(useStageStore.getState().stages.find(s => s.id === 'testing')?.name).toBe('QA Verified')

    // 4. Reorder
    vi.mocked(window.api.stages.reorder).mockResolvedValueOnce(undefined)
    await useStageStore.getState().reorderStages(['completed', 'testing', 'in_progress', 'active'])
    expect(useStageStore.getState().stages[0].id).toBe('completed')

    // 5. Delete
    vi.mocked(window.api.stages.delete).mockResolvedValueOnce(undefined)
    await useStageStore.getState().deleteStage('testing')
    expect(useStageStore.getState().stages.some(s => s.id === 'testing')).toBe(false)
  })

  it('renders StageDialog and creates a new stage', async () => {
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()

    const createdStage: Stage = {
      id: 'review',
      name: 'Code Review',
      color: '#3b82f6',
      icon: 'layers',
      sortOrder: 4000,
      isCompleted: false,
      createdAt: '',
      updatedAt: ''
    }
    vi.mocked(window.api.stages.create).mockResolvedValueOnce(createdStage)

    render(
      <StageDialog
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByText('New Stage')).toBeDefined()

    const input = screen.getByPlaceholderText(/e\.g\. In Review/i)
    fireEvent.change(input, { target: { value: 'Code Review' } })

    const createButton = screen.getByText('Create Stage')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(window.api.stages.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Code Review' })
      )
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('renders custom stages dynamically in TaskBoard', () => {
    const customStages: Stage[] = [
      { id: 'stage-1', name: 'Backlog', color: '#94a3b8', icon: 'circle', sortOrder: 1000, isCompleted: false, createdAt: '', updatedAt: '' },
      { id: 'stage-2', name: 'Designing', color: '#3b82f6', icon: 'star', sortOrder: 2000, isCompleted: false, createdAt: '', updatedAt: '' },
      { id: 'stage-3', name: 'Shipped', color: '#10b981', icon: 'check-circle-2', sortOrder: 3000, isCompleted: true, createdAt: '', updatedAt: '' }
    ]
    useStageStore.getState().setStages(customStages)

    const testTasks: Task[] = [
      { id: 't-1', title: 'Task in Backlog', status: 'stage-1', priority: 'none', dueDate: null, createdAt: '', updatedAt: '', sortOrder: 1000 } as Task,
      { id: 't-2', title: 'Task in Designing', status: 'stage-2', priority: 'medium', dueDate: null, createdAt: '', updatedAt: '', sortOrder: 2000 } as Task
    ]

    render(
      <TaskBoard
        tasks={testTasks}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        title="Custom Board"
      />
    )

    expect(screen.getByText('Backlog')).toBeDefined()
    expect(screen.getByText('Designing')).toBeDefined()
    expect(screen.getByText('Shipped')).toBeDefined()
    expect(screen.getByText('Task in Backlog')).toBeDefined()
    expect(screen.getByText('Task in Designing')).toBeDefined()
  })
})

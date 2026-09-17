import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Task, TaskStatus, Stage } from '@shared/types'
import { TaskDragPreview } from './TaskDragPreview'
import { StageDragPreview } from './StageDragPreview'
import { useTaskStore } from '@/stores/task-store'
import { useProjectStore } from '@/stores/project-store'
import { useStageStore } from '@/stores/stage-store'
import { toast } from 'sonner'
import { isCircularSubtask, calculateFractionalSortOrder } from '@/lib/ordering'
import { format, addDays } from 'date-fns'

import { DropIndicatorPosition } from './DropIndicator'

interface TaskDndContextType {
  activeTaskId: string | null
  activeTask: Task | null
  activeStageId: string | null
  activeStage: Stage | null
  isDragging: boolean
  dropIntent: DropIndicatorPosition
  setDropIntent: (intent: DropIndicatorPosition) => void
}

const TaskDndStateContext = createContext<TaskDndContextType>({
  activeTaskId: null,
  activeTask: null,
  activeStageId: null,
  activeStage: null,
  isDragging: false,
  dropIntent: 'none',
  setDropIntent: () => {}
})

export function useTaskDnd() {
  return useContext(TaskDndStateContext)
}

interface TaskDndProviderProps {
  children: React.ReactNode
}

export function TaskDndProvider({ children }: TaskDndProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeStage, setActiveStage] = useState<Stage | null>(null)
  const [dropIntent, setDropIntent] = useState<DropIndicatorPosition>('none')
  const allTasks = useTaskStore(s => s.tasks)
  const updateTask = useTaskStore(s => s.updateTask)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const changeTaskStatus = useTaskStore(s => s.changeTaskStatus)
  const moveTask = useTaskStore(s => s.moveTask)
  const reorderTask = useTaskStore(s => s.reorderTask)
  const makeSubtask = useTaskStore(s => s.makeSubtask)
  const projects = useProjectStore(s => s.projects)

  // Configure sensors with activation constraints to distinguish clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // 5px movement required before drag begins
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Custom collision detection: prioritize pointer coordinates, fallback to rect intersection
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    return rectIntersection(args)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined
    if (task) {
      setActiveTask(task)
      return
    }
    const stage = event.active.data.current?.stage as Stage | undefined
    if (stage) {
      setActiveStage(stage)
      return
    }
  }, [])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Handled reactively
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setActiveStage(null)

    if (!over || !active) return

    // 0. Stage Reordering:
    const isStageActive = active.data.current?.type === 'stage' || String(active.id).startsWith('stage:')
    if (isStageActive) {
      const activeStageId = (active.data.current?.stage?.id as string) || String(active.id).replace('stage:', '')

      let overStageId: string | null = null
      if (over.data.current?.stage?.id) {
        overStageId = over.data.current.stage.id
      } else if (String(over.id).startsWith('stage:')) {
        overStageId = String(over.id).replace('stage:', '')
      } else if (String(over.id).startsWith('status:')) {
        overStageId = String(over.id).replace('status:', '')
      } else {
        const overTask = allTasks.find(t => t.id === String(over.id))
        if (overTask) {
          overStageId = overTask.status
        }
      }

      if (activeStageId && overStageId && activeStageId !== overStageId) {
        const stages = useStageStore.getState().stages
        const oldIndex = stages.findIndex(s => s.id === activeStageId)
        const newIndex = stages.findIndex(s => s.id === overStageId)
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newStages = [...stages]
          const [moved] = newStages.splice(oldIndex, 1)
          newStages.splice(newIndex, 0, moved)
          useStageStore.getState().reorderStages(newStages.map(s => s.id))
        }
      }
      return
    }

    const activeTaskData = active.data.current?.task as Task | undefined
    if (!activeTaskData) return

    const sourceTaskId = active.id as string
    const overId = String(over.id)

    // Snapshot for Undo functionality
    const previousSnapshot: Partial<Task> = {
      projectId: activeTaskData.projectId,
      parentTaskId: activeTaskData.parentTaskId,
      status: activeTaskData.status,
      sortOrder: activeTaskData.sortOrder,
      dueDate: activeTaskData.dueDate
    }

    const restoreSnapshot = async (msg: string) => {
      try {
        if (previousSnapshot.status && previousSnapshot.status !== activeTaskData.status) {
          await changeTaskStatus({ taskId: sourceTaskId, status: previousSnapshot.status })
        }
        if (previousSnapshot.projectId !== undefined && previousSnapshot.projectId !== activeTaskData.projectId) {
          await moveTask({ taskId: sourceTaskId, targetProjectId: previousSnapshot.projectId })
        }
        await updateTask(sourceTaskId, previousSnapshot)
        useTaskStore.getState().notifyTaskChanged()
        toast.info(msg)
      } catch (err) {
        console.error('Failed to undo', err)
      }
    }

    // 1. Dropped onto a sidebar project: "project:<projectId>"
    if (overId.startsWith('project:')) {
      const targetProjectId = overId.replace('project:', '')
      if (activeTaskData.projectId === targetProjectId) return

      const targetProject = projects.find(p => p.id === targetProjectId)
      const projectName = targetProject?.name || 'Project'

      try {
        await moveTask({ taskId: sourceTaskId, targetProjectId })
        useTaskStore.getState().notifyTaskChanged()
        toast.success(`Moved to "${projectName}"`, {
          action: {
            label: 'Undo',
            onClick: () => restoreSnapshot(`Restored to previous project`)
          }
        })
      } catch (err: any) {
        toast.error(err.message || 'Failed to move task')
      }
      return
    }

    // 2. Dropped onto a sidebar view: "view:<viewId>"
    if (overId.startsWith('view:')) {
      const targetView = overId.replace('view:', '')

      if (targetView === 'today') {
        const todayStr = new Date().toISOString().split('T')[0]
        if (activeTaskData.dueDate === todayStr) return

        try {
          await updateTask(sourceTaskId, { dueDate: todayStr })
          useTaskStore.getState().notifyTaskChanged()
          toast.success('Moved to Today', {
            action: {
              label: 'Undo',
              onClick: () => restoreSnapshot('Restored previous date')
            }
          })
        } catch (err: any) {
          toast.error(err.message || 'Failed to update due date')
        }
        return
      }

      if (targetView === 'inbox') {
        if (activeTaskData.projectId === null) return

        try {
          await moveTask({ taskId: sourceTaskId, targetProjectId: null })
          useTaskStore.getState().notifyTaskChanged()
          toast.success('Moved to Inbox', {
            action: {
              label: 'Undo',
              onClick: () => restoreSnapshot('Restored to previous project')
            }
          })
        } catch (err: any) {
          toast.error(err.message || 'Failed to move task')
        }
        return
      }

      if (targetView === 'completed') {
        if (activeTaskData.status === 'completed') return

        try {
          await completeTask(sourceTaskId)
          toast.success('Task marked as completed', {
            action: {
              label: 'Undo',
              onClick: async () => {
                await uncompleteTask(sourceTaskId)
                toast.info('Task reopened')
              }
            }
          })
        } catch (err: any) {
          toast.error(err.message || 'Failed to complete task')
        }
        return
      }
      return
    }

    // 3. Dropped onto a Board status column: "status:<status>"
    if (overId.startsWith('status:')) {
      const targetStatus = overId.replace('status:', '') as TaskStatus
      if (activeTaskData.status === targetStatus) return

      try {
        await changeTaskStatus({ taskId: sourceTaskId, status: targetStatus })
        useTaskStore.getState().notifyTaskChanged()
        const stage = useStageStore.getState().stages.find(s => s.id === targetStatus)
        const statusLabel = stage ? stage.name : (targetStatus === 'in_progress' ? 'In Progress' : targetStatus === 'completed' ? 'Done' : 'To Do')
        toast.success(`Status changed to ${statusLabel}`, {
          action: {
            label: 'Undo',
            onClick: () => restoreSnapshot('Restored previous status')
          }
        })
      } catch (err: any) {
        toast.error(err.message || 'Failed to change status')
      }
      return
    }

    // 4. Dropped onto a calendar date: "date:<yyyy-MM-dd>"
    if (overId.startsWith('date:')) {
      const targetDate = overId.replace('date:', '')
      if (activeTaskData.dueDate === targetDate) return

      try {
        await updateTask(sourceTaskId, { dueDate: targetDate })
        useTaskStore.getState().notifyTaskChanged()
        toast.success(`Due date set to ${targetDate}`, {
          action: {
            label: 'Undo',
            onClick: () => restoreSnapshot('Restored previous date')
          }
        })
      } catch (err: any) {
        toast.error(err.message || 'Failed to update due date')
      }
      return
    }

    // 5. Dropped onto a date group: "dateGroup:<groupId>"
    if (overId.startsWith('dateGroup:')) {
      const groupId = overId.replace('dateGroup:', '')
      let newDate: string | null = null
      let label = 'group'

      if (groupId === 'today') {
        newDate = format(new Date(), 'yyyy-MM-dd')
        label = 'Today'
      } else if (groupId === 'tomorrow') {
        newDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
        label = 'Tomorrow'
      } else if (groupId === 'this-week') {
        newDate = format(addDays(new Date(), 3), 'yyyy-MM-dd')
        label = 'This Week'
      } else if (groupId === 'next-week') {
        newDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')
        label = 'Next Week'
      } else if (groupId === 'no-date') {
        newDate = null
        label = 'No Date'
      }

      if (activeTaskData.dueDate === newDate) return

      try {
        await updateTask(sourceTaskId, { dueDate: newDate })
        useTaskStore.getState().notifyTaskChanged()
        toast.success(`Moved to ${label}`, {
          action: {
            label: 'Undo',
            onClick: () => restoreSnapshot('Restored previous date')
          }
        })
      } catch (err: any) {
        toast.error(err.message || 'Failed to move to group')
      }
      return
    }

    // 6. Dropped onto another task (Reordering or Subtask creation)
    const overTask = allTasks.find(t => t.id === overId)
    if (overTask && overTask.id !== sourceTaskId) {
      // If dropped onto a task with different status (e.g. In Progress column in board view), update status
      if (overTask.status !== activeTaskData.status) {
        await changeTaskStatus({ taskId: sourceTaskId, status: overTask.status })
      }

      if (dropIntent === 'subtask') {
        const isCircular = isCircularSubtask(sourceTaskId, overTask.id, allTasks)
        if (isCircular) {
          toast.error('Cannot nest task inside its own subtask')
          return
        }

        try {
          await makeSubtask({ taskId: sourceTaskId, parentTaskId: overTask.id })
          useTaskStore.getState().notifyTaskChanged()
          toast.success(`Made subtask of "${overTask.title}"`, {
            action: {
              label: 'Undo',
              onClick: () => restoreSnapshot('Restored task hierarchy')
            }
          })
        } catch (err: any) {
          toast.error(err.message || 'Failed to create subtask')
        }
        return
      }

      // Calculate reorder fractional position
      const siblingTasks = allTasks
        .filter(t => t.parentTaskId === overTask.parentTaskId && t.projectId === overTask.projectId)
        .sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0))

      const overIndex = siblingTasks.findIndex(t => t.id === overTask.id)
      const sourceIndex = siblingTasks.findIndex(t => t.id === sourceTaskId)

      const isMovingDown = sourceIndex !== -1 && sourceIndex < overIndex
      let aboveOrder: number | null = null
      let belowOrder: number | null = null

      if (isMovingDown) {
        aboveOrder = overTask.sortOrder
        const nextTask = siblingTasks[overIndex + 1]
        belowOrder = nextTask ? nextTask.sortOrder : null
      } else {
        belowOrder = overTask.sortOrder
        const prevTask = siblingTasks[overIndex - 1]
        aboveOrder = prevTask ? prevTask.sortOrder : null
      }

      const { newSortOrder } = calculateFractionalSortOrder(aboveOrder, belowOrder)

      try {
        await reorderTask({
          taskId: sourceTaskId,
          targetSortOrder: newSortOrder,
          parentTaskId: overTask.parentTaskId,
          projectId: overTask.projectId
        })
        useTaskStore.getState().notifyTaskChanged()
      } catch (err: any) {
        console.error('Failed to reorder task', err)
      }
    }
  }, [allTasks, updateTask, completeTask, uncompleteTask, changeTaskStatus, moveTask, reorderTask, makeSubtask, projects, dropIntent])

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
    setActiveStage(null)
    setDropIntent('none')
  }, [])

  const contextValue = useMemo(() => ({
    activeTaskId: activeTask?.id ?? null,
    activeTask,
    activeStageId: activeStage?.id ?? null,
    activeStage,
    isDragging: activeTask !== null || activeStage !== null,
    dropIntent,
    setDropIntent
  }), [activeTask, activeStage, dropIntent])

  return (
    <TaskDndStateContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        autoScroll={{ threshold: { x: 0.1, y: 0.15 }, acceleration: 10 }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
          {activeTask ? <TaskDragPreview task={activeTask} /> : null}
          {activeStage ? <StageDragPreview stage={activeStage} /> : null}
        </DragOverlay>
      </DndContext>
    </TaskDndStateContext.Provider>
  )
}

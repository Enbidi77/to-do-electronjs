import { create } from 'zustand'
import type {
  Task,
  TaskFilter,
  TaskSort,
  TaskStats,
  ReorderTaskInput,
  MoveTaskInput,
  ChangeTaskStatusInput,
  MakeSubtaskInput
} from '@shared/types'

export interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  filter: TaskFilter
  sort: TaskSort
  stats: TaskStats | null
  tasksVersion: number

  setTasks: (tasks: Task[]) => void
  fetchTasks: (options?: any) => Promise<void>
  fetchStats: () => Promise<void>
  notifyTaskChanged: () => void
  createTask: (input: any) => Promise<Task>
  updateTask: (id: string, input: any) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<Task>
  uncompleteTask: (id: string) => Promise<Task>
  archiveTask: (id: string) => Promise<Task>
  reorderTasks: (ids: string[]) => Promise<void>
  reorderTask: (input: ReorderTaskInput) => Promise<Task>
  moveTask: (input: MoveTaskInput) => Promise<Task>
  changeTaskStatus: (input: ChangeTaskStatusInput) => Promise<Task>
  makeSubtask: (input: MakeSubtaskInput) => Promise<Task>
  setFilter: (filter: TaskFilter) => void
  setSort: (sort: TaskSort) => void
  searchTasks: (query: string) => Promise<Task[]>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filter: {},
  sort: { field: 'createdAt', direction: 'desc' } as TaskSort,
  stats: null,
  tasksVersion: 0,

  setTasks: (tasks) => set({ tasks }),

  fetchTasks: async (options) => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.api.tasks.list(options)
      set({ tasks, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', loading: false })
    }
  },

  fetchStats: async () => {
    try {
      if (window.api?.tasks?.getStats) {
        const stats = await window.api.tasks.getStats()
        set({ stats })
      }
    } catch (err: any) {
      console.error('Failed to fetch task stats', err)
    }
  },

  notifyTaskChanged: () => {
    set((state) => ({ tasksVersion: state.tasksVersion + 1 }))
    get().fetchStats()
  },

  createTask: async (input) => {
    try {
      const newTask = await window.api.tasks.create(input)
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return newTask
    } catch (err: any) {
      set({ error: err.message || 'Failed to create task' })
      throw err
    }
  },

  updateTask: async (id, input) => {
    try {
      const updatedTask = await window.api.tasks.update(id, input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return updatedTask
    } catch (err: any) {
      set({ error: err.message || 'Failed to update task' })
      throw err
    }
  },

  deleteTask: async (id) => {
    try {
      await window.api.tasks.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete task' })
      throw err
    }
  },

  completeTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t)),
      tasksVersion: state.tasksVersion + 1
    }))
    try {
      const updated = await window.api.tasks.complete(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'active', completedAt: null } : t)),
        tasksVersion: state.tasksVersion + 1,
        error: err.message || 'Failed to complete task'
      }))
      get().fetchStats()
      throw err
    }
  },

  uncompleteTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'active', completedAt: null } : t)),
      tasksVersion: state.tasksVersion + 1
    }))
    try {
      const updated = await window.api.tasks.uncomplete(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t)),
        tasksVersion: state.tasksVersion + 1,
        error: err.message || 'Failed to uncomplete task'
      }))
      get().fetchStats()
      throw err
    }
  },

  archiveTask: async (id) => {
    try {
      const archived = await window.api.tasks.archive(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? archived : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return archived
    } catch (err: any) {
      set({ error: err.message || 'Failed to archive task' })
      throw err
    }
  },

  reorderTasks: async (ids) => {
    try {
      await window.api.tasks.reorder(ids)
      set((state) => ({ tasksVersion: state.tasksVersion + 1 }))
      await get().fetchTasks()
      get().fetchStats()
    } catch (err: any) {
      set({ error: err.message || 'Failed to reorder tasks' })
      throw err
    }
  },

  reorderTask: async (input) => {
    // Optimistic local update
    if (input.targetSortOrder !== undefined) {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === input.taskId ? { ...t, sortOrder: input.targetSortOrder! } : t
        ),
        tasksVersion: state.tasksVersion + 1
      }))
    }
    try {
      const updated = await window.api.tasks.reorderTask(input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === input.taskId ? updated : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      set({ error: err.message || 'Failed to reorder task' })
      throw err
    }
  },

  moveTask: async (input) => {
    // Optimistic local update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === input.taskId ? { ...t, projectId: input.targetProjectId, parentTaskId: null } : t
      ),
      tasksVersion: state.tasksVersion + 1
    }))
    try {
      const updated = await window.api.tasks.move(input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === input.taskId ? updated : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      set({ error: err.message || 'Failed to move task' })
      throw err
    }
  },

  changeTaskStatus: async (input) => {
    // Optimistic local update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === input.taskId
          ? {
              ...t,
              status: input.status,
              completedAt: input.status === 'completed' ? (t.completedAt || new Date().toISOString()) : null
            }
          : t
      ),
      tasksVersion: state.tasksVersion + 1
    }))
    try {
      const updated = await window.api.tasks.changeStatus(input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === input.taskId ? updated : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      set({ error: err.message || 'Failed to change task status' })
      throw err
    }
  },

  makeSubtask: async (input) => {
    // Optimistic local update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === input.taskId ? { ...t, parentTaskId: input.parentTaskId } : t
      ),
      tasksVersion: state.tasksVersion + 1
    }))
    try {
      const updated = await window.api.tasks.makeSubtask(input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === input.taskId ? updated : t)),
        tasksVersion: state.tasksVersion + 1
      }))
      get().fetchStats()
      return updated
    } catch (err: any) {
      set({ error: err.message || 'Failed to make subtask' })
      throw err
    }
  },

  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  searchTasks: async (query) => {
    return await window.api.tasks.search(query)
  }
}))

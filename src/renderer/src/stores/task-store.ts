import { create } from 'zustand'
import type { Task, TaskFilter, TaskSort } from '@shared/types'

export interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  filter: TaskFilter
  sort: TaskSort

  fetchTasks: (options?: any) => Promise<void>
  createTask: (input: any) => Promise<void>
  updateTask: (id: string, input: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  reorderTasks: (ids: string[]) => Promise<void>
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

  fetchTasks: async (options) => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.api.tasks.list(options)
      set({ tasks, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', loading: false })
    }
  },
  createTask: async (input) => {
    try {
      const newTask = await window.api.tasks.create(input)
      set((state) => ({ tasks: [newTask, ...state.tasks] }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to create task' })
    }
  },
  updateTask: async (id, input) => {
    try {
      const updatedTask = await window.api.tasks.update(id, input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t))
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update task' })
    }
  },
  deleteTask: async (id) => {
    try {
      await window.api.tasks.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete task' })
    }
  },
  completeTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
    }))
    try {
      const updated = await window.api.tasks.complete(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }))
    } catch (err: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'active' } : t)),
        error: err.message || 'Failed to complete task'
      }))
    }
  },
  uncompleteTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'active' } : t))
    }))
    try {
      const updated = await window.api.tasks.uncomplete(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t))
      }))
    } catch (err: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)),
        error: err.message || 'Failed to uncomplete task'
      }))
    }
  },
  archiveTask: async (id) => {
    try {
      const archived = await window.api.tasks.archive(id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? archived : t))
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to archive task' })
    }
  },
  reorderTasks: async (ids) => {
    try {
      await window.api.tasks.reorder(ids)
      await get().fetchTasks()
    } catch (err: any) {
      set({ error: err.message || 'Failed to reorder tasks' })
    }
  },
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  searchTasks: async (query) => {
    return await window.api.tasks.search(query)
  }
}))

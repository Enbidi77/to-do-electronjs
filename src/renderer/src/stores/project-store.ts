import { create } from 'zustand'
import type { Project } from '@shared/types'

export interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null

  fetchProjects: () => Promise<void>
  createProject: (input: any) => Promise<void>
  updateProject: (id: string, input: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  reorderProjects: (ids: string[]) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await window.api.projects.list()
      set({ projects, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch projects', loading: false })
    }
  },
  createProject: async (input) => {
    try {
      const newProject = await window.api.projects.create(input)
      set((state) => ({ projects: [...state.projects, newProject] }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to create project' })
    }
  },
  updateProject: async (id, input) => {
    try {
      const updated = await window.api.projects.update(id, input)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p))
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update project' })
    }
  },
  deleteProject: async (id) => {
    try {
      await window.api.projects.delete(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete project' })
    }
  },
  reorderProjects: async (ids) => {
    try {
      await window.api.projects.reorder(ids)
      await get().fetchProjects()
    } catch (err: any) {
      set({ error: err.message || 'Failed to reorder projects' })
    }
  }
}))

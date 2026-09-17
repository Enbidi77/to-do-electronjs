import { create } from 'zustand'
import type { Stage, CreateStageInput, UpdateStageInput } from '@shared/types'

export interface StageState {
  stages: Stage[]
  loading: boolean
  error: string | null

  fetchStages: () => Promise<void>
  createStage: (input: CreateStageInput) => Promise<Stage | null>
  updateStage: (id: string, input: UpdateStageInput) => Promise<Stage | null>
  deleteStage: (id: string, fallbackStageId?: string) => Promise<boolean>
  reorderStages: (ids: string[]) => Promise<void>
  setStages: (stages: Stage[]) => void
}

export const useStageStore = create<StageState>((set, get) => ({
  stages: [],
  loading: false,
  error: null,

  setStages: (stages) => set({ stages }),

  fetchStages: async () => {
    set({ loading: true, error: null })
    try {
      if (window.api?.stages?.list) {
        const stages = await window.api.stages.list()
        set({ stages, loading: false })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch stages', loading: false })
    }
  },

  createStage: async (input) => {
    try {
      if (window.api?.stages?.create) {
        const newStage = await window.api.stages.create(input)
        set((state) => {
          const exists = state.stages.some(s => s.id === newStage.id)
          return { stages: exists ? state.stages.map(s => s.id === newStage.id ? newStage : s) : [...state.stages, newStage] }
        })
        return newStage
      }
      return null
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create stage' })
      throw err
    }
  },

  updateStage: async (id, input) => {
    try {
      if (window.api?.stages?.update) {
        const updated = await window.api.stages.update(id, input)
        set((state) => ({
          stages: state.stages.map((s) => (s.id === id ? updated : s))
        }))
        return updated
      }
      return null
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update stage' })
      throw err
    }
  },

  deleteStage: async (id, fallbackStageId) => {
    try {
      if (window.api?.stages?.delete) {
        await window.api.stages.delete(id, fallbackStageId)
        set((state) => ({
          stages: state.stages.filter((s) => s.id !== id)
        }))
        return true
      }
      return false
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete stage' })
      throw err
    }
  },

  reorderStages: async (ids) => {
    try {
      if (window.api?.stages?.reorder) {
        // Optimistically update local stages order
        const currentStages = get().stages
        const stageMap = new Map(currentStages.map((s) => [s.id, s]))
        const reordered = ids.map((id) => stageMap.get(id)!).filter(Boolean)
        set({ stages: reordered })

        await window.api.stages.reorder(ids)
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reorder stages' })
      get().fetchStages()
    }
  }
}))

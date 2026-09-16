import { create } from 'zustand'
import type { Tag } from '@shared/types'

export interface TagState {
  tags: Tag[]
  loading: boolean
  error: string | null

  fetchTags: () => Promise<void>
  createTag: (input: any) => Promise<void>
  updateTag: (id: string, input: any) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true, error: null })
    try {
      const tags = await window.api.tags.list()
      set({ tags, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tags', loading: false })
    }
  },
  createTag: async (input) => {
    try {
      const newTag = await window.api.tags.create(input)
      set((state) => ({ tags: [...state.tags, newTag] }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to create tag' })
    }
  },
  updateTag: async (id, input) => {
    try {
      const updated = await window.api.tags.update(id, input)
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? updated : t))
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update tag' })
    }
  },
  deleteTag: async (id) => {
    try {
      await window.api.tags.delete(id)
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id)
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete tag' })
    }
  }
}))

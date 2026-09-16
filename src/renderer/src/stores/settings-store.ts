import { create } from 'zustand'
import type { AppSettings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { setApplicationLanguage } from '@/i18n'

export interface SettingsState {
  settings: AppSettings
  loading: boolean
  error: string | null

  fetchSettings: () => Promise<void>
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      if (window.api?.settings?.getAll) {
        const settings = await window.api.settings.getAll()
        if (settings?.language) {
          await setApplicationLanguage(settings.language)
        }
        set({ settings, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings'
      set({ error: message, loading: false })
    }
  },
  updateSetting: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    try {
      if (key === 'language') {
        await setApplicationLanguage(value as 'en' | 'vi')
      }
      if (window.api?.settings?.set) {
        await window.api.settings.set(key, value)
      }
      set((state) => ({
        settings: {
          ...state.settings,
          [key]: value
        }
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update setting'
      set({ error: message })
    }
  }
}))

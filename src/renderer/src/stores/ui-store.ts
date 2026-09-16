import { create } from 'zustand'

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'completed' | 'project' | 'tag' | 'settings' | 'calendar'

export interface UiState {
  sidebarCollapsed: boolean
  currentView: ViewType
  currentProjectId: string | null
  currentTagId: string | null
  selectedTaskId: string | null
  detailsPanelOpen: boolean
  searchOpen: boolean
  searchQuery: string
  commandPaletteOpen: boolean
  quickAddOpen: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setView: (view: ViewType, id?: string | null) => void
  selectTask: (id: string | null) => void
  openDetails: (taskId: string) => void
  closeDetails: () => void
  setDetailsPanelOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setCommandPaletteOpen: (open: boolean) => void
  setQuickAddOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  currentView: 'inbox',
  currentProjectId: null,
  currentTagId: null,
  selectedTaskId: null,
  detailsPanelOpen: false,
  searchOpen: false,
  searchQuery: '',
  commandPaletteOpen: false,
  quickAddOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setView: (view, id = null) => set(() => {
    const nextState: Partial<UiState> = { currentView: view, detailsPanelOpen: false }
    if (view === 'project') {
      nextState.currentProjectId = id
    } else {
      nextState.currentProjectId = null
    }
    
    if (view === 'tag') {
      nextState.currentTagId = id
    } else {
      nextState.currentTagId = null
    }
    return nextState
  }),
  selectTask: (id) => set({ selectedTaskId: id }),
  openDetails: (taskId) => set({ selectedTaskId: taskId, detailsPanelOpen: true }),
  closeDetails: () => set({ detailsPanelOpen: false }),
  setDetailsPanelOpen: (open) => set({ detailsPanelOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setQuickAddOpen: (open) => set({ quickAddOpen: open })
}))

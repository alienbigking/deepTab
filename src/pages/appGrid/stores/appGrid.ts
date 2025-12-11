import { create } from 'zustand'
import type { Apps, ContextMenuState } from '../types/appGrid'

interface AppGridStore {
  // 状态
  apps: Apps[]
  isEditMode: boolean
  contextMenu: ContextMenuState | null
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'error'

  // Actions
  setApps: (apps: Apps[] | ((prevApps: Apps[]) => Apps[])) => void
  setIsEditMode: (isEditMode: boolean) => void
  setContextMenu: (contextMenu: ContextMenuState | null) => void
  setIsLoading: (isLoading: boolean) => void
  setSyncStatus: (syncStatus: 'idle' | 'syncing' | 'error') => void
}

/**
 * AppGrid 状态管理 Store
 */
export const useAppGridStore = create<AppGridStore>((set) => ({
  // 初始状态
  apps: [],
  isEditMode: false,
  contextMenu: null,
  isLoading: false,
  syncStatus: 'idle',

  // Actions
  setApps: (apps) =>
    set((state) => ({
      apps: typeof apps === 'function' ? apps(state.apps) : apps
    })),
  setIsEditMode: (isEditMode) => set({ isEditMode }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSyncStatus: (syncStatus) => set({ syncStatus })
}))

export default useAppGridStore

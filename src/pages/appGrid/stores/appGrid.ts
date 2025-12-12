import { create } from 'zustand'
import type { Apps, ContextMenuState } from '../types/appGrid'

export interface IconSettings {
  size: number
  radius: number
  opacity: number
  spacing: number
  fontSize: number
  fontColor: 'light' | 'dark'
}

interface AppGridStore {
  // 状态
  apps: Apps[]
  isEditMode: boolean
  contextMenu: ContextMenuState | null
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  iconSettings: IconSettings

  // Actions
  setApps: (apps: Apps[] | ((prevApps: Apps[]) => Apps[])) => void
  setIsEditMode: (isEditMode: boolean) => void
  setContextMenu: (contextMenu: ContextMenuState | null) => void
  setIsLoading: (isLoading: boolean) => void
  setSyncStatus: (syncStatus: 'idle' | 'syncing' | 'error') => void
  setIconSettings: (settings: Partial<IconSettings>) => void
  resetIconSettings: () => void
}

/**
 * AppGrid 状态管理 Store
 */
export const defaultIconSettings: IconSettings = {
  size: 72,
  radius: 16,
  opacity: 100,
  spacing: 24,
  fontSize: 12,
  fontColor: 'light'
}

export const useAppGridStore = create<AppGridStore>((set) => ({
  // 初始状态
  apps: [],
  isEditMode: false,
  contextMenu: null,
  isLoading: false,
  syncStatus: 'idle',
  iconSettings: defaultIconSettings,

  // Actions
  setApps: (apps) =>
    set((state) => ({
      apps: typeof apps === 'function' ? apps(state.apps) : apps
    })),
  setIsEditMode: (isEditMode) => set({ isEditMode }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setIconSettings: (settings) =>
    set((state) => ({
      iconSettings: { ...state.iconSettings, ...settings }
    })),
  resetIconSettings: () => set({ iconSettings: defaultIconSettings })
}))

export default useAppGridStore

import { create } from 'zustand'
import { IAppSettings } from '../types/settingsSidebar'

interface SettingsSidebarStore {
  sidebarOpen: boolean
  appSettings: IAppSettings
  setSidebarOpen: (open: boolean) => void
  setAppSettings: (settings: IAppSettings) => void
}

export const useSettingsSidebarStore = create<SettingsSidebarStore>((set) => ({
  sidebarOpen: false,
  appSettings: {
    wallpaper: {
      type: 'gradient',
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
    },
    clock: {
      format: '24',
      showSeconds: true,
      style: 'digital'
    },
    searchEngine: 'baidu',
    language: 'zh',
    theme: 'auto'
  },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAppSettings: (appSettings) => set({ appSettings })
}))

export default useSettingsSidebarStore

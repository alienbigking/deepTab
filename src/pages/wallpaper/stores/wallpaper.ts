import { create } from 'zustand'
import { IWallpaperConfig } from '../types/wallpaper'

interface WallpaperStore {
  config: IWallpaperConfig | null
  activeTab: string
  selectedColor: string
  setConfig: (config: IWallpaperConfig | null) => void
  setActiveTab: (tab: string) => void
  setSelectedColor: (color: string) => void
}

export const useWallpaperStore = create<WallpaperStore>((set) => ({
  config: null,
  activeTab: 'gradient',
  selectedColor: 'all',
  setConfig: (config) => set({ config }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedColor: (selectedColor) => set({ selectedColor })
}))

export default useWallpaperStore

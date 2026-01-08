import { create } from 'zustand'
import type { IWallpaperConfig, WallpaperStore } from '../types/wallpaper'

export const useWallpaperStore = create<WallpaperStore>((set) => ({
  config: null,
  activeTab: 'gradient',
  selectedColor: 'all',
  featuredCategory: '全部',
  setConfig: (config) => set({ config }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  setFeaturedCategory: (featuredCategory) => set({ featuredCategory })
}))

export default useWallpaperStore

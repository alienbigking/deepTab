import { create } from 'zustand'
import { IThemeConfig } from '../types/theme'

interface ThemeStore {
  config: IThemeConfig
  setConfig: (config: IThemeConfig) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  config: {
    mode: 'auto',
    primaryColor: '#ff6b35',
    borderRadius: 8
  },
  setConfig: (config) => set({ config })
}))

export default useThemeStore

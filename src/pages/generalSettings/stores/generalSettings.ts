import { create } from 'zustand'
import { IGeneralSettings } from '../types/generalSettings'

interface GeneralSettingsStore {
  settings: IGeneralSettings
  setSettings: (settings: IGeneralSettings) => void
}

export const useGeneralSettingsStore = create<GeneralSettingsStore>((set) => ({
  settings: {
    language: 'zh',
    timeFormat: '24',
    showWeather: true,
    showClock: true,
    autoSave: true,
    animations: true
  },
  setSettings: (settings) => set({ settings })
}))

export default useGeneralSettingsStore

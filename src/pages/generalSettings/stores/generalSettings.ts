import { create } from 'zustand'
import { IGeneralSettings } from '../types/generalSettings'

export const defaultGeneralSettings: IGeneralSettings = {
  language: 'zh',
  timeFormat: '24',
  showWeather: true,
  showClock: true,
  autoSave: true,
  animations: true
}

interface GeneralSettingsStore {
  settings: IGeneralSettings
  setSettings: (settings: Partial<IGeneralSettings>) => void
}

export const useGeneralSettingsStore = create<GeneralSettingsStore>((set) => ({
  settings: defaultGeneralSettings,
  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings }
    }))
}))

export default useGeneralSettingsStore

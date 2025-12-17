import { create } from 'zustand'
import { IGeneralSettings } from '../types/generalSettings'

export const defaultGeneralSettings: IGeneralSettings = {
  controlBar: {
    sidebar: 'alwaysShow',
    sidebarPosition: 'right',
    bottomBar: 'alwaysHide'
  },
  search: {
    searchBarStyle: 'default',
    openMethod: 'newTab',
    searchSuggestions: true,
    searchHistory: true,
    tabSwitchEngine: true,
    keepSearchValue: true
  },
  other: {
    scrollSensitivity: 41,
    useSystemFont: true,
    showIcp: false
  }
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

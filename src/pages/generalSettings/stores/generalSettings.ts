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
    searchBarWidth: 60,
    searchBarOpacity: 95,
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
      settings: {
        ...state.settings,
        ...settings,
        controlBar: { ...state.settings.controlBar, ...(settings as any).controlBar },
        search: { ...state.settings.search, ...(settings as any).search },
        other: { ...state.settings.other, ...(settings as any).other }
      }
    }))
}))

export default useGeneralSettingsStore

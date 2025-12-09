import { atom } from 'recoil'
import { IGeneralSettings } from '../types/generalSettings'

const generalSettingsStore = atom<IGeneralSettings>({
  key: 'generalSettingsStore',
  default: {
    language: 'zh',
    timeFormat: '24',
    showWeather: true,
    showClock: true,
    autoSave: true,
    animations: true
  }
})

export default { generalSettingsStore }

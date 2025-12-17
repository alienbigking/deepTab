import { defaultGeneralSettings } from '../stores/generalSettings'
import { IGeneralSettings } from '../types/generalSettings'

export default {
  async getGeneralSettings(): Promise<IGeneralSettings> {
    try {
      const result = await chrome.storage.local.get(['generalSettings'])
      const raw = (result.generalSettings || {}) as Partial<IGeneralSettings>
      return {
        ...defaultGeneralSettings,
        ...raw,
        controlBar: { ...defaultGeneralSettings.controlBar, ...(raw as any).controlBar },
        search: { ...defaultGeneralSettings.search, ...(raw as any).search },
        other: { ...defaultGeneralSettings.other, ...(raw as any).other }
      }
    } catch (error) {
      console.error('获取常规设置失败:', error)
      return defaultGeneralSettings
    }
  },

  async saveGeneralSettings(settings: IGeneralSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ generalSettings: settings })
    } catch (error) {
      console.error('保存常规设置失败:', error)
    }
  }
}

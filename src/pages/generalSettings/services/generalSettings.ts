import { IGeneralSettings } from '../types/generalSettings'

export default {
  async getGeneralSettings(): Promise<IGeneralSettings> {
    try {
      const result = await chrome.storage.local.get(['generalSettings'])
      return (
        result.generalSettings || {
          language: 'zh',
          timeFormat: '24',
          showWeather: true,
          showClock: true,
          autoSave: true,
          animations: true
        }
      )
    } catch (error) {
      console.error('获取常规设置失败:', error)
      return {
        language: 'zh',
        timeFormat: '24',
        showWeather: true,
        showClock: true,
        autoSave: true,
        animations: true
      }
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

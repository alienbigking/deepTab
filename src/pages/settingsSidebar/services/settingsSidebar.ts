import { IAppSettings } from '../types/settingsSidebar'

/**
 * settingsSidebar 服务层
 */
export default {
  // 获取应用设置
  async getAppSettings(): Promise<IAppSettings> {
    try {
      const result = await chrome.storage.local.get(['appSettings'])
      return (
        result.appSettings || {
          wallpaper: {
            type: 'gradient',
            gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
          },
          clock: {
            format: '24',
            showSeconds: true,
            style: 'digital'
          },
          searchEngine: 'baidu',
          language: 'zh',
          theme: 'auto'
        }
      )
    } catch (error) {
      console.error('获取应用设置失败:', error)
      return {
        wallpaper: {
          type: 'gradient',
          gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
        },
        clock: {
          format: '24',
          showSeconds: true,
          style: 'digital'
        },
        searchEngine: 'baidu',
        language: 'zh',
        theme: 'auto'
      }
    }
  },

  // 保存应用设置
  async saveAppSettings(settings: IAppSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ appSettings: settings })
    } catch (error) {
      console.error('保存应用设置失败:', error)
    }
  },

  // 重置应用设置
  async resetAppSettings(): Promise<void> {
    try {
      await chrome.storage.local.remove(['appSettings'])
    } catch (error) {
      console.error('重置应用设置失败:', error)
    }
  }
}

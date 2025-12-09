import { IThemeConfig } from '../types/theme'

export default {
  async getThemeConfig(): Promise<IThemeConfig> {
    try {
      const result = await chrome.storage.local.get(['themeConfig'])
      return (
        result.themeConfig || {
          mode: 'auto',
          primaryColor: '#ff6b35',
          borderRadius: 8
        }
      )
    } catch (error) {
      console.error('获取主题配置失败:', error)
      return {
        mode: 'auto',
        primaryColor: '#ff6b35',
        borderRadius: 8
      }
    }
  },

  async saveThemeConfig(config: IThemeConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ themeConfig: config })
    } catch (error) {
      console.error('保存主题配置失败:', error)
    }
  }
}

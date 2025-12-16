import type { IThemeConfig } from '../types/theme'

export default {
  async getThemeConfig(): Promise<IThemeConfig> {
    try {
      const result = await chrome.storage.local.get(['themeConfig'])

      const raw = (result.themeConfig || {}) as {
        mode?: unknown
        primaryColor?: unknown
        borderRadius?: unknown
      }

      const modeRaw = raw.mode

      const mode =
        modeRaw === 'auto'
          ? 'system'
          : modeRaw === 'default' ||
              modeRaw === 'light' ||
              modeRaw === 'dark' ||
              modeRaw === 'system'
            ? modeRaw
            : 'default'

      return {
        mode,
        primaryColor: typeof raw.primaryColor === 'string' ? raw.primaryColor : undefined,
        borderRadius: typeof raw.borderRadius === 'number' ? raw.borderRadius : undefined
      }
    } catch (error) {
      console.error('获取主题配置失败:', error)
      return {
        mode: 'default'
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

import { http } from '@/utils'
import { env } from '@/config/env'
import {
  IGradientWallpaper,
  IImageWallpaper,
  IDynamicWallpaper,
  IWallpaperConfig
} from '../types/wallpaper'

/**
 * wallpaper 服务层
 */
export default {
  // 获取渐变壁纸列表
  async getGradientWallpapers(): Promise<IGradientWallpaper[]> {
    const presets = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
      'linear-gradient(135deg, #f83600 0%, #f9d423 100%)'
    ]

    return presets.map((gradient, index) => ({
      id: `gradient-${index}`,
      type: 'gradient',
      gradient,
      angle: 135,
      colors: []
    }))
  },

  // 获取图片壁纸列表
  async getImageWallpapers(): Promise<IImageWallpaper[]> {
    try {
      const response = await http(`${env.HOST_API_URL}wallpapers/images`)
      return response.data
    } catch (error) {
      console.error('获取图片壁纸失败:', error)
      return []
    }
  },

  // 获取动态壁纸列表
  async getDynamicWallpapers(): Promise<IDynamicWallpaper[]> {
    try {
      const response = await http(`${env.HOST_API_URL}wallpapers/dynamic`)
      return response.data
    } catch (error) {
      console.error('获取动态壁纸失败:', error)
      return []
    }
  },

  // 获取当前壁纸配置
  async getWallpaperConfig(): Promise<IWallpaperConfig | null> {
    try {
      const result = await chrome.storage.local.get(['wallpaperConfig'])
      return result.wallpaperConfig || null
    } catch (error) {
      console.error('获取壁纸配置失败:', error)
      return null
    }
  },

  // 保存壁纸配置
  async saveWallpaperConfig(config: IWallpaperConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ wallpaperConfig: config })
    } catch (error) {
      console.error('保存壁纸配置失败:', error)
    }
  }
}

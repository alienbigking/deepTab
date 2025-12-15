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
    const extractHexColors = (gradient: string) => {
      const matches = gradient.match(/#[0-9a-fA-F]{3,8}/g)
      if (!matches) return []
      return matches.map((c) => c.toLowerCase())
    }

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
      colors: extractHexColors(gradient)
    }))
  },

  // 获取图片壁纸列表
  async getImageWallpapers(): Promise<IImageWallpaper[]> {
    try {
      const response = await http(`${env.HOST_API_URL}wallpapers/images`)
      const data: unknown = response.data
      if (!Array.isArray(data)) return []
      return (data as IImageWallpaper[]).map((item) => ({
        ...item,
        category: item.category || '其他'
      }))
    } catch (error) {
      console.error('获取图片壁纸失败:', error)
      const mocks: IImageWallpaper[] = [
        {
          id: 'featured-animal-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80',
          category: '动物',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-animal-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
          category: '动物',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-plant-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
          category: '植物',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-plant-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80',
          category: '植物',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-anime-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=600&q=80',
          category: '动漫',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-anime-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1518443895914-7d8b0f1b5cdb?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1518443895914-7d8b0f1b5cdb?auto=format&fit=crop&w=600&q=80',
          category: '动漫',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-street-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
          category: '街头',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-street-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1520975682031-ae460d545300?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1520975682031-ae460d545300?auto=format&fit=crop&w=600&q=80',
          category: '街头',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-nature-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
          category: '自然',
          author: 'Unsplash',
          source: 'unsplash'
        },
        {
          id: 'featured-nature-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
          thumbnail:
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
          category: '自然',
          author: 'Unsplash',
          source: 'unsplash'
        }
      ]
      return mocks
    }
  },

  // 获取动态壁纸列表
  async getDynamicWallpapers(): Promise<IDynamicWallpaper[]> {
    try {
      const response = await http(`${env.HOST_API_URL}wallpapers/dynamic`)
      return response.data
    } catch (error) {
      console.error('获取动态壁纸失败:', error)
      const mocks: IDynamicWallpaper[] = [
        {
          id: 'dynamic-1',
          type: 'dynamic',
          videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          thumbnail:
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'dynamic-2',
          type: 'dynamic',
          videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/forest.mp4',
          thumbnail:
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'dynamic-3',
          type: 'dynamic',
          videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/river.mp4',
          thumbnail:
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80'
        }
      ]
      return mocks
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

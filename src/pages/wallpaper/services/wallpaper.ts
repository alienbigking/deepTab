import { http } from '@/utils'
import { env } from '@/config/env'
import {
  IGradientWallpaper,
  IImageWallpaper,
  IDynamicWallpaper,
  IWallpaperConfig,
  IWallpaperPageResult
} from '../types/wallpaper'
import requestDeepTabAutoSync from '@/pages/deepTabSync/services/autoSync'

const syncTimeout = 20000
const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

type WallpaperPageParams = {
  category?: string
  page?: number
  pageSize?: number
}

const isHttpUrl = (value: unknown): value is string => {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

const normalizeImageWallpaper = (
  item: Partial<IImageWallpaper>,
  fallbackId: string
): IImageWallpaper | null => {
  if (!isHttpUrl(item.url)) return null
  const thumbnail = isHttpUrl(item.thumbnail) ? item.thumbnail : item.url

  return {
    id: item.id || fallbackId,
    type: 'image',
    url: item.url,
    thumbnail,
    category: item.category || '其他',
    author: item.author,
    source: item.source
  }
}

const normalizeDynamicWallpaper = (
  item: Partial<IDynamicWallpaper>,
  fallbackId: string
): IDynamicWallpaper | null => {
  if (!isHttpUrl(item.videoUrl) || !isHttpUrl(item.thumbnail)) return null

  return {
    id: item.id || fallbackId,
    type: 'dynamic',
    videoUrl: item.videoUrl,
    thumbnail: item.thumbnail,
    category: item.category || '其他',
    title: item.title,
    author: item.author,
    source: item.source
  }
}

const normalizePageResponse = <T>(
  payload: unknown,
  normalizeItem: (item: Partial<T>, fallbackId: string) => T | null
): IWallpaperPageResult<T> => {
  const raw = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const list = Array.isArray(raw.list) ? raw.list : []

  return {
    list: list
      .map((item, index) => normalizeItem((item || {}) as Partial<T>, `wallpaper-${index}`))
      .filter(Boolean) as T[],
    page: typeof raw.page === 'number' ? raw.page : 1,
    pageSize: typeof raw.pageSize === 'number' ? raw.pageSize : list.length,
    hasMore: !!raw.hasMore,
    category: typeof raw.category === 'string' ? raw.category : undefined
  }
}

/**
 * wallpaper 服务层
 */
export default {
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

  async getImageWallpapers(params: WallpaperPageParams = {}): Promise<IWallpaperPageResult<IImageWallpaper>> {
    const response = await http<IWallpaperPageResult<Partial<IImageWallpaper>>>(
      buildUrl('/api/deepTab/wallpapers/images'),
      {
        params: {
          category: params.category,
          page: params.page || 1,
          pageSize: params.pageSize || 18
        },
        timeout: syncTimeout
      }
    )

    return normalizePageResponse<IImageWallpaper>(response.data, normalizeImageWallpaper)
  },

  async getDynamicWallpapers(
    params: WallpaperPageParams = {}
  ): Promise<IWallpaperPageResult<IDynamicWallpaper>> {
    const response = await http<IWallpaperPageResult<Partial<IDynamicWallpaper>>>(
      buildUrl('/api/deepTab/wallpapers/dynamic'),
      {
        params: {
          category: params.category,
          page: params.page || 1,
          pageSize: params.pageSize || 18
        },
        timeout: syncTimeout
      }
    )

    return normalizePageResponse<IDynamicWallpaper>(response.data, normalizeDynamicWallpaper)
  },

  async getWallpaperConfig(): Promise<IWallpaperConfig | null> {
    try {
      const result = await chrome.storage.local.get(['wallpaperConfig'])
      return result.wallpaperConfig || null
    } catch (error) {
      console.error('获取壁纸配置失败:', error)
      return null
    }
  },

  async saveWallpaperConfig(config: IWallpaperConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ wallpaperConfig: config })
      requestDeepTabAutoSync('wallpaperConfig')
    } catch (error) {
      console.error('保存壁纸配置失败:', error)
    }
  }
}

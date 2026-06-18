import { http } from '@/utils'
import { env } from '@/config/env'
import {
  IGradientWallpaper,
  IImageWallpaper,
  IDynamicWallpaper,
  IWallpaperConfig
} from '../types/wallpaper'

type RemoteWallpaperManifest = {
  images?: Partial<IImageWallpaper>[]
  dynamic?: Partial<IDynamicWallpaper>[]
}

type BingImage = {
  url?: string
  urlbase?: string
  title?: string
  copyright?: string
}

type PicsumImage = {
  id: string
  author: string
  width: number
  height: number
  download_url: string
}

const WALLPAPER_IMAGE_CACHE_KEY = 'wallpaperRemoteImageCache'
const WALLPAPER_DYNAMIC_CACHE_KEY = 'wallpaperRemoteDynamicCache'
const WALLPAPER_REMOTE_SOURCE_KEY = 'wallpaperRemoteSources'
const syncTimeout = 10000
const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`
const bingBaseUrl = 'https://www.bing.com'
const publicManifestUrls = [
  buildUrl('/api/deepTab/wallpapers/manifest'),
  'https://deeptab.com/wallpapers/manifest.json'
]

const isHttpUrl = (value: unknown): value is string => {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

const withTimeout = async <T>(task: Promise<T>, timeout = syncTimeout): Promise<T> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    return await task
  } finally {
    window.clearTimeout(timer)
  }
}

const fetchJson = async <T>(url: string, timeout = syncTimeout): Promise<T> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

const getStorageValue = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const result = await chrome.storage.local.get([key])
    return (result[key] as T) || fallback
  } catch (error) {
    console.warn(`读取 ${key} 失败:`, error)
    return fallback
  }
}

const setStorageValue = async <T>(key: string, value: T) => {
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch (error) {
    console.warn(`写入 ${key} 失败:`, error)
  }
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
  if (!isHttpUrl(item.videoUrl)) return null
  if (!isHttpUrl(item.thumbnail)) return null

  return {
    id: item.id || fallbackId,
    type: 'dynamic',
    videoUrl: item.videoUrl,
    thumbnail: item.thumbnail
  }
}

const dedupeByUrl = <T extends { url?: string; videoUrl?: string; id: string }>(items: T[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url || item.videoUrl || item.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const normalizeResponseList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const payload = data as { data?: unknown; list?: unknown; items?: unknown }
    if (Array.isArray(payload.data)) return payload.data as T[]
    if (Array.isArray(payload.list)) return payload.list as T[]
    if (Array.isArray(payload.items)) return payload.items as T[]
  }
  return []
}

const fetchDeepTabImages = async () => {
  const response = await http<Partial<IImageWallpaper>[]>(buildUrl('/api/deepTab/wallpapers/images'), {
    timeout: syncTimeout
  })
  return normalizeResponseList<Partial<IImageWallpaper>>(response.data).map((item, index) =>
    normalizeImageWallpaper(item, `deeptab-image-${index}`)
  )
}

const fetchDeepTabDynamic = async () => {
  const response = await http<Partial<IDynamicWallpaper>[]>(buildUrl('/api/deepTab/wallpapers/dynamic'), {
    timeout: syncTimeout
  })
  return normalizeResponseList<Partial<IDynamicWallpaper>>(response.data).map((item, index) =>
    normalizeDynamicWallpaper(item, `deeptab-dynamic-${index}`)
  )
}

const fetchRemoteManifests = async () => {
  const customUrls = await getStorageValue<string[]>(WALLPAPER_REMOTE_SOURCE_KEY, [])
  const urls = Array.from(new Set([...customUrls, ...publicManifestUrls])).filter(isHttpUrl)
  const results = await Promise.allSettled(urls.map((url) => fetchJson<RemoteWallpaperManifest>(url, 6000)))
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

const fetchBingImages = async (): Promise<IImageWallpaper[]> => {
  const params = new URLSearchParams({
    format: 'js',
    idx: '0',
    n: '8',
    mkt: 'zh-CN'
  })
  const data = await fetchJson<{ images?: BingImage[] }>(
    `${bingBaseUrl}/HPImageArchive.aspx?${params.toString()}`
  )

  return (data.images || [])
    .map((item, index) => {
      const fullUrl = item.url?.startsWith('http') ? item.url : `${bingBaseUrl}${item.url || ''}`
      const thumbnailBase = item.urlbase ? `${bingBaseUrl}${item.urlbase}_640x360.jpg` : fullUrl
      return normalizeImageWallpaper(
        {
          id: `bing-${index}-${item.urlbase || item.url || ''}`,
          type: 'image',
          url: fullUrl,
          thumbnail: thumbnailBase,
          category: '自然',
          author: item.copyright || item.title || 'Bing',
          source: 'Bing'
        },
        `bing-${index}`
      )
    })
    .filter(Boolean) as IImageWallpaper[]
}

const fetchPicsumImages = async (): Promise<IImageWallpaper[]> => {
  const page = Math.max(1, Math.floor(Date.now() / 86400000) % 25)
  const data = await fetchJson<PicsumImage[]>(`https://picsum.photos/v2/list?page=${page}&limit=12`)

  return data
    .map((item) =>
      normalizeImageWallpaper(
        {
          id: `picsum-${item.id}`,
          type: 'image',
          url: `https://picsum.photos/id/${item.id}/1920/1080`,
          thumbnail: `https://picsum.photos/id/${item.id}/640/360`,
          category: '其他',
          author: item.author,
          source: 'Picsum'
        },
        `picsum-${item.id}`
      )
    )
    .filter(Boolean) as IImageWallpaper[]
}

const buildCategoryImageSeeds = (): IImageWallpaper[] => {
  const categories = [
    { category: '动物', query: 'animal' },
    { category: '动物', query: 'dog' },
    { category: '植物', query: 'plant' },
    { category: '植物', query: 'flower' },
    { category: '动漫', query: 'anime' },
    { category: '动漫', query: 'illustration' },
    { category: '街头', query: 'street' },
    { category: '街头', query: 'city' }
  ]

  return categories.map((item, index) => ({
    id: `loremflickr-${item.query}-${index}`,
    type: 'image',
    url: `https://loremflickr.com/1920/1080/${item.query}?lock=${index + 30}`,
    thumbnail: `https://loremflickr.com/640/360/${item.query}?lock=${index + 30}`,
    category: item.category,
    author: 'LoremFlickr',
    source: 'LoremFlickr'
  }))
}

const dynamicFallbacks: IDynamicWallpaper[] = [
  {
    id: 'mdn-flower',
    type: 'dynamic',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail: 'https://loremflickr.com/640/360/flower?lock=101'
  },
  {
    id: 'mdn-river',
    type: 'dynamic',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/river.mp4',
    thumbnail: 'https://loremflickr.com/640/360/river?lock=102'
  }
]

const getCachedImages = () => getStorageValue<IImageWallpaper[]>(WALLPAPER_IMAGE_CACHE_KEY, [])
const getCachedDynamic = () => getStorageValue<IDynamicWallpaper[]>(WALLPAPER_DYNAMIC_CACHE_KEY, [])

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
    const cached = await getCachedImages()

    try {
      const [deeptabResult, manifestResult, bingResult, picsumResult] = await Promise.allSettled([
        withTimeout(fetchDeepTabImages()),
        fetchRemoteManifests(),
        fetchBingImages(),
        fetchPicsumImages()
      ])

      const manifestImages =
        manifestResult.status === 'fulfilled'
          ? manifestResult.value.flatMap((manifest) => manifest.images || [])
          : []

      const remoteImages = [
        ...(deeptabResult.status === 'fulfilled' ? deeptabResult.value : []),
        ...manifestImages.map((item, index) => normalizeImageWallpaper(item, `manifest-image-${index}`)),
        ...(bingResult.status === 'fulfilled' ? bingResult.value : []),
        ...(picsumResult.status === 'fulfilled' ? picsumResult.value : []),
        ...buildCategoryImageSeeds()
      ].filter(Boolean) as IImageWallpaper[]

      const next = dedupeByUrl(remoteImages)
      if (next.length > 0) {
        await setStorageValue(WALLPAPER_IMAGE_CACHE_KEY, next)
        return next
      }
    } catch (error) {
      console.error('同步图片壁纸失败:', error)
    }

    return cached
  },

  // 获取动态壁纸列表
  async getDynamicWallpapers(): Promise<IDynamicWallpaper[]> {
    const cached = await getCachedDynamic()

    try {
      const [deeptabResult, manifestResult] = await Promise.allSettled([
        withTimeout(fetchDeepTabDynamic()),
        fetchRemoteManifests()
      ])

      const manifestDynamic =
        manifestResult.status === 'fulfilled'
          ? manifestResult.value.flatMap((manifest) => manifest.dynamic || [])
          : []

      const remoteDynamic = [
        ...(deeptabResult.status === 'fulfilled' ? deeptabResult.value : []),
        ...manifestDynamic.map((item, index) => normalizeDynamicWallpaper(item, `manifest-dynamic-${index}`))
      ].filter(Boolean) as IDynamicWallpaper[]

      const next = dedupeByUrl(remoteDynamic)
      if (next.length > 0) {
        await setStorageValue(WALLPAPER_DYNAMIC_CACHE_KEY, next)
        return next
      }
    } catch (error) {
      console.error('同步动态壁纸失败:', error)
    }

    return cached.length > 0 ? cached : dynamicFallbacks
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

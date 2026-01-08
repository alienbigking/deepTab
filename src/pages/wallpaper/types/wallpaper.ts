/**
 * wallpaper 模块类型定义
 */

// 壁纸类型
export type WallpaperType = 'gradient' | 'image' | 'dynamic'

// 渐变壁纸
export interface IGradientWallpaper {
  id: string
  type: 'gradient'
  gradient: string
  angle: number
  colors: string[]
}

// 图片壁纸
export interface IImageWallpaper {
  id: string
  type: 'image'
  url: string
  thumbnail: string
  category: string
  author?: string
  source?: string
}

// 动态壁纸
export interface IDynamicWallpaper {
  id: string
  type: 'dynamic'
  videoUrl: string
  thumbnail: string
}

// 壁纸配置
export interface IWallpaperConfig {
  currentWallpaper: IGradientWallpaper | IImageWallpaper | IDynamicWallpaper
  brightness: number
  blur: number
  featuredCategory?: string
  gradientAngle?: number
  saturation?: number
  dynamicMuted?: boolean
  dynamicPaused?: boolean
}

/**
 * Wallpaper Store 接口
 */
export interface WallpaperStore {
  config: IWallpaperConfig | null
  activeTab: string
  selectedColor: string
  featuredCategory: string
  setConfig: (config: IWallpaperConfig | null) => void
  setActiveTab: (tab: string) => void
  setSelectedColor: (color: string) => void
  setFeaturedCategory: (category: string) => void
}

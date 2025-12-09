/**
 * settingsSidebar 模块类型定义
 */

// 壁纸类型
type WallpaperType = 'gradient' | 'image' | 'solid'

// 壁纸配置
interface IWallpaperConfig {
  type: WallpaperType
  gradient?: string
  imageUrl?: string
  solidColor?: string
}

// 时钟设置
interface IClockSettings {
  format: '12' | '24'
  showSeconds: boolean
  style: 'digital' | 'analog'
}

// 应用设置
interface IAppSettings {
  wallpaper: IWallpaperConfig
  clock: IClockSettings
  searchEngine: string
  language: 'zh' | 'en'
  theme: 'light' | 'dark' | 'auto'
}

export { WallpaperType, IWallpaperConfig, IClockSettings, IAppSettings }

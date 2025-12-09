import { atom } from 'recoil'
import { IWallpaperConfig } from '../types/wallpaper'

// 壁纸配置
const wallpaperConfigStore = atom<IWallpaperConfig | null>({
  key: 'wallpaperConfigStore',
  default: null
})

// 当前选中的标签页
const activeTabStore = atom<string>({
  key: 'wallpaperActiveTabStore',
  default: 'gradient'
})

// 选中的颜色过滤器
const selectedColorStore = atom<string>({
  key: 'wallpaperSelectedColorStore',
  default: 'all'
})

export default { wallpaperConfigStore, activeTabStore, selectedColorStore }

import { atom } from 'recoil'
import { IAppSettings } from '../types/settingsSidebar'

// 侧边栏打开状态
const sidebarOpenStore = atom<boolean>({
  key: 'sidebarOpenStore',
  default: false
})

// 应用设置
const appSettingsStore = atom<IAppSettings>({
  key: 'appSettingsStore',
  default: {
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
})

export default { sidebarOpenStore, appSettingsStore }

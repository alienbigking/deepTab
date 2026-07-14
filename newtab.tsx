import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './src/pages/main'
import './src/i18n'
import './global.less'
import './src/common/modalMotion.css'
import 'simplebar-react/dist/simplebar.min.css'
import { App, ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { AppUIProvider } from './src/common/ui'
import useThemeStore from './src/pages/theme/stores/theme'
import type { IWallpaperConfig } from './src/pages/wallpaper/types/wallpaper'

interface NewTabAppProps {
  initialWallpaperConfig?: IWallpaperConfig | null
}

const loadInitialWallpaperConfig = async (): Promise<IWallpaperConfig | null> => {
  try {
    const result = await chrome.storage.local.get(['wallpaperConfig'])
    return (result.wallpaperConfig as IWallpaperConfig) || null
  } catch (error) {
    console.error('初始化读取 wallpaperConfig 失败:', error)
    return null
  }
}

const NewTabApp: React.FC<NewTabAppProps> = ({ initialWallpaperConfig }) => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'zh' ? zhCN : enUS
  const { antdThemeMode, dataTheme, init } = useThemeStore()

  React.useEffect(() => {
    void init()
  }, [init])

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', dataTheme)
  }, [dataTheme])

  return (
    <AppUIProvider>
      <ConfigProvider
        locale={locale}
        theme={{
          algorithm: antdThemeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
        }}
      >
        <App>
          <Main initialWallpaperConfig={initialWallpaperConfig} />
        </App>
      </ConfigProvider>
    </AppUIProvider>
  )
}

const bootstrap = async () => {
  const initialWallpaperConfig = await loadInitialWallpaperConfig()
  const root = createRoot(document.getElementById('root') as HTMLElement)
  root.render(<NewTabApp initialWallpaperConfig={initialWallpaperConfig} />)
}

void bootstrap()

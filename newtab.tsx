import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './src/pages/main'
import './src/i18n'
import './global.less'
import { App, ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { AppUIProvider } from './src/common/ui'
import useThemeStore from './src/pages/theme/stores/theme'

const NewTabApp: React.FC = () => {
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
          <Main />
        </App>
      </ConfigProvider>
    </AppUIProvider>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<NewTabApp />)

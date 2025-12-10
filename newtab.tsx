import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './src/pages/main'
import './src/i18n'
import './global.less'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'

const App: React.FC = () => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'zh' ? zhCN : enUS

  return (
    <ConfigProvider locale={locale}>
      <Main />
    </ConfigProvider>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)

import React from 'react'
import { createRoot } from 'react-dom/client'
import './src/i18n'
import './global.less'
import { ConfigProvider, Typography } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

const App: React.FC = () => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'zh' ? zhCN : enUS

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: 300, padding: 20, background: '#fff' }}>
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          deepTab
        </Title>
        <Paragraph>欢迎使用 deepTab 浏览器扩展！</Paragraph>
        <Paragraph type='secondary' style={{ fontSize: 12 }}>
          打开新标签页即可体验完整功能
        </Paragraph>
      </div>
    </ConfigProvider>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)

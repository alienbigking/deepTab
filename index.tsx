import React from 'react'
import { createRoot } from 'react-dom/client'
import './src/i18n'
import './global.less'
import { ConfigProvider, Typography } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

const Index: React.FC = () => {
  const { i18n, t } = useTranslation()
  const locale = i18n.language === 'zh' ? zhCN : enUS

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: 300, padding: 20, background: '#fff' }}>
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          {t('popupTitle')}
        </Title>
        <Paragraph>{t('popupWelcome')}</Paragraph>
        <Paragraph type='secondary' style={{ fontSize: 12 }}>
          {t('popupHint')}
        </Paragraph>
      </div>
    </ConfigProvider>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<Index />)

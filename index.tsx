import React from 'react'
import { createRoot } from 'react-dom/client'
import { initializeAppLanguage } from './src/i18n'
import './global.less'
import './src/common/modalMotion.css'
import { ConfigProvider, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { getAntdLocale } from './src/i18n/antdLocale'
import { isRtlLanguage } from './src/i18n/types'

const { Title, Paragraph } = Typography

const Index: React.FC = () => {
  const { i18n, t } = useTranslation()
  const locale = getAntdLocale(i18n.resolvedLanguage)

  return (
    <ConfigProvider locale={locale} direction={isRtlLanguage(i18n.resolvedLanguage) ? 'rtl' : 'ltr'}>
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

const bootstrap = async () => {
  await initializeAppLanguage()
  const root = createRoot(document.getElementById('root') as HTMLElement)
  root.render(<Index />)
}

void bootstrap()

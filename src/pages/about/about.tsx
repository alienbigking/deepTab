import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { Card, Descriptions, Alert, Button, Space } from 'antd'
import styles from './about.module.less'
import generalSettingsService from '../generalSettings/services/generalSettings'
import { defaultGeneralSettings } from '../generalSettings/stores/generalSettings'
import LegalModal from '@/pages/legal/legalModal'
import type { LegalDocumentType } from '@/pages/legal/legalDocuments'
import { useTranslation } from 'react-i18next'

const About: React.FC = () => {
  const [showIcp, setShowIcp] = useState(defaultGeneralSettings.other.showIcp)
  const [legalType, setLegalType] = useState<LegalDocumentType | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setShowIcp(Boolean(data.other.showIcp))
    }

    void load()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes?.generalSettings) return
      void load()
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  return (
    <div className={cn(styles.container)}>
      <Alert
        message={t('about.firstUse', { defaultValue: 'First-use tip' })}
        description={t('about.browserTip', { defaultValue: 'Your browser may show its own customization button on the new tab page. You can hide it from the browser controls.' })}
        type='info'
        showIcon
        closable
        className={styles.tipAlert}
      />
      <Card title={t('sidebar.about')} className='dtSettingsCard' variant='borderless'>
        <Descriptions column={1}>
          <Descriptions.Item label={t('about.version', { defaultValue: 'Version' })}>V1.1.0</Descriptions.Item>
          <Descriptions.Item label={t('about.author', { defaultValue: 'Author' })}>deepTab Team</Descriptions.Item>
          <Descriptions.Item label={t('profile.email', { defaultValue: 'Email' })}>1260213657@qq.com</Descriptions.Item>
          <Descriptions.Item label={t('about.website', { defaultValue: 'Website' })}>https://deeptab.com</Descriptions.Item>
          <Descriptions.Item label={t('about.legal', { defaultValue: 'Legal documents' })}>
            <Space size={8} wrap>
              <Button type='link' size='small' onClick={() => setLegalType('terms')}>
                {t('sidebar.terms')}
              </Button>
              <Button type='link' size='small' onClick={() => setLegalType('privacy')}>
                {t('sidebar.privacy')}
              </Button>
            </Space>
          </Descriptions.Item>
          {showIcp && (
            <Descriptions.Item label={t('about.registration', { defaultValue: 'Registration' })}>
              <a
                href='https://beian.miit.gov.cn/'
                target='_blank'
                rel='noreferrer'
                className={styles.icpLink}
              >
                湘ICP备2021011742号
              </a>
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t('about.descriptionLabel', { defaultValue: 'Description' })}>{t('about.description', { defaultValue: 'A polished and customizable new tab extension.' })}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('about.privacyOverview', { defaultValue: 'Privacy & permissions overview' })} className='dtSettingsCard' variant='borderless'>
        <div className={styles.privacySummary}>
          <p>{t('about.privacyLocal', { defaultValue: 'Deep Tab uses browser storage for home icons, wallpapers, themes, search history, widgets, and preferences.' })}</p>
          <p>{t('about.privacyCloud', { defaultValue: 'After signing in, you can sync icons, categories, Dock, settings, and themes to the Deep Tab service.' })}</p>
          <p>{t('about.privacyThirdParty', { defaultValue: 'Weather, hot search, suggestions, and wallpaper features contact third-party services when needed.' })}</p>
        </div>
      </Card>

      <LegalModal open={Boolean(legalType)} type={legalType || 'terms'} onClose={() => setLegalType(null)} />
    </div>
  )
}

export default About

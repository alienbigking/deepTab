import React, { useCallback } from 'react'
import cn from 'classnames'
import { Card, Slider, Select } from 'antd'
import styles from './iconControl.module.less'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import type { IconSettings } from '@/pages/appGrid/types/appGrid'
import appGridService from '@/pages/appGrid/services/appGrid'
import { useTranslation } from 'react-i18next'

const IconControl: React.FC = () => {
  const { iconSettings, setIconSettings } = useAppGridStore()
  const { t } = useTranslation()

  const handleSliderChange = useCallback(
    (key: keyof IconSettings) => (value: number) => {
      const next: IconSettings = {
        ...iconSettings,
        [key]: value
      }
      setIconSettings({ [key]: value })
      void appGridService.saveIconSettings(next).catch((error) => {
        console.error('保存图标设置失败:', error)
      })
    },
    [iconSettings, setIconSettings]
  )

  const handleFontColorChange = (value: IconSettings['fontColor']) => {
    const next: IconSettings = {
      ...iconSettings,
      fontColor: value
    }
    setIconSettings({ fontColor: value })
    void appGridService.saveIconSettings(next).catch((error) => {
      console.error('保存图标设置失败:', error)
    })
  }

  return (
    <div className={styles.container}>
      <Card title={t('sidebar.iconControl')} className='dtSettingsCard' variant='borderless'>
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.subTitle}>
              {t('iconControl.description', { defaultValue: 'Fine-tune icon size, corners, spacing, and text styles.' })}
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.group}>
              <div className={styles.groupTitle}>{t('iconControl.appearance', { defaultValue: 'Icon appearance' })}</div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('iconControl.size', { defaultValue: 'Icon size' })}</span>
                <div className={styles.control}>
                  <Slider
                    min={32}
                    max={96}
                    value={iconSettings.size}
                    onChange={handleSliderChange('size')}
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('iconControl.radius', { defaultValue: 'Corner radius' })}</span>
                <div className={styles.control}>
                  <Slider
                    min={0}
                    max={24}
                    value={iconSettings.radius}
                    onChange={handleSliderChange('radius')}
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('general.opacity')}</span>
                <div className={styles.control}>
                  <Slider
                    min={40}
                    max={100}
                    value={iconSettings.opacity}
                    onChange={handleSliderChange('opacity')}
                  />
                </div>
              </div>
            </div>

            <div className={styles.group}>
              <div className={styles.groupTitle}>{t('iconControl.layoutText', { defaultValue: 'Layout & text' })}</div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('iconControl.spacing', { defaultValue: 'Icon spacing' })}</span>
                <div className={styles.control}>
                  <Slider
                    min={8}
                    max={40}
                    value={iconSettings.spacing}
                    onChange={handleSliderChange('spacing')}
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('iconControl.fontSize', { defaultValue: 'Text size' })}</span>
                <div className={styles.control}>
                  <Slider
                    min={10}
                    max={18}
                    value={iconSettings.fontSize}
                    onChange={handleSliderChange('fontSize')}
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>{t('iconControl.fontColor', { defaultValue: 'Text color' })}</span>
                <div className={styles.control}>
                  <Select
                    value={iconSettings.fontColor}
                    options={[
                      { label: t('theme.light'), value: 'light' },
                      { label: t('theme.dark'), value: 'dark' }
                    ]}
                    onChange={handleFontColorChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default IconControl

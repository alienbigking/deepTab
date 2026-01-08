import React, { useCallback } from 'react'
import cn from 'classnames'
import { Card, Slider, Select } from 'antd'
import styles from './iconControl.module.less'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import type { IconSettings } from '@/pages/appGrid/types/appGrid'
import appGridService from '@/pages/appGrid/services/appGrid'

const IconControl: React.FC = () => {
  const { iconSettings, setIconSettings } = useAppGridStore()

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
      <Card className='dtSettingsCard' bordered={false}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>图标控制</h2>
            <p className={styles.subTitle}>
              细致调节图标的大小、圆角、间距和文字样式，让桌面更符合你的审美。
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.group}>
              <div className={styles.groupTitle}>图标外观</div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>图标大小</span>
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
                <span className={styles.label}>图标圆角</span>
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
                <span className={styles.label}>不透明度</span>
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
              <div className={styles.groupTitle}>布局与文字</div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>图标间距</span>
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
                <span className={styles.label}>文字大小</span>
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
                <span className={styles.label}>文字颜色</span>
                <div className={styles.control}>
                  <Select
                    value={iconSettings.fontColor}
                    options={[
                      { label: '亮色', value: 'light' },
                      { label: '暗色', value: 'dark' }
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

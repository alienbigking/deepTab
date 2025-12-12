import React, { useCallback } from 'react'
import { Slider, Select } from 'antd'
import styles from './iconControl.module.less'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import type { IconSettings } from '@/pages/appGrid/stores/appGrid'

const IconControl: React.FC = () => {
  const { iconSettings, setIconSettings } = useAppGridStore()

  const handleSliderChange = useCallback(
    (key: keyof IconSettings) => (value: number) => {
      setIconSettings({ [key]: value })
    },
    [setIconSettings]
  )

  const handleFontColorChange = (value: IconSettings['fontColor']) => {
    setIconSettings({ fontColor: value })
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>图标控制</h2>
      <p className={styles.subTitle}>
        细致调节图标的大小、圆角、间距和文字样式，让桌面更符合你的审美。
      </p>

      <div className={styles.grid}>
        <div>
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

        <div>
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
  )
}

export default IconControl

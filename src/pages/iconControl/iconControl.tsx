import React from 'react'
import { Slider, Select } from 'antd'
import styles from './iconControl.module.less'

const IconControl: React.FC = () => {
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
              <Slider min={32} max={96} defaultValue={72} />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>图标圆角</span>
            <div className={styles.control}>
              <Slider min={0} max={24} defaultValue={16} />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>不透明度</span>
            <div className={styles.control}>
              <Slider min={40} max={100} defaultValue={100} />
            </div>
          </div>
        </div>

        <div>
          <div className={styles.groupTitle}>布局与文字</div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>图标间距</span>
            <div className={styles.control}>
              <Slider min={8} max={40} defaultValue={24} />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>文字大小</span>
            <div className={styles.control}>
              <Slider min={10} max={18} defaultValue={12} />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>文字颜色</span>
            <div className={styles.control}>
              <Select
                defaultValue='light'
                options={[
                  { label: '亮色', value: 'light' },
                  { label: '暗色', value: 'dark' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IconControl

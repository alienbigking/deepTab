import React from 'react'
import { Button } from 'antd'
import styles from './resetSettings.module.less'

const ResetSettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>重置设置</h2>
      <p className={styles.subTitle}>当你希望回到出厂默认状态时，可以在这里快速重置。</p>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>重置图标</div>
        <div className={styles.sectionDesc}>
          清空应用图标布局和自定义图标配置，恢复为默认推荐应用。
        </div>
        <div className={styles.actions}>
          <Button danger>重置图标</Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>重置全部设置</div>
        <div className={styles.sectionDesc}>
          恢复壁纸、主题、搜索引擎等所有设置为默认值（不影响备份数据）。
        </div>
        <div className={styles.actions}>
          <Button danger type='primary'>
            重置所有设置
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ResetSettings

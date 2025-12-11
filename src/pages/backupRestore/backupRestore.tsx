import React from 'react'
import { Button } from 'antd'
import styles from './backupRestore.module.less'

const BackupRestore: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>备份与恢复</h2>
      <p className={styles.subTitle}>备份你的个性化配置，在设备之间快速同步或恢复。</p>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>本地数据</div>
        <div className={styles.sectionDesc}>手动将当前设置保存到本地浏览器存储中。</div>
        <div className={styles.actions}>
          <Button type='primary'>立即备份</Button>
          <Button>同步到本地</Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>导出 / 导入</div>
        <div className={styles.sectionDesc}>
          导出一份 JSON 备份文件，或从已有备份中恢复当前配置。
        </div>
        <div className={styles.actions}>
          <Button>导出本地数据</Button>
          <Button>导入备份数据</Button>
        </div>
      </div>
    </div>
  )
}

export default BackupRestore

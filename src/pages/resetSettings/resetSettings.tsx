import React from 'react'
import { Button, Modal, message } from 'antd'
import styles from './resetSettings.module.less'
import appGridService from '@/pages/appGrid/services/appGrid'
import useAppGridStore, { defaultIconSettings } from '@/pages/appGrid/stores/appGrid'

const ResetSettings: React.FC = () => {
  const { setApps, resetIconSettings } = useAppGridStore()

  const resetIcons = async (showSuccess = true) => {
    const hide = message.loading('正在重置图标...', 0)
    try {
      const apps = await appGridService.resetToDefault()
      setApps(apps)
      if (showSuccess) {
        message.success('图标已经恢复为默认推荐')
      }
    } catch (error) {
      console.error('重置图标失败:', error)
      message.error('重置失败，请稍后再试')
      throw error
    } finally {
      hide()
    }
  }

  const confirmResetIcons = () => {
    Modal.confirm({
      title: '重置图标',
      content: '确认清空当前图标并恢复为默认推荐吗？此操作不可撤销。',
      okText: '重置图标',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => resetIcons()
    })
  }

  const confirmResetAll = () => {
    Modal.confirm({
      title: '重置全部设置',
      content: '将恢复图标、外观、布局等所有设置为默认值，是否继续？',
      okText: '重置所有设置',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await resetIcons(false)
        resetIconSettings()
        message.success('所有设置已恢复默认')
      }
    })
  }

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
          <Button danger onClick={confirmResetIcons}>
            重置图标
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>重置全部设置</div>
        <div className={styles.sectionDesc}>
          恢复壁纸、主题、搜索引擎等所有设置为默认值（不影响备份数据）。
        </div>
        <div className={styles.actions}>
          <Button danger type='primary' onClick={confirmResetAll}>
            重置所有设置
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ResetSettings

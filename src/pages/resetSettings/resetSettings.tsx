import React from 'react'
import { App, Button, Card } from 'antd'
import styles from './resetSettings.module.less'
import appGridService from '@/pages/appGrid/services/appGrid'
import { initDefaultApps } from '@/pages/appGrid/initData'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import useBottomBarStore from '@/pages/bottomBar/stores/bottomBar'
import useAppCategoryStore from '@/pages/appCategory/stores/appCategory'

const storageRemove = (keys: string[]) => {
  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

const storageGet = <T extends Record<string, any>>(keys: string[]) => {
  return new Promise<T>((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(err)
        return
      }
      resolve(result as T)
    })
  })
}

const ResetSettings: React.FC = () => {
  const { message, modal } = App.useApp()
  const { setApps, resetIconSettings } = useAppGridStore()
  const { setPinnedAppIds } = useBottomBarStore()
  const { init: initCategories, setActiveCategoryId } = useAppCategoryStore()

  const reloadToNewtab = () => {
    try {
      const url = chrome?.runtime?.getURL?.('newtab.html')
      if (typeof url === 'string' && url) {
        window.location.href = url
        return
      }
    } catch {
      // ignore
    }

    window.location.reload()
  }

  const resetIcons = async (showSuccess = true, shouldReload = true) => {
    const hide = message.loading('正在重置图标...', 0)
    try {
      let beforeCount = 0
      try {
        const before = await storageGet<{ app_grid_data?: unknown }>(['app_grid_data'])
        beforeCount = Array.isArray(before.app_grid_data) ? before.app_grid_data.length : 0
      } catch {
        beforeCount = 0
      }

      await storageRemove(['app_grid_icon_settings', 'app_grid_data'])
      await initDefaultApps()
      const storedApps = await appGridService.getList()
      setApps(storedApps)
      resetIconSettings()
      setActiveCategoryId('home')

      try {
        const verify = await storageGet<{ app_grid_data?: unknown }>(['app_grid_data'])
        const countFromStorage = Array.isArray(verify.app_grid_data)
          ? verify.app_grid_data.length
          : 0
        const count = storedApps.length || countFromStorage
        if (showSuccess) {
          message.success(`图标已经恢复为默认推荐（${beforeCount} -> ${count}）`)
        }
      } catch {
        if (showSuccess) {
          message.success('图标已经恢复为默认推荐')
        }
      }

      if (shouldReload) {
        if (showSuccess) {
          message.success('即将刷新页面', 1, () => {
            reloadToNewtab()
          })
        } else {
          reloadToNewtab()
        }
      }
      if (showSuccess) {
        // handled above
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
    modal.confirm({
      title: '重置图标',
      content: '确认清空当前图标并恢复为默认推荐吗？此操作不可撤销。',
      okText: '重置图标',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => resetIcons(true, true)
    })
  }

  const confirmResetAll = () => {
    modal.confirm({
      title: '重置全部设置',
      content: '将恢复图标、外观、布局等所有设置为默认值，是否继续？',
      okText: '重置所有设置',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在恢复默认设置...', 0)
        try {
          await storageRemove([
            'generalSettings',
            'themeConfig',
            'wallpaperConfig',
            'searchEngineConfig',
            'searchHistory',
            'searchSettings',
            'bottom_bar_pins',
            'app_categories',
            'app_grid_icon_settings',
            'app_grid_data',
            'widgetConfig',
            'todoList',
            'notificationSettings',
            'notifications'
          ])

          await resetIcons(false, false)
          resetIconSettings()
          setPinnedAppIds([])
          setActiveCategoryId('home')
          await initCategories()

          message.success('所有设置已恢复默认', 1, () => {
            reloadToNewtab()
          })
        } catch (error) {
          console.error('重置全部设置失败:', error)
          message.error('重置失败，请稍后再试')
          throw error
        } finally {
          hide()
        }
      }
    })
  }

  return (
    <div className={styles.container}>
      <Card className='dtSettingsCard' bordered={false}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>重置设置</h2>
            <p className={styles.subTitle}>当你希望回到出厂默认状态时，可以在这里快速重置。</p>
          </div>

          <div className={styles.sections}>
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
        </div>
      </Card>
    </div>
  )
}

export default ResetSettings

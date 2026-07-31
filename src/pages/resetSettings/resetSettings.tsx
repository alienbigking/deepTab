import React from 'react'
import { App, Button, Card } from 'antd'
import styles from './resetSettings.module.less'
import appGridService from '@/pages/appGrid/services/appGrid'
import { initDefaultApps } from '@/pages/appGrid/initData'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import useBottomBarStore from '@/pages/bottomBar/stores/bottomBar'
import useAppCategoryStore from '@/pages/appCategory/stores/appCategory'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import requestDeepTabAutoSync from '@/pages/deepTabSync/services/autoSync'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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

  const resetIcons = async (showSuccess = true, shouldReload = true, shouldSync = true) => {
    const hide = message.loading(t('reset.resettingIcons', { defaultValue: 'Resetting icons...' }), 0)
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
      if (shouldSync) {
        await requestDeepTabAutoSync('resetIcons')
      }

      try {
        const verify = await storageGet<{ app_grid_data?: unknown }>(['app_grid_data'])
        const countFromStorage = Array.isArray(verify.app_grid_data)
          ? verify.app_grid_data.length
          : 0
        const count = storedApps.length || countFromStorage
        if (showSuccess) {
          message.success(t('reset.iconsRestoredCount', { defaultValue: `Icons restored (${beforeCount} -> ${count})` }))
        }
      } catch {
        if (showSuccess) {
          message.success(t('reset.iconsRestored', { defaultValue: 'Icons restored to defaults' }))
        }
      }

      if (shouldReload) {
        if (showSuccess) {
          message.success(t('reset.reloading', { defaultValue: 'Reloading the page' }), 1, () => {
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
      message.error(t('reset.failed', { defaultValue: 'Reset failed. Try again later.' }))
      throw error
    } finally {
      hide()
    }
  }

  const confirmResetIcons = () => {
    modal.confirm({
      title: t('reset.icons', { defaultValue: 'Reset icons' }),
      content: t('reset.iconsConfirm', { defaultValue: 'Clear the current icon layout and restore defaults? This cannot be undone.' }),
      okText: t('reset.icons', { defaultValue: 'Reset icons' }),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      maskTransitionName: modalMaskTransitionName,
      maskStyle: modalMaskStyle,
      onOk: () => resetIcons(true, true)
    })
  }

  const confirmResetAll = () => {
    modal.confirm({
      title: t('reset.all', { defaultValue: 'Reset all settings' }),
      content: t('reset.allConfirm', { defaultValue: 'Restore icons, appearance, layout, and all other settings to defaults?' }),
      okText: t('reset.all', { defaultValue: 'Reset all settings' }),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      maskTransitionName: modalMaskTransitionName,
      maskStyle: modalMaskStyle,
      onOk: async () => {
        const hide = message.loading(t('reset.resettingAll', { defaultValue: 'Restoring default settings...' }), 0)
        try {
          await storageRemove([
            'generalSettings',
            'themeConfig',
            'wallpaperConfig',
            'searchEngineConfig',
            'searchHistory',
            'favoriteSearches',
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

          await resetIcons(false, false, false)
          resetIconSettings()
          setPinnedAppIds([])
          setActiveCategoryId('home')
          await initCategories()
          await requestDeepTabAutoSync('resetAll')

          message.success(t('reset.allRestored', { defaultValue: 'All settings restored' }), 1, () => {
            reloadToNewtab()
          })
        } catch (error) {
          console.error('重置全部设置失败:', error)
          message.error(t('reset.failed', { defaultValue: 'Reset failed. Try again later.' }))
          throw error
        } finally {
          hide()
        }
      }
    })
  }

  return (
    <div className={styles.container}>
      <Card title={t('sidebar.reset')} className='dtSettingsCard' variant='borderless'>
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.subTitle}>{t('reset.subtitle', { defaultValue: 'Restore the extension to its original defaults.' })}</p>
          </div>

          <div className={styles.sections}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('reset.icons', { defaultValue: 'Reset icons' })}</div>
              <div className={styles.sectionDesc}>
                {t('reset.iconsDescription', { defaultValue: 'Clear the icon layout and custom icon settings, then restore recommended apps.' })}
              </div>
              <div className={styles.actions}>
                <Button className={styles.dangerOutlineButton} danger onClick={confirmResetIcons}>
                  {t('reset.icons', { defaultValue: 'Reset icons' })}
                </Button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('reset.all', { defaultValue: 'Reset all settings' })}</div>
              <div className={styles.sectionDesc}>
                {t('reset.allDescription', { defaultValue: 'Restore wallpapers, themes, search engines, and all other settings without affecting backups.' })}
              </div>
              <div className={styles.actions}>
                <Button danger type='primary' onClick={confirmResetAll}>
                  {t('reset.all', { defaultValue: 'Reset all settings' })}
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

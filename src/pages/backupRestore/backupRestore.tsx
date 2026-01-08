import React, { useRef } from 'react'
import { App, Button, Card } from 'antd'
import styles from './backupRestore.module.less'
import appGridService from '@/pages/appGrid/services/appGrid'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import type { AppNode, IconSettings } from '@/pages/appGrid/types/appGrid'
import type { IWallpaperConfig } from '@/pages/wallpaper/types/wallpaper'

interface BackupPayload {
  version: number
  exportedAt: string
  apps: AppNode[]
  iconSettings: IconSettings
  wallpaperConfig?: IWallpaperConfig | null
}

const BackupRestore: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { apps, setApps, iconSettings, setIconSettings } = useAppGridStore()
  const { message } = App.useApp()

  const handleQuickBackup = async () => {
    console.log('正在备份')
    try {
      await appGridService.saveAll(apps)
      await appGridService.saveIconSettings(iconSettings)
      message.success('已保存到本地存储')
    } catch (error) {
      console.error('备份失败:', error)
      message.error('备份失败，请稍后重试')
    }
  }

  const handleSyncLocal = async () => {
    try {
      const localApps = await appGridService.getList()
      const localIconSettings = await appGridService.getIconSettings()
      setApps(localApps)
      if (localIconSettings) {
        setIconSettings(localIconSettings)
      }
      message.success('已与本地存储同步')
    } catch (error) {
      console.error('同步失败:', error)
      message.error('同步失败，请稍后重试')
    }
  }

  const handleExport = async () => {
    try {
      const apps = await appGridService.getList()
      const storage = await chrome.storage.local.get(['wallpaperConfig'])
      const payload: BackupPayload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        apps,
        iconSettings,
        wallpaperConfig: (storage.wallpaperConfig as IWallpaperConfig) || null
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `deeptab-backup-${Date.now()}.json`
      anchor.click()
      URL.revokeObjectURL(url)

      message.success('备份文件已导出')
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败，请稍后重试')
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as Partial<BackupPayload>

      if (!data || !Array.isArray(data.apps)) {
        throw new Error('invalid backup file')
      }

      const normalizedApps = data.apps
        .map((app: any, index: number) => {
          // 兼容旧数据：如果没有 type 字段，则转为 AppItem
          if (!app.type) {
            return { ...app, type: 'item' as const, url: app.url || '' }
          }
          return app
        })
        .map((app, index) => ({
          ...app,
          order: typeof app.order === 'number' ? app.order : index
        }))
        .sort((a, b) => a.order - b.order)

      await appGridService.saveAll(normalizedApps)
      setApps(normalizedApps)

      if (data.iconSettings) {
        await appGridService.saveIconSettings(data.iconSettings)
        setIconSettings(data.iconSettings)
      }

      if (data.wallpaperConfig) {
        const wc = data.wallpaperConfig as IWallpaperConfig
        const t = wc.currentWallpaper?.type
        if (t === 'gradient' || t === 'image' || t === 'dynamic') {
          await chrome.storage.local.set({ wallpaperConfig: wc })
        }
      }

      message.success(`导入成功，共 ${normalizedApps.length} 个应用`)
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败，文件格式不正确')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className={styles.container}>
      <Card className='dtSettingsCard' bordered={false}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>备份与恢复</h2>
            <p className={styles.subTitle}>备份你的个性化配置，在设备之间快速同步或恢复。</p>
          </div>

          <div className={styles.sections}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>本地数据</div>
              <div className={styles.sectionDesc}>手动将当前设置保存到本地浏览器存储中。</div>
              <div className={styles.actions}>
                <Button type='primary' onClick={handleQuickBackup}>
                  立即备份
                </Button>
                <Button onClick={handleSyncLocal}>同步到本地</Button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>导出 / 导入</div>
              <div className={styles.sectionDesc}>
                导出一份 JSON 备份文件，或从已有备份中恢复当前配置。
              </div>
              <div className={styles.actions}>
                <Button onClick={handleExport}>导出本地数据</Button>
                <Button onClick={triggerImport}>导入备份数据</Button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='application/json'
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </Card>
    </div>
  )
}

export default BackupRestore

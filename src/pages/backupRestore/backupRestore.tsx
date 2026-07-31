import React, { useRef } from 'react'
import { App, Button, Card } from 'antd'
import styles from './backupRestore.module.less'
import appGridService from '@/pages/appGrid/services/appGrid'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import deepTabSyncService from '@/pages/deepTabSync/services/deepTabSync'
import type { AppNode, IconSettings } from '@/pages/appGrid/types/appGrid'
import type { IWallpaperConfig } from '@/pages/wallpaper/types/wallpaper'
import { useTranslation } from 'react-i18next'

interface BackupPayload {
  version: number
  exportedAt: string
  apps: AppNode[]
  iconSettings: IconSettings
  wallpaperConfig?: IWallpaperConfig | null
}

const MAX_BACKUP_FILE_SIZE = 2 * 1024 * 1024
const MAX_APP_COUNT = 500
const MAX_FOLDER_CHILDREN = 50

const requiredText = (value: unknown, field: string, maxLength: number) => {
  const text = String(value || '').trim()
  if (!text || text.length > maxLength) {
    throw new Error(`${field}无效`)
  }
  return text
}

const optionalText = (value: unknown, maxLength: number) => {
  if (value === undefined || value === null || value === '') return undefined
  const text = String(value).trim()
  if (text.length > maxLength) throw new Error('备份字段过长')
  return text
}

const normalizeUrl = (value: unknown) => {
  const url = requiredText(value, '应用链接', 2048)
  if (/^deeptab:\/\/widget\/(calendar|weather|todo|hotSearch)$/.test(url)) return url
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('备份中包含不安全的应用链接')
  }
  return parsed.toString()
}

const normalizeBackupItem = (raw: any, fallbackOrder: number): AppNode => {
  if (!raw || typeof raw !== 'object') throw new Error('应用数据无效')

  const base = {
    id: requiredText(raw.id, '应用 ID', 120),
    name: requiredText(raw.name, '应用名称', 100),
    icon: requiredText(raw.icon, '应用图标', 512 * 1024),
    iconBg: optionalText(raw.iconBg, 100),
    order: Number.isFinite(raw.order) ? Number(raw.order) : fallbackOrder,
    categoryId: optionalText(raw.categoryId, 100),
    widgetSpan: raw.widgetSpan === 2 || raw.widgetSpan === 4 ? raw.widgetSpan : undefined,
    createdAt: optionalText(raw.createdAt, 64),
    updatedAt: optionalText(raw.updatedAt, 64),
    syncStatus: 'pending' as const
  }

  if (raw.type === 'folder') {
    if (!Array.isArray(raw.children) || raw.children.length > MAX_FOLDER_CHILDREN) {
      throw new Error('文件夹内容无效或数量超过限制')
    }
    return {
      ...base,
      type: 'folder',
      coverIcon: optionalText(raw.coverIcon, 512 * 1024),
      children: raw.children.map((child: any, index: number) => {
        const normalized = normalizeBackupItem({ ...child, type: 'item' }, index)
        if (normalized.type !== 'item') throw new Error('文件夹子项无效')
        return normalized
      })
    }
  }

  return {
    ...base,
    type: 'item',
    url: normalizeUrl(raw.url)
  }
}

const normalizeBackupApps = (rawApps: unknown[]): AppNode[] => {
  if (rawApps.length > MAX_APP_COUNT) throw new Error('应用数量超过限制')
  const apps = rawApps.map((app, index) => normalizeBackupItem(app, index))
  const ids = new Set<string>()
  apps.forEach((node) => {
    const nodeIds = [node.id, ...(node.type === 'folder' ? node.children.map((item) => item.id) : [])]
    nodeIds.forEach((id) => {
      if (ids.has(id)) throw new Error('备份中包含重复的应用 ID')
      ids.add(id)
    })
  })
  return apps
    .sort((a, b) => a.order - b.order)
    .map((app, index) => ({ ...app, order: index }))
}

const BackupRestore: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { apps, setApps, iconSettings, setIconSettings } = useAppGridStore()
  const { message } = App.useApp()
  const { t } = useTranslation()

  const handleQuickBackup = async () => {
    console.log('正在备份')
    try {
      await appGridService.saveAll(apps)
      await appGridService.saveIconSettings(iconSettings)
      message.success(t('backup.savedLocal', { defaultValue: 'Saved to local storage' }))
    } catch (error) {
      console.error('备份失败:', error)
      message.error(t('backup.failed', { defaultValue: 'Backup failed. Try again later.' }))
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
      message.success(t('backup.loadedLocal', { defaultValue: 'Loaded from local storage' }))
    } catch (error) {
      console.error('同步失败:', error)
      message.error(t('backup.syncFailed', { defaultValue: 'Could not load local storage' }))
    }
  }

  const handleUploadCloud = async () => {
    try {
      await appGridService.saveAll(apps)
      await appGridService.saveIconSettings(iconSettings)
      await deepTabSyncService.uploadLocalToCloud()
      message.success(t('sync.synced'))
    } catch (error: any) {
      console.error('云端同步失败:', error)
      message.error(error?.message || t('backup.cloudUploadFailed', { defaultValue: 'Cloud upload failed. Sign in and check the service.' }))
    }
  }

  const handleDownloadCloud = async () => {
    try {
      const syncData = await deepTabSyncService.downloadCloudToLocal()
      if (!syncData?.payload) {
        message.info(t('backup.noCloudData', { defaultValue: 'There is no cloud data to restore' }))
        return
      }

      const localApps = await appGridService.getList()
      const localIconSettings = await appGridService.getIconSettings()
      setApps(localApps)
      if (localIconSettings) {
        setIconSettings(localIconSettings)
      }
      message.success(t('backup.cloudRestored', { defaultValue: 'Restored from cloud' }))
    } catch (error: any) {
      console.error('云端恢复失败:', error)
      message.error(error?.message || t('backup.cloudDownloadFailed', { defaultValue: 'Cloud restore failed. Sign in and check the service.' }))
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

      message.success(t('backup.exported', { defaultValue: 'Backup file exported' }))
    } catch (error) {
      console.error('导出失败:', error)
      message.error(t('backup.exportFailed', { defaultValue: 'Export failed. Try again later.' }))
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (file.size > MAX_BACKUP_FILE_SIZE) {
        throw new Error('备份文件不能超过 2MB')
      }
      const text = await file.text()
      const data = JSON.parse(text) as Partial<BackupPayload>

      if (!data || !Array.isArray(data.apps)) {
        throw new Error('invalid backup file')
      }

      const normalizedApps = normalizeBackupApps(data.apps)

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

      message.success(t('backup.imported', { defaultValue: `Imported ${normalizedApps.length} apps` }))
    } catch (error: any) {
      console.error('导入失败:', error)
      message.error(error?.message || t('backup.importFailed', { defaultValue: 'Import failed. The file format is invalid.' }))
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className={styles.container}>
              <Card title={t('backup.title', { defaultValue: 'Backup & Restore' })} className='dtSettingsCard' variant='borderless'>
        <div className={styles.content}>
          <div className={styles.header}>
            <p className={styles.subTitle}>{t('backup.subtitle', { defaultValue: 'Back up your personalized settings to sync or restore them across devices.' })}</p>
          </div>

          <div className={styles.sections}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('backup.localTitle', { defaultValue: 'Local data' })}</div>
              <div className={styles.sectionDesc}>{t('backup.localDescription', { defaultValue: 'Save the current settings to browser storage manually.' })}</div>
              <div className={styles.actions}>
                <Button type='primary' onClick={handleQuickBackup}>
                  {t('backup.backupNow', { defaultValue: 'Back up now' })}
                </Button>
                <Button onClick={handleSyncLocal}>{t('backup.loadLocal', { defaultValue: 'Load from local' })}</Button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('backup.cloudTitle', { defaultValue: 'Cloud sync' })}</div>
              <div className={styles.sectionDesc}>{t('backup.cloudDescription', { defaultValue: 'Sign in to sync the current settings to the service or restore them to this device.' })}</div>
              <div className={styles.actions}>
                <Button type='primary' onClick={handleUploadCloud}>
                  {t('backup.uploadCloud', { defaultValue: 'Upload to cloud' })}
                </Button>
                <Button onClick={handleDownloadCloud}>{t('backup.restoreCloud', { defaultValue: 'Restore from cloud' })}</Button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('backup.exportImport', { defaultValue: 'Export / Import' })}</div>
              <div className={styles.sectionDesc}>
                {t('backup.fileDescription', { defaultValue: 'Export a JSON backup file or restore the current settings from an existing backup.' })}
              </div>
              <div className={styles.actions}>
                <Button onClick={handleExport}>{t('backup.exportLocal', { defaultValue: 'Export local data' })}</Button>
                <Button onClick={triggerImport}>{t('backup.importData', { defaultValue: 'Import backup data' })}</Button>
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

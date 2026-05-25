import { env } from '@/config/env'
import http from '@/utils/http'
import type { DeepTabSyncPayload, DeepTabSyncRecord } from '../types/deepTabSync'

const SYNC_KEYS = [
  'app_grid_data',
  'app_grid_icon_settings',
  'app_categories',
  'wallpaperConfig',
  'themeConfig',
  'generalSettings',
  'searchEngineConfig',
  'searchSettings',
  'widgetConfig',
  'todoList',
  'bottomBarPins',
  'notificationSettings',
  'appSettings'
]

const storageToPayload = (storage: Record<string, any>): DeepTabSyncPayload => ({
  appGridData: storage.app_grid_data,
  appGridIconSettings: storage.app_grid_icon_settings,
  appCategories: storage.app_categories,
  wallpaperConfig: storage.wallpaperConfig,
  themeConfig: storage.themeConfig,
  generalSettings: storage.generalSettings,
  searchEngineConfig: storage.searchEngineConfig,
  searchSettings: storage.searchSettings,
  widgetConfig: storage.widgetConfig,
  todoList: storage.todoList,
  bottomBarPins: storage.bottomBarPins,
  notificationSettings: storage.notificationSettings,
  appSettings: storage.appSettings
})

const payloadToStorage = (payload: DeepTabSyncPayload): Record<string, any> => {
  const entries: [string, any][] = [
    ['app_grid_data', payload.appGridData],
    ['app_grid_icon_settings', payload.appGridIconSettings],
    ['app_categories', payload.appCategories],
    ['wallpaperConfig', payload.wallpaperConfig],
    ['themeConfig', payload.themeConfig],
    ['generalSettings', payload.generalSettings],
    ['searchEngineConfig', payload.searchEngineConfig],
    ['searchSettings', payload.searchSettings],
    ['widgetConfig', payload.widgetConfig],
    ['todoList', payload.todoList],
    ['bottomBarPins', payload.bottomBarPins],
    ['notificationSettings', payload.notificationSettings],
    ['appSettings', payload.appSettings]
  ]
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined))
}

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

export default {
  async collectLocalPayload(): Promise<DeepTabSyncPayload> {
    const storage = await chrome.storage.local.get(SYNC_KEYS)
    return storageToPayload(storage)
  },

  async applyPayloadToLocal(payload: DeepTabSyncPayload): Promise<void> {
    const data = payloadToStorage(payload)
    if (Object.keys(data).length > 0) {
      await chrome.storage.local.set(data)
    }
  },

  async getCloudSync(): Promise<DeepTabSyncRecord | null> {
    const response = await http<{ syncData: DeepTabSyncRecord | null }>(buildUrl('/api/deepTab/sync'))
    return response.data?.syncData || null
  },

  async saveCloudSync(payload: DeepTabSyncPayload): Promise<DeepTabSyncRecord | null> {
    const response = await http<{ syncData: DeepTabSyncRecord }>(buildUrl('/api/deepTab/sync'), {
      method: 'PUT',
      data: {
        version: 1,
        payload
      }
    })
    return response.data?.syncData || null
  },

  async uploadLocalToCloud(): Promise<DeepTabSyncRecord | null> {
    const payload = await this.collectLocalPayload()
    return this.saveCloudSync(payload)
  },

  async downloadCloudToLocal(): Promise<DeepTabSyncRecord | null> {
    const syncData = await this.getCloudSync()
    if (syncData?.payload) {
      await this.applyPayloadToLocal(syncData.payload)
    }
    return syncData
  }
}

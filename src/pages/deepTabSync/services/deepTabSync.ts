import { env } from '@/config/env'
import http from '@/utils/http'
import type { DeepTabSyncPayload, DeepTabSyncRecord } from '../types/deepTabSync'
import {
  DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY,
  DEEP_TAB_SYNC_CONFLICT_KEY
} from './syncProtocol'

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
  'bottom_bar_pins',
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
  bottomBarPins: storage.bottom_bar_pins,
  notificationSettings: storage.notificationSettings,
  appSettings: storage.appSettings
})

const payloadToStorage = (payload: DeepTabSyncPayload): Record<string, any> => {
  const bottomBarPins =
    payload.bottomBarPins ??
    (payload as DeepTabSyncPayload & { bottom_bar_pins?: any }).bottom_bar_pins

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
    ['bottom_bar_pins', bottomBarPins],
    ['notificationSettings', payload.notificationSettings],
    ['appSettings', payload.appSettings]
  ]
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined))
}

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

const rememberCloudRecord = async (record: DeepTabSyncRecord | null) => {
  if (!record) return
  await chrome.storage.local.set({
    [DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY]: Number(record.updateDate) || Date.now()
  })
  await chrome.storage.local.remove([DEEP_TAB_SYNC_CONFLICT_KEY])
}

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
    const record = response.data?.syncData || null
    await rememberCloudRecord(record)
    return record
  },

  async hasCloudConflict(): Promise<boolean> {
    const [cloud, localState] = await Promise.all([
      this.getCloudSync(),
      chrome.storage.local.get([DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY])
    ])
    if (!cloud) return false

    const knownUpdateDate = Number(localState[DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY]) || 0
    if (!knownUpdateDate) return true
    return Number(cloud.updateDate) > knownUpdateDate
  },

  async uploadLocalToCloud(): Promise<DeepTabSyncRecord | null> {
    const payload = await this.collectLocalPayload()
    return this.saveCloudSync(payload)
  },

  async downloadCloudToLocal(
    existingRecord?: DeepTabSyncRecord | null
  ): Promise<DeepTabSyncRecord | null> {
    const syncData = existingRecord === undefined ? await this.getCloudSync() : existingRecord
    if (syncData?.payload) {
      await this.applyPayloadToLocal(syncData.payload)
    }
    await rememberCloudRecord(syncData)
    return syncData
  }
}

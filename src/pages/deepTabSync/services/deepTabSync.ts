import { env } from '@/config/env'
import http from '@/utils/http'
import type { DeepTabSyncPayload, DeepTabSyncRecord } from '../types/deepTabSync'
import {
  DEEP_TAB_SYNC_BASELINE_KEY,
  DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY,
  DEEP_TAB_SYNC_CONFLICT_KEY
} from './syncProtocol'

interface SyncBaseline {
  userId: string
  updateDate: number
  payload: DeepTabSyncPayload
}

export type DeepTabSyncComparison =
  | { status: 'equal'; cloud: DeepTabSyncRecord | null }
  | { status: 'localOnly'; cloud: DeepTabSyncRecord | null }
  | { status: 'cloudOnly'; cloud: DeepTabSyncRecord }
  | { status: 'conflict'; cloud: DeepTabSyncRecord }

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
  'appSettings',
  'desktopPetConfig'
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
  appSettings: storage.appSettings,
  desktopPetConfig: storage.desktopPetConfig
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
    ['appSettings', payload.appSettings],
    ['desktopPetConfig', payload.desktopPetConfig]
  ]
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined))
}

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      if (record[key] !== undefined) result[key] = canonicalize(record[key])
      return result
    }, {})
}

const payloadsEqual = (left?: DeepTabSyncPayload, right?: DeepTabSyncPayload) =>
  JSON.stringify(canonicalize(left || {})) === JSON.stringify(canonicalize(right || {}))

const mergeById = <T extends { id: string }>(local: T[] = [], cloud: T[] = []): T[] => {
  const localIds = new Set(local.map((item) => item.id))
  return [...local, ...cloud.filter((item) => !localIds.has(item.id))]
}

const mergePayloads = (
  local: DeepTabSyncPayload,
  cloud: DeepTabSyncPayload
): DeepTabSyncPayload => ({
  ...cloud,
  ...local,
  appGridData: mergeById(local.appGridData, cloud.appGridData).map((item, order) => ({
    ...item,
    order,
    syncStatus: 'pending'
  })),
  appCategories: mergeById(local.appCategories, cloud.appCategories).map((item, order) => ({
    ...item,
    order
  })),
  todoList: mergeById(local.todoList, cloud.todoList),
  bottomBarPins: {
    pinnedAppIds: Array.from(
      new Set([
        ...(local.bottomBarPins?.pinnedAppIds || []),
        ...(cloud.bottomBarPins?.pinnedAppIds || [])
      ])
    )
  }
})

const rememberCloudRecord = async (record: DeepTabSyncRecord | null) => {
  if (!record) return
  await chrome.storage.local.set({
    [DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY]: Number(record.updateDate) || Date.now(),
    [DEEP_TAB_SYNC_BASELINE_KEY]: {
      userId: record.userId,
      updateDate: Number(record.updateDate) || Date.now(),
      payload: record.payload
    } satisfies SyncBaseline
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
    const response = await http<{ syncData: DeepTabSyncRecord | null }>(
      buildUrl('/api/deepTab/sync')
    )
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
    return (await this.compareLocalAndCloud()).status === 'conflict'
  },

  async compareLocalAndCloud(): Promise<DeepTabSyncComparison> {
    const [local, cloud, storage] = await Promise.all([
      this.collectLocalPayload(),
      this.getCloudSync(),
      chrome.storage.local.get([DEEP_TAB_SYNC_BASELINE_KEY, DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY])
    ])

    if (!cloud) return { status: 'localOnly', cloud: null }
    if (payloadsEqual(local, cloud.payload)) return { status: 'equal', cloud }

    const baseline = storage[DEEP_TAB_SYNC_BASELINE_KEY] as SyncBaseline | undefined
    if (!baseline || baseline.userId !== cloud.userId) {
      const previousCloudUpdateDate = Number(storage[DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY]) || 0
      if (previousCloudUpdateDate && previousCloudUpdateDate === Number(cloud.updateDate)) {
        return { status: 'localOnly', cloud }
      }
      return { status: 'conflict', cloud }
    }

    const localChanged = !payloadsEqual(local, baseline.payload)
    const cloudChanged = !payloadsEqual(cloud.payload, baseline.payload)
    if (localChanged && cloudChanged) return { status: 'conflict', cloud }
    if (cloudChanged) return { status: 'cloudOnly', cloud }
    return { status: 'localOnly', cloud }
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
  },

  async markCloudAsBaseline(record: DeepTabSyncRecord): Promise<void> {
    await rememberCloudRecord(record)
  },

  async mergeWithCloud(record: DeepTabSyncRecord): Promise<DeepTabSyncRecord | null> {
    const local = await this.collectLocalPayload()
    const merged = mergePayloads(local, record.payload)
    await this.applyPayloadToLocal(merged)
    return this.saveCloudSync(merged)
  }
}

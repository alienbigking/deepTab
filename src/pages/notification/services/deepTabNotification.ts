import { env } from '@/config/env'
import http from '@/utils/http'

export type DeepTabRemoteNotificationType = 'info' | 'success' | 'warning' | 'error'

export interface DeepTabRemoteNotification {
  id: string
  title: string
  content: string
  type: DeepTabRemoteNotificationType
  actionText?: string
  actionUrl?: string
  durationSeconds?: number
  priority?: number
  publishedAt?: number
}

const STORAGE_KEY = 'deepTab_remote_notification_seen_ids'
const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`
const getSeenKey = (item: Pick<DeepTabRemoteNotification, 'id' | 'publishedAt'>) =>
  `${item.id}:${Number(item.publishedAt) || 0}`

const readSeenIds = async (): Promise<string[]> => {
  const result = await chrome.storage.local.get([STORAGE_KEY])
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
}

const saveSeenIds = async (ids: string[]): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEY]: ids.slice(-200) })
}

export default {
  async getActiveNotifications(): Promise<DeepTabRemoteNotification[]> {
    const response = await http<{ list?: DeepTabRemoteNotification[] }>(
      buildUrl('/api/deepTab/notifications/active'),
      {
        params: { limit: 10 },
        timeout: 20000
      }
    )
    return Array.isArray(response.data?.list) ? response.data.list : []
  },

  async getUnseenNotifications(): Promise<DeepTabRemoteNotification[]> {
    const [list, seenIds] = await Promise.all([this.getActiveNotifications(), readSeenIds()])
    const seen = new Set(seenIds)
    return list.filter((item) => item.id && !seen.has(getSeenKey(item)))
  },

  async markSeen(items: DeepTabRemoteNotification[]): Promise<void> {
    if (!items.length) return
    const current = await readSeenIds()
    await saveSeenIds(Array.from(new Set([...current, ...items.map(getSeenKey)])))
  }
}

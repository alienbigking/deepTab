import deepTabSyncService from './deepTabSync'

const debounceDelay = 1500
const notifyMinInterval = 5000

let syncTimer: number | undefined
let syncing = false
let pending = false
let lastNotifyAt = 0

const hasAuthToken = async () => {
  try {
    const result = await chrome.storage.local.get(['token'])
    return Boolean(result.token)
  } catch (error) {
    console.warn('检查同步登录状态失败:', error)
    return false
  }
}

const runSync = async (source?: string) => {
  if (syncing) {
    pending = true
    return
  }

  const canSync = await hasAuthToken()
  if (!canSync) return

  syncing = true
  try {
    await deepTabSyncService.uploadLocalToCloud()
    const now = Date.now()
    if (now - lastNotifyAt >= notifyMinInterval) {
      lastNotifyAt = now
      window.dispatchEvent(new CustomEvent('dt:autoSyncSuccess', { detail: { source } }))
    }
  } catch (error) {
    console.warn(`DeepTab 自动同步失败${source ? `(${source})` : ''}:`, error)
  } finally {
    syncing = false
    if (pending) {
      pending = false
      requestDeepTabAutoSync('pending')
    }
  }
}

export const requestDeepTabAutoSync = (source?: string) => {
  if (syncTimer) {
    window.clearTimeout(syncTimer)
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = undefined
    void runSync(source)
  }, debounceDelay)
}

export default requestDeepTabAutoSync

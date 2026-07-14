import deepTabSyncService from './deepTabSync'
import {
  DEEP_TAB_SYNC_PENDING_KEY,
  DEEP_TAB_SYNC_CONFLICT,
  DEEP_TAB_SYNC_CONFLICT_KEY,
  DEEP_TAB_SYNC_RETRY_ALARM,
  DEEP_TAB_SYNC_SUCCESS,
  type DeepTabSyncMessage,
  type DeepTabSyncPendingState
} from './syncProtocol'

const maxRetryDelayMinutes = 60

let syncing = false
let rerunRequested = false

const readPending = async (): Promise<DeepTabSyncPendingState | null> => {
  const result = await chrome.storage.local.get([DEEP_TAB_SYNC_PENDING_KEY])
  return (result[DEEP_TAB_SYNC_PENDING_KEY] as DeepTabSyncPendingState | undefined) || null
}

const scheduleRetry = async (pending: DeepTabSyncPendingState) => {
  const retryCount = pending.retryCount + 1
  const delayInMinutes = Math.min(2 ** Math.max(0, retryCount - 1), maxRetryDelayMinutes)
  await chrome.storage.local.set({
    [DEEP_TAB_SYNC_PENDING_KEY]: {
      ...pending,
      retryCount
    } satisfies DeepTabSyncPendingState
  })
  await chrome.alarms.create(DEEP_TAB_SYNC_RETRY_ALARM, { delayInMinutes })
}

const notifySuccess = async (source?: string) => {
  const message: DeepTabSyncMessage = { type: DEEP_TAB_SYNC_SUCCESS, source }
  try {
    await chrome.runtime.sendMessage(message)
  } catch {
    // No extension page is currently open; the sync itself still succeeded.
  }
}

const notifyConflict = async (source?: string) => {
  const message: DeepTabSyncMessage = { type: DEEP_TAB_SYNC_CONFLICT, source }
  try {
    await chrome.runtime.sendMessage(message)
  } catch {
    // The conflict remains persisted and will be visible when the user returns.
  }
}

export const runPendingDeepTabSync = async (): Promise<void> => {
  if (syncing) {
    rerunRequested = true
    return
  }

  syncing = true
  try {
    const pending = await readPending()
    if (!pending) return

    const auth = await chrome.storage.local.get(['token'])
    if (!auth.token) return

    if (pending.source === 'login') {
      const cloud = await deepTabSyncService.getCloudSync()
      if (cloud?.payload) {
        await deepTabSyncService.downloadCloudToLocal(cloud)
        await chrome.storage.local.remove([DEEP_TAB_SYNC_PENDING_KEY])
        await notifySuccess('login')
        return
      }
    } else if (await deepTabSyncService.hasCloudConflict()) {
      await chrome.storage.local.set({
        [DEEP_TAB_SYNC_CONFLICT_KEY]: {
          source: pending.source,
          detectedAt: Date.now()
        }
      })
      await chrome.storage.local.remove([DEEP_TAB_SYNC_PENDING_KEY])
      await notifyConflict(pending.source)
      return
    }

    await deepTabSyncService.uploadLocalToCloud()
    const latestPending = await readPending()
    if (latestPending && latestPending.requestedAt > pending.requestedAt) {
      rerunRequested = true
    } else {
      await chrome.storage.local.remove([DEEP_TAB_SYNC_PENDING_KEY])
      await chrome.alarms.clear(DEEP_TAB_SYNC_RETRY_ALARM)
      await notifySuccess(pending.source)
    }
  } catch (error) {
    console.warn('DeepTab 后台同步失败，已安排重试:', error)
    const pending = await readPending()
    if (pending) {
      await scheduleRetry(pending)
    }
  } finally {
    syncing = false
    if (rerunRequested) {
      rerunRequested = false
      void runPendingDeepTabSync()
    }
  }
}

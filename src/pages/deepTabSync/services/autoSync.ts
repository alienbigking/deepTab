import {
  DEEP_TAB_SYNC_PENDING_KEY,
  DEEP_TAB_SYNC_CONFLICT,
  DEEP_TAB_SYNC_REQUEST,
  DEEP_TAB_SYNC_SUCCESS,
  type DeepTabSyncMessage,
  type DeepTabSyncPendingState
} from './syncProtocol'

let listenerRegistered = false

const registerSuccessListener = () => {
  if (listenerRegistered) return
  listenerRegistered = true

  chrome.runtime.onMessage.addListener((message: DeepTabSyncMessage) => {
    if (message?.type === DEEP_TAB_SYNC_SUCCESS) {
      window.dispatchEvent(
        new CustomEvent('dt:autoSyncSuccess', { detail: { source: message.source } })
      )
    }
    if (message?.type === DEEP_TAB_SYNC_CONFLICT) {
      window.dispatchEvent(
        new CustomEvent('dt:autoSyncConflict', { detail: { source: message.source } })
      )
    }
  })
}

export const requestDeepTabAutoSync = (source?: string): Promise<void> => {
  registerSuccessListener()

  const request = async () => {
    const previous = await chrome.storage.local.get([DEEP_TAB_SYNC_PENDING_KEY])
    const current = previous[DEEP_TAB_SYNC_PENDING_KEY] as DeepTabSyncPendingState | undefined
    const pending: DeepTabSyncPendingState = {
      source: current?.source || source,
      requestedAt: Date.now(),
      retryCount: current?.retryCount || 0
    }
    await chrome.storage.local.set({ [DEEP_TAB_SYNC_PENDING_KEY]: pending })

    const message: DeepTabSyncMessage = { type: DEEP_TAB_SYNC_REQUEST, source }
    try {
      await chrome.runtime.sendMessage(message)
    } catch (error) {
      console.warn('DeepTab 同步请求已保存，将在后台恢复后继续:', error)
    }
  }

  return request()
}

export default requestDeepTabAutoSync

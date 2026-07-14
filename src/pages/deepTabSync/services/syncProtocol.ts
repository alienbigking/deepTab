export const DEEP_TAB_SYNC_REQUEST = 'deepTab.sync.request'
export const DEEP_TAB_SYNC_SUCCESS = 'deepTab.sync.success'
export const DEEP_TAB_SYNC_CONFLICT = 'deepTab.sync.conflict'
export const DEEP_TAB_SYNC_RETRY_ALARM = 'deepTab.sync.retry'
export const DEEP_TAB_SYNC_PENDING_KEY = 'deepTab_sync_pending'
export const DEEP_TAB_SYNC_CONFLICT_KEY = 'deepTab_sync_conflict'
export const DEEP_TAB_SYNC_CLOUD_UPDATED_AT_KEY = 'deepTab_sync_cloud_updated_at'

export interface DeepTabSyncPendingState {
  source?: string
  requestedAt: number
  retryCount: number
}

export interface DeepTabSyncMessage {
  type:
    | typeof DEEP_TAB_SYNC_REQUEST
    | typeof DEEP_TAB_SYNC_SUCCESS
    | typeof DEEP_TAB_SYNC_CONFLICT
  source?: string
}

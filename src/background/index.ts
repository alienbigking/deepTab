import { runPendingDeepTabSync } from '@/pages/deepTabSync/services/backgroundSync'
import {
  DEEP_TAB_SYNC_REQUEST,
  DEEP_TAB_SYNC_RETRY_ALARM,
  type DeepTabSyncMessage
} from '@/pages/deepTabSync/services/syncProtocol'

chrome.runtime.onInstalled.addListener(() => {
  console.log('Deep Tab extension installed or updated')
  void runPendingDeepTabSync()
})

chrome.runtime.onStartup.addListener(() => {
  void runPendingDeepTabSync()
})

chrome.runtime.onMessage.addListener((message: DeepTabSyncMessage) => {
  if (message?.type !== DEEP_TAB_SYNC_REQUEST) return
  void runPendingDeepTabSync()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== DEEP_TAB_SYNC_RETRY_ALARM) return
  void runPendingDeepTabSync()
})

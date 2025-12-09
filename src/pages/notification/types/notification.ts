/**
 * notification 模块类型定义
 */

interface INotificationSettings {
  enableBrowserNotification: boolean
  enableEmailNotification: boolean
  enableSoundNotification: boolean
  notificationFrequency: 'realtime' | 'daily' | 'weekly'
}

interface INotificationItem {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: string
  read: boolean
}

export { INotificationSettings, INotificationItem }

import { INotificationSettings, INotificationItem } from '../types/notification'

export default {
  async getNotificationSettings(): Promise<INotificationSettings> {
    try {
      const result = await chrome.storage.local.get(['notificationSettings'])
      return (
        result.notificationSettings || {
          enableBrowserNotification: true,
          enableEmailNotification: false,
          enableSoundNotification: true,
          notificationFrequency: 'realtime'
        }
      )
    } catch (error) {
      console.error('获取通知设置失败:', error)
      return {
        enableBrowserNotification: true,
        enableEmailNotification: false,
        enableSoundNotification: true,
        notificationFrequency: 'realtime'
      }
    }
  },

  async saveNotificationSettings(settings: INotificationSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ notificationSettings: settings })
    } catch (error) {
      console.error('保存通知设置失败:', error)
    }
  },

  async getNotifications(): Promise<INotificationItem[]> {
    try {
      const result = await chrome.storage.local.get(['notifications'])
      return result.notifications || []
    } catch (error) {
      console.error('获取通知列表失败:', error)
      return []
    }
  }
}

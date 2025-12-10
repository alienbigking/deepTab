import { create } from 'zustand'
import { INotificationSettings } from '../types/notification'

interface NotificationStore {
  settings: INotificationSettings
  setSettings: (settings: INotificationSettings) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  settings: {
    enableBrowserNotification: true,
    enableEmailNotification: false,
    enableSoundNotification: true,
    notificationFrequency: 'realtime'
  },
  setSettings: (settings) => set({ settings })
}))

export default useNotificationStore

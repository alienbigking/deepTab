import { atom } from 'recoil'
import { INotificationSettings } from '../types/notification'

const notificationSettingsStore = atom<INotificationSettings>({
  key: 'notificationSettingsStore',
  default: {
    enableBrowserNotification: true,
    enableEmailNotification: false,
    enableSoundNotification: true,
    notificationFrequency: 'realtime'
  }
})

export default { notificationSettingsStore }

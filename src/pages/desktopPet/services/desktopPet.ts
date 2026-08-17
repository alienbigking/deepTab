import requestDeepTabAutoSync from '@/pages/deepTabSync/services/autoSync'
import type { DesktopPetConfig } from '../types/desktopPet'

export const DESKTOP_PET_STORAGE_KEY = 'desktopPetConfig'
const DESKTOP_PET_CONFIG_VERSION = 3

export const defaultDesktopPetConfig: DesktopPetConfig = {
  configVersion: DESKTOP_PET_CONFIG_VERSION,
  enabled: true,
  animationEnabled: true,
  quietMode: false,
  proactiveMessages: true,
  quoteEnabled: true,
  sedentaryReminderEnabled: true,
  todoReminderEnabled: true,
  weatherCareEnabled: true,
  holidayGreetingEnabled: true,
  messageFrequencyMinutes: 45,
  sedentaryMinutes: 60,
  size: 160,
  position: { x: 0.88, y: 0.72 }
}

const normalizeConfig = (value?: Partial<DesktopPetConfig>): DesktopPetConfig => {
  const isLegacyDefaultSize = !value?.configVersion && value?.size === 190

  return {
    configVersion: DESKTOP_PET_CONFIG_VERSION,
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : defaultDesktopPetConfig.enabled,
    animationEnabled:
      typeof value?.animationEnabled === 'boolean'
        ? value.animationEnabled
        : defaultDesktopPetConfig.animationEnabled,
    quietMode: typeof value?.quietMode === 'boolean' ? value.quietMode : false,
    proactiveMessages:
      typeof value?.proactiveMessages === 'boolean' ? value.proactiveMessages : true,
    quoteEnabled: typeof value?.quoteEnabled === 'boolean' ? value.quoteEnabled : true,
    sedentaryReminderEnabled:
      typeof value?.sedentaryReminderEnabled === 'boolean' ? value.sedentaryReminderEnabled : true,
    todoReminderEnabled:
      typeof value?.todoReminderEnabled === 'boolean' ? value.todoReminderEnabled : true,
    weatherCareEnabled:
      typeof value?.weatherCareEnabled === 'boolean' ? value.weatherCareEnabled : true,
    holidayGreetingEnabled:
      typeof value?.holidayGreetingEnabled === 'boolean' ? value.holidayGreetingEnabled : true,
    messageFrequencyMinutes: Math.min(
      180,
      Math.max(15, Number(value?.messageFrequencyMinutes) || 45)
    ),
    sedentaryMinutes: Math.min(180, Math.max(30, Number(value?.sedentaryMinutes) || 60)),
    size:
      typeof value?.size === 'number'
        ? Math.min(
            240,
            Math.max(100, isLegacyDefaultSize ? defaultDesktopPetConfig.size : value.size)
          )
        : defaultDesktopPetConfig.size,
    position: {
      x:
        typeof value?.position?.x === 'number'
          ? Math.min(1, Math.max(0, value.position.x))
          : defaultDesktopPetConfig.position.x,
      y:
        typeof value?.position?.y === 'number'
          ? Math.min(1, Math.max(0, value.position.y))
          : defaultDesktopPetConfig.position.y
    }
  }
}

export default {
  async getConfig(): Promise<DesktopPetConfig> {
    const result = await chrome.storage.local.get([DESKTOP_PET_STORAGE_KEY])
    return normalizeConfig(result[DESKTOP_PET_STORAGE_KEY])
  },

  async saveConfig(config: DesktopPetConfig): Promise<void> {
    const next = normalizeConfig(config)
    await chrome.storage.local.set({ [DESKTOP_PET_STORAGE_KEY]: next })
    void requestDeepTabAutoSync(DESKTOP_PET_STORAGE_KEY)
  },

  async resetPosition(): Promise<DesktopPetConfig> {
    const current = await this.getConfig()
    const next = { ...current, position: defaultDesktopPetConfig.position }
    await this.saveConfig(next)
    return next
  }
}

import type { BottomBarPins } from '../types/bottomBar'

const STORAGE_KEY = 'bottom_bar_pins'

const storageUtils = {
  async getLocal(): Promise<BottomBarPins> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const raw = (result[STORAGE_KEY] || null) as BottomBarPins | null
        resolve(raw || { pinnedAppIds: [] })
      })
    })
  },

  async saveLocal(data: BottomBarPins): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve)
    })
  }
}

export default {
  async getPins(): Promise<string[]> {
    const data = await storageUtils.getLocal()
    return Array.isArray(data.pinnedAppIds) ? data.pinnedAppIds : []
  },

  async savePins(pinnedAppIds: string[]): Promise<void> {
    await storageUtils.saveLocal({ pinnedAppIds })
  }
}

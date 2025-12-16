import { create } from 'zustand'
import themeService from '../services/theme'
import type { IThemeConfig, ThemeMode } from '../types/theme'

interface ThemeStore {
  config: IThemeConfig
  dataTheme: 'default' | 'light' | 'dark'
  antdThemeMode: 'light' | 'dark'
  setConfig: (config: IThemeConfig) => void
  init: () => Promise<void>
}

const resolveFromMode = (mode: ThemeMode, prefersDark: boolean) => {
  if (mode === 'default') {
    return {
      dataTheme: 'default' as const,
      antdThemeMode: 'light' as const
    }
  }

  if (mode === 'light') {
    return {
      dataTheme: 'light' as const,
      antdThemeMode: 'light' as const
    }
  }

  if (mode === 'dark') {
    return {
      dataTheme: 'dark' as const,
      antdThemeMode: 'dark' as const
    }
  }

  const resolved = (prefersDark ? 'dark' : 'light') as 'dark' | 'light'
  return {
    dataTheme: resolved,
    antdThemeMode: resolved
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  let inited = false
  let media: MediaQueryList | null = null

  const applyConfig = (next: IThemeConfig, prefersDark: boolean) => {
    const { dataTheme, antdThemeMode } = resolveFromMode(next.mode, prefersDark)
    set({ config: next, dataTheme, antdThemeMode })
  }

  const getPrefersDark = () => {
    try {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    } catch {
      return false
    }
  }

  return {
    config: {
      mode: 'default'
    },
    dataTheme: 'default',
    antdThemeMode: 'light',
    setConfig: (config) => {
      applyConfig(config, getPrefersDark())
    },
    init: async () => {
      if (inited) return
      inited = true

      const config = await themeService.getThemeConfig()
      applyConfig(config, getPrefersDark())

      const onChanged = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ) => {
        if (areaName !== 'local') return
        if (!changes.themeConfig) return
        const next = (changes.themeConfig.newValue as IThemeConfig) || { mode: 'default' }
        applyConfig(next, getPrefersDark())
      }

      chrome.storage.onChanged.addListener(onChanged)

      if (window.matchMedia) {
        media = window.matchMedia('(prefers-color-scheme: dark)')
        const onMediaChange = () => {
          const { config } = get()
          if (config.mode !== 'system') return
          applyConfig(config, getPrefersDark())
        }

        try {
          media.addEventListener('change', onMediaChange)
        } catch {
          media.addListener(onMediaChange)
        }
      }
    }
  }
})

export default useThemeStore

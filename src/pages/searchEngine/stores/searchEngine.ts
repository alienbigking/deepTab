import { create } from 'zustand'
import type {
  ICustomSearchEngine,
  ISearchEngineConfig,
  SearchEngineId
} from '../types/searchEngine'
import searchEngineService from '../services/searchEngine'

interface SearchEngineStore {
  config: ISearchEngineConfig
  setConfig: (config: ISearchEngineConfig) => void
  init: () => Promise<void>
  setDefaultEngineId: (id: SearchEngineId) => Promise<void>
  upsertCustomEngine: (engine: ICustomSearchEngine) => Promise<void>
  removeCustomEngine: (id: string) => Promise<void>
}

export const useSearchEngineStore = create<SearchEngineStore>((set, get) => {
  let inited = false

  const applyConfig = (next: ISearchEngineConfig) => {
    set({ config: next })
  }

  const persist = async (next: ISearchEngineConfig) => {
    applyConfig(next)
    await searchEngineService.saveSearchEngineConfig(next)
  }

  return {
    config: {
      defaultEngineId: 'baidu',
      customEngines: []
    },
    setConfig: (config) => {
      void persist(config)
    },
    init: async () => {
      if (inited) return
      inited = true

      const config = await searchEngineService.getSearchEngineConfig()
      applyConfig(config)

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return
        const change = changes.searchEngineConfig
        if (!change?.newValue) return
        applyConfig(change.newValue as ISearchEngineConfig)
      })
    },
    setDefaultEngineId: async (id) => {
      const next: ISearchEngineConfig = {
        ...get().config,
        defaultEngineId: id
      }
      await persist(next)
    },
    upsertCustomEngine: async (engine) => {
      const list = get().config.customEngines
      const idx = list.findIndex((it) => it.id === engine.id)
      const nextList =
        idx >= 0 ? list.map((it) => (it.id === engine.id ? engine : it)) : [...list, engine]

      const next: ISearchEngineConfig = {
        ...get().config,
        customEngines: nextList
      }

      await persist(next)
    },
    removeCustomEngine: async (id) => {
      const nextList = get().config.customEngines.filter((it) => it.id !== id)
      const nextDefault =
        get().config.defaultEngineId === id ? 'baidu' : get().config.defaultEngineId

      const next: ISearchEngineConfig = {
        ...get().config,
        defaultEngineId: nextDefault,
        customEngines: nextList
      }

      await persist(next)
    }
  }
})

export default useSearchEngineStore

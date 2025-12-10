import { create } from 'zustand'
import { ISearchEngineConfig } from '../types/searchEngine'

interface SearchEngineStore {
  config: ISearchEngineConfig
  setConfig: (config: ISearchEngineConfig) => void
}

export const useSearchEngineStore = create<SearchEngineStore>((set) => ({
  config: {
    defaultEngine: 'baidu',
    customEngines: []
  },
  setConfig: (config) => set({ config })
}))

export default useSearchEngineStore

import { create } from 'zustand'
import { SearchEngine, ISearchSettings } from '../types/searchBar'

interface SearchBarStore {
  searchEngine: SearchEngine
  searchSettings: ISearchSettings
  searchFocus: boolean
  setSearchEngine: (engine: SearchEngine) => void
  setSearchSettings: (settings: ISearchSettings) => void
  setSearchFocus: (focus: boolean) => void
}

export const useSearchBarStore = create<SearchBarStore>((set) => ({
  searchEngine: 'baidu',
  searchSettings: {
    defaultEngine: 'baidu',
    enableHistory: true,
    maxHistoryCount: 50
  },
  searchFocus: false,
  setSearchEngine: (searchEngine) => set({ searchEngine }),
  setSearchSettings: (searchSettings) => set({ searchSettings }),
  setSearchFocus: (searchFocus) => set({ searchFocus })
}))

export default useSearchBarStore

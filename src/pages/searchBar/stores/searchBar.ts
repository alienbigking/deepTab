import { atom } from 'recoil'
import { SearchEngine, ISearchSettings } from '../types/searchBar'

// 当前搜索引擎
const searchEngineStore = atom<SearchEngine>({
  key: 'searchEngineStore',
  default: 'baidu'
})

// 搜索设置
const searchSettingsStore = atom<ISearchSettings>({
  key: 'searchSettingsStore',
  default: {
    defaultEngine: 'baidu',
    enableHistory: true,
    maxHistoryCount: 50
  }
})

// 搜索框焦点状态
const searchFocusStore = atom<boolean>({
  key: 'searchFocusStore',
  default: false
})

export default { searchEngineStore, searchSettingsStore, searchFocusStore }

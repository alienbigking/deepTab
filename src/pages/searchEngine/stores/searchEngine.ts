import { atom } from 'recoil'
import { ISearchEngineConfig } from '../types/searchEngine'

const searchEngineConfigStore = atom<ISearchEngineConfig>({
  key: 'searchEngineConfigStore',
  default: {
    defaultEngine: 'baidu',
    customEngines: []
  }
})

export default { searchEngineConfigStore }

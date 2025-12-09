import { ISearchEngineConfig } from '../types/searchEngine'

export default {
  async getSearchEngineConfig(): Promise<ISearchEngineConfig> {
    try {
      const result = await chrome.storage.local.get(['searchEngineConfig'])
      return (
        result.searchEngineConfig || {
          defaultEngine: 'baidu',
          customEngines: []
        }
      )
    } catch (error) {
      console.error('获取搜索引擎配置失败:', error)
      return {
        defaultEngine: 'baidu',
        customEngines: []
      }
    }
  },

  async saveSearchEngineConfig(config: ISearchEngineConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ searchEngineConfig: config })
    } catch (error) {
      console.error('保存搜索引擎配置失败:', error)
    }
  }
}

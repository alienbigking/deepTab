import type { ISearchEngineConfig } from '../types/searchEngine'

export default {
  async getSearchEngineConfig(): Promise<ISearchEngineConfig> {
    try {
      const result = await chrome.storage.local.get(['searchEngineConfig'])

      const raw = (result.searchEngineConfig || {}) as {
        defaultEngineId?: unknown
        defaultEngine?: unknown
        customEngines?: unknown
      }

      const defaultEngineIdRaw = raw.defaultEngineId ?? raw.defaultEngine

      const customEngines = Array.isArray(raw.customEngines)
        ? raw.customEngines
            .filter((it) => it && typeof it === 'object')
            .map((it: any) => ({
              id: typeof it.id === 'string' ? it.id : '',
              name: typeof it.name === 'string' ? it.name : '',
              url: typeof it.url === 'string' ? it.url : '',
              icon: typeof it.icon === 'string' ? it.icon : undefined
            }))
            .filter((it) => it.id && it.name && it.url)
        : []

      const defaultEngineIdCandidate =
        typeof defaultEngineIdRaw === 'string' && defaultEngineIdRaw.trim()
          ? defaultEngineIdRaw
          : 'baidu'

      const defaultEngineId =
        defaultEngineIdCandidate === 'custom'
          ? customEngines[0]?.id || 'baidu'
          : defaultEngineIdCandidate

      return {
        defaultEngineId,
        customEngines
      }
    } catch (error) {
      console.error('获取搜索引擎配置失败:', error)
      return {
        defaultEngineId: 'baidu',
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

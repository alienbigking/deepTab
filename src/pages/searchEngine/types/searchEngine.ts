/**
 * searchEngine 模块类型定义
 */

type SearchEngineType = 'baidu' | 'google' | 'bing' | 'duckduckgo' | 'custom'

interface ISearchEngine {
  id: string
  name: string
  type: SearchEngineType
  url: string
  icon?: string
}

interface ISearchEngineConfig {
  defaultEngine: SearchEngineType
  customEngines: ISearchEngine[]
}

export { SearchEngineType, ISearchEngine, ISearchEngineConfig }

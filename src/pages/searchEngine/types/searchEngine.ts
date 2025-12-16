/**
 * searchEngine 模块类型定义
 */

type BuiltinSearchEngineId = 'baidu' | 'google' | 'bing' | 'duckduckgo'
type SearchEngineId = BuiltinSearchEngineId | string

interface ICustomSearchEngine {
  id: string
  name: string
  url: string
  icon?: string
}

interface ISearchEngineConfig {
  defaultEngineId: SearchEngineId
  customEngines: ICustomSearchEngine[]
}

export { BuiltinSearchEngineId, SearchEngineId, ICustomSearchEngine, ISearchEngineConfig }

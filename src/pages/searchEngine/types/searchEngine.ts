/**
 * searchEngine 模块类型定义
 */

export type BuiltinSearchEngineId = 'baidu' | 'google' | 'bing' | 'duckduckgo'
export type SearchEngineId = BuiltinSearchEngineId | string

export interface ICustomSearchEngine {
  id: string
  name: string
  url: string
  icon?: string
}

export interface ISearchEngineConfig {
  defaultEngineId: SearchEngineId
  customEngines: ICustomSearchEngine[]
}

/**
 * SearchEngine Store 接口
 */
export interface SearchEngineStore {
  config: ISearchEngineConfig
  setConfig: (config: ISearchEngineConfig) => void
  init: () => Promise<void>
  setDefaultEngineId: (id: SearchEngineId) => Promise<void>
  upsertCustomEngine: (engine: ICustomSearchEngine) => Promise<void>
  removeCustomEngine: (id: string) => Promise<void>
}

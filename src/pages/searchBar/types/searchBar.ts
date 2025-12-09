/**
 * searchBar 模块类型定义
 */

// 搜索引擎类型
type SearchEngine = 'baidu' | 'google' | 'bing' | 'duckduckgo'

// 搜索历史项
interface ISearchHistoryItem {
  id: string
  keyword: string
  timestamp: number
  engine: SearchEngine
}

// 搜索设置
interface ISearchSettings {
  defaultEngine: SearchEngine
  enableHistory: boolean
  maxHistoryCount: number
}

export { SearchEngine, ISearchHistoryItem, ISearchSettings }

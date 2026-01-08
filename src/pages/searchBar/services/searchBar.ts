import { ISearchHistoryItem, ISearchSettings } from '../types/searchBar'

const SEARCH_HISTORY_KEY = 'searchHistory'
const SEARCH_SETTINGS_KEY = 'searchSettings'
const DEFAULT_MAX_HISTORY_COUNT = 50

const normalizeHistoryItem = (raw: any): ISearchHistoryItem | null => {
  if (!raw) return null
  const keyword = String(raw.keyword ?? raw.value ?? '').trim()
  if (!keyword) return null
  const timestampRaw = raw.timestamp ?? raw.lastUsedAt
  const timestamp = typeof timestampRaw === 'number' ? timestampRaw : Date.now()
  const engineId = String(raw.engineId ?? raw.engine ?? raw.engineID ?? '').trim() || 'baidu'

  return {
    keyword,
    timestamp,
    engineId
  }
}

/**
 * searchBar 服务层
 * 处理搜索历史和设置的存储
 */
export default {
  // 获取搜索历史
  async getSearchHistory(): Promise<ISearchHistoryItem[]> {
    try {
      const result = await chrome.storage.local.get([SEARCH_HISTORY_KEY])
      const raw = result[SEARCH_HISTORY_KEY] || []
      if (!Array.isArray(raw)) return []

      return raw
        .map(normalizeHistoryItem)
        .filter(Boolean)
        .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp))
    } catch (error) {
      console.error('获取搜索历史失败:', error)
      return []
    }
  },

  // 保存搜索历史(去重 + 截断)
  async saveSearchHistory(item: ISearchHistoryItem): Promise<void> {
    try {
      const normalized = normalizeHistoryItem(item)
      if (!normalized) return

      const history = await this.getSearchHistory()
      const deduped = history.filter((it) => it.keyword !== normalized.keyword)
      const next = [
        {
          ...normalized,
          timestamp: Date.now()
        },
        ...deduped
      ].slice(0, DEFAULT_MAX_HISTORY_COUNT)

      await chrome.storage.local.set({ [SEARCH_HISTORY_KEY]: next })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 删除单条历史(按 keyword)
  async removeSearchHistory(keyword: string): Promise<void> {
    try {
      const k = String(keyword || '').trim()
      if (!k) return
      const history = await this.getSearchHistory()
      const next = history.filter((it) => it.keyword !== k)
      await chrome.storage.local.set({ [SEARCH_HISTORY_KEY]: next })
    } catch (error) {
      console.error('删除搜索历史失败:', error)
    }
  },

  // 清空搜索历史
  async clearSearchHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove([SEARCH_HISTORY_KEY])
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  },

  // 获取搜索设置
  async getSearchSettings(): Promise<ISearchSettings> {
    try {
      const result = await chrome.storage.local.get([SEARCH_SETTINGS_KEY])
      return (
        result[SEARCH_SETTINGS_KEY] || {
          defaultEngine: 'baidu',
          enableHistory: true,
          maxHistoryCount: DEFAULT_MAX_HISTORY_COUNT
        }
      )
    } catch (error) {
      console.error('获取搜索设置失败:', error)
      return {
        defaultEngine: 'baidu',
        enableHistory: true,
        maxHistoryCount: DEFAULT_MAX_HISTORY_COUNT
      }
    }
  },

  // 保存搜索设置
  async saveSearchSettings(settings: ISearchSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ [SEARCH_SETTINGS_KEY]: settings })
    } catch (error) {
      console.error('保存搜索设置失败:', error)
    }
  }
}

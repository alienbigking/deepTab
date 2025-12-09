import { ISearchHistoryItem, ISearchSettings } from '../types/searchBar'

/**
 * searchBar 服务层
 * 处理搜索历史和设置的存储
 */
export default {
  // 获取搜索历史
  async getSearchHistory(): Promise<ISearchHistoryItem[]> {
    try {
      const result = await chrome.storage.local.get(['searchHistory'])
      return result.searchHistory || []
    } catch (error) {
      console.error('获取搜索历史失败:', error)
      return []
    }
  },

  // 保存搜索历史
  async saveSearchHistory(item: ISearchHistoryItem): Promise<void> {
    try {
      const history = await this.getSearchHistory()
      const newHistory = [item, ...history].slice(0, 50) // 最多保存50条
      await chrome.storage.local.set({ searchHistory: newHistory })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 清空搜索历史
  async clearSearchHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove(['searchHistory'])
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  },

  // 获取搜索设置
  async getSearchSettings(): Promise<ISearchSettings> {
    try {
      const result = await chrome.storage.local.get(['searchSettings'])
      return (
        result.searchSettings || {
          defaultEngine: 'baidu',
          enableHistory: true,
          maxHistoryCount: 50
        }
      )
    } catch (error) {
      console.error('获取搜索设置失败:', error)
      return {
        defaultEngine: 'baidu',
        enableHistory: true,
        maxHistoryCount: 50
      }
    }
  },

  // 保存搜索设置
  async saveSearchSettings(settings: ISearchSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ searchSettings: settings })
    } catch (error) {
      console.error('保存搜索设置失败:', error)
    }
  }
}

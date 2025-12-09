import { Timer } from './timer'

/**
 * 从 chrome.storage.local 获取定时器列表
 * @returns Promise<Timer[]> 返回定时器数组，如果没有则返回空数组
 */
export const getTimers = (): Promise<Timer[]> =>
  new Promise((resolve) => {
    chrome.storage.local.get(['timers'], (res) => {
      resolve(res.timers || [])
    })
  })

/**
 * 将定时器列表保存到 chrome.storage.local
 * @param timers 要保存的定时器数组
 */
export const saveTimers = (timers: Timer[]) => {
  chrome.storage.local.set({ timers }, () => {
    console.log('💾 定时器已保存:', timers)
  })
}

/**
 * 初始化定时器：从存储中读取并恢复定时器
 * 主要在插件启动或刷新时调用
 */
export const initTimersFromStorage = async () => {
  const timers = await getTimers()
  if (timers.length > 0) {
    console.log('🔄 从存储中恢复定时器...')
    // updateTimers(timers) // 更新 alarms
  } else {
    console.log('ℹ️ 存储中未找到定时器')
  }
}

/**
 * 统计数据接口
 */
export interface TimerStats {
  totalRefreshCount: number // 总刷新次数
  todayRefreshCount: number // 今日刷新次数
  lastResetDate: string // 上次重置日期（YYYY-MM-DD）
  dailyHistory: { [date: string]: number } // 每日历史记录
  taskHistory: {
    [tabId: number]: {
      totalRuns: number // 总运行次数
      lastRefreshTime: number // 最后刷新时间戳
    }
  }
}

/**
 * 获取统计数据
 */
export const getStats = (): Promise<TimerStats> =>
  new Promise((resolve) => {
    chrome.storage.local.get(['timerStats'], (res) => {
      const today = new Date().toISOString().split('T')[0]
      const defaultStats: TimerStats = {
        totalRefreshCount: 0,
        todayRefreshCount: 0,
        lastResetDate: today,
        dailyHistory: {},
        taskHistory: {}
      }
      
      const stats = res.timerStats || defaultStats
      
      // 如果日期变了，重置今日计数
      if (stats.lastResetDate !== today) {
        stats.todayRefreshCount = 0
        stats.lastResetDate = today
      }
      
      resolve(stats)
    })
  })

/**
 * 保存统计数据
 */
export const saveStats = (stats: TimerStats) => {
  chrome.storage.local.set({ timerStats: stats })
}

/**
 * 记录一次刷新
 */
export const recordRefresh = async (tabId: number) => {
  const stats = await getStats()
  const today = new Date().toISOString().split('T')[0]
  
  // 更新总计数
  stats.totalRefreshCount++
  stats.todayRefreshCount++
  
  // 更新每日历史
  stats.dailyHistory[today] = (stats.dailyHistory[today] || 0) + 1
  
  // 更新任务历史
  if (!stats.taskHistory[tabId]) {
    stats.taskHistory[tabId] = {
      totalRuns: 0,
      lastRefreshTime: 0
    }
  }
  stats.taskHistory[tabId].totalRuns++
  stats.taskHistory[tabId].lastRefreshTime = Date.now()
  
  saveStats(stats)
}

/**
 * 刷新记录接口
 */
export interface RefreshRecord {
  id: string // 唯一ID
  taskId: number // 任务 tabId
  taskTitle: string // 任务标题
  taskUrl: string // 任务URL
  timestamp: number // 刷新时间戳
  type: 'auto' | 'manual' // 刷新类型
  status: 'success' | 'failed' // 刷新状态
  errorMessage?: string // 失败原因（可选）
}

/**
 * 获取历史记录
 * @param limit 可选，限制返回的记录数量
 */
export const getRefreshHistory = (limit?: number): Promise<RefreshRecord[]> =>
  new Promise((resolve) => {
    chrome.storage.local.get(['refreshHistory'], (res) => {
      let history: RefreshRecord[] = res.refreshHistory || []
      
      // 按时间倒序排序
      history.sort((a, b) => b.timestamp - a.timestamp)
      
      // 如果指定了限制，只返回最新的 N 条
      if (limit && limit > 0) {
        history = history.slice(0, limit)
      }
      
      resolve(history)
    })
  })

/**
 * 保存历史记录
 */
export const saveRefreshHistory = (history: RefreshRecord[]) => {
  chrome.storage.local.set({ refreshHistory: history })
}

/**
 * 添加一条刷新记录
 */
export const addRefreshRecord = async (record: Omit<RefreshRecord, 'id' | 'timestamp'>) => {
  const history = await getRefreshHistory()
  
  const newRecord: RefreshRecord = {
    ...record,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  }
  
  // 添加到历史记录开头
  history.unshift(newRecord)
  
  // 只保留最近 1000 条记录（防止存储过大）
  const MAX_RECORDS = 1000
  if (history.length > MAX_RECORDS) {
    history.splice(MAX_RECORDS)
  }
  
  saveRefreshHistory(history)
  console.log('📝 已添加刷新记录:', newRecord)
}

/**
 * 清空历史记录
 */
export const clearRefreshHistory = () => {
  chrome.storage.local.set({ refreshHistory: [] })
  console.log('🗑️ 已清空历史记录')
}

/**
 * 应用设置接口
 */
export interface AppSettings {
  restoreOnStartup: boolean // 浏览器启动时恢复任务
  maxTasks: number // 最大任务数量
  historyRetentionDays: number // 历史记录保留天数（0=永久）
}

/**
 * 获取应用设置
 */
export const getAppSettings = (): Promise<AppSettings> =>
  new Promise((resolve) => {
    chrome.storage.local.get(['appSettings'], (res) => {
      const defaultSettings: AppSettings = {
        restoreOnStartup: true,
        maxTasks: 20,
        historyRetentionDays: 30
      }
      resolve(res.appSettings || defaultSettings)
    })
  })

/**
 * 保存应用设置
 */
export const saveAppSettings = (settings: AppSettings) => {
  chrome.storage.local.set({ appSettings: settings })
  console.log('💾 应用设置已保存:', settings)
}

/**
 * 清理过期的历史记录
 */
export const cleanupOldHistory = async () => {
  const settings = await getAppSettings()
  
  // 如果设置为永久保留（0），则不清理
  if (settings.historyRetentionDays === 0) {
    return
  }
  
  const history = await getRefreshHistory()
  const cutoffTime = Date.now() - settings.historyRetentionDays * 24 * 60 * 60 * 1000
  
  const filteredHistory = history.filter((record) => record.timestamp >= cutoffTime)
  
  if (filteredHistory.length < history.length) {
    saveRefreshHistory(filteredHistory)
    console.log(`🗑️ 已清理 ${history.length - filteredHistory.length} 条过期历史记录`)
  }
}

/**
 * 重置所有统计数据
 */
export const resetStats = () => {
  const today = new Date().toISOString().split('T')[0]
  const emptyStats: TimerStats = {
    totalRefreshCount: 0,
    todayRefreshCount: 0,
    lastResetDate: today,
    dailyHistory: {},
    taskHistory: {}
  }
  saveStats(emptyStats)
  console.log('🔄 统计数据已重置')
}

/**
 * 导出所有数据
 */
export const exportAllData = async () => {
  const timers = await getTimers()
  const stats = await getStats()
  const history = await getRefreshHistory()
  const settings = await getAppSettings()
  
  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    timers,
    stats,
    history,
    settings
  }
  
  return exportData
}

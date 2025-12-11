import type { Apps } from './types/appGrid'

/**
 * 初始化默认应用数据
 * 用于首次使用时填充一些常用应用
 */
export const defaultApps: Omit<Apps, 'id' | 'order'>[] = [
  { name: 'Google', icon: '🔍', url: 'https://www.google.com', syncStatus: 'synced' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com', syncStatus: 'synced' },
  { name: 'ChatGPT', icon: '🤖', url: 'https://chat.openai.com', syncStatus: 'synced' },
  { name: 'YouTube', icon: '📺', url: 'https://www.youtube.com', syncStatus: 'synced' },
  { name: 'Twitter', icon: '🐦', url: 'https://twitter.com', syncStatus: 'synced' },
  { name: 'Reddit', icon: '🤖', url: 'https://www.reddit.com', syncStatus: 'synced' },
  { name: '微博', icon: '🔴', url: 'https://weibo.com', syncStatus: 'synced' },
  { name: '哔哩哔哩', icon: '📺', url: 'https://www.bilibili.com', syncStatus: 'synced' },
  { name: '知乎', icon: '💡', url: 'https://www.zhihu.com', syncStatus: 'synced' },
  { name: '淘宝', icon: '🛒', url: 'https://www.taobao.com', syncStatus: 'synced' },
  { name: '京东', icon: '🐶', url: 'https://www.jd.com', syncStatus: 'synced' },
  { name: '豆瓣', icon: '📚', url: 'https://www.douban.com', syncStatus: 'synced' }
]

/**
 * 初始化应用数据到 storage
 */
export const initDefaultApps = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['app_grid_data'], (result) => {
      // 如果已有数据,不覆盖
      if (result.app_grid_data && result.app_grid_data.length > 0) {
        resolve()
        return
      }

      // 生成完整的应用数据
      const apps: Apps[] = defaultApps.map((app, index) => ({
        ...app,
        id: `app_init_${Date.now()}_${index}`,
        order: index,
        createdAt: new Date().toISOString()
      }))

      // 保存到 storage
      chrome.storage.local.set({ app_grid_data: apps }, () => {
        console.log('✅ 默认应用数据初始化完成')
        resolve()
      })
    })
  })
}

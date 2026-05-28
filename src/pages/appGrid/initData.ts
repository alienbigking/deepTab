import type { Apps, AppItem } from './types/appGrid'

const APP_GRID_DATA_VERSION = 7
const APP_GRID_DATA_VERSION_KEY = 'app_grid_data_version'
const APP_GRID_STORAGE_KEY = 'app_grid_data'
const APP_GRID_LEGACY_KEYS = ['app_grid_data', 'app_grid_icon_settings', 'bottom_bar_pins']

/**
 * 初始化默认应用数据
 * 用于首次使用时填充一些常用应用
 */
export const defaultApps: Omit<Apps, 'id' | 'order'>[] = [
  { name: '日期', icon: '27', iconBg: '#f59e0b', url: 'deeptab://widget/calendar', widgetSpan: 4, syncStatus: 'synced' },
  { name: '天气', icon: '☁', iconBg: '#38bdf8', url: 'deeptab://widget/weather', widgetSpan: 4, syncStatus: 'synced' },
  { name: '待办事项', icon: '✓', iconBg: '#7c3aed', url: 'deeptab://widget/todo', widgetSpan: 4, syncStatus: 'synced' },
  { name: '热搜榜', icon: '热', iconBg: '#ef4444', url: 'deeptab://widget/hotSearch', widgetSpan: 4, syncStatus: 'synced' },
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
    chrome.storage.local.get([APP_GRID_STORAGE_KEY, APP_GRID_DATA_VERSION_KEY], (result) => {
      const storedVersion = result[APP_GRID_DATA_VERSION_KEY]
      const shouldReset = storedVersion !== APP_GRID_DATA_VERSION

      const initApps = () => {
        const apps: AppItem[] = defaultApps.map((app, index) => ({
          ...app,
          type: 'item',
          id: `app_init_${Date.now()}_${index}`,
          order: index,
          createdAt: new Date().toISOString()
        }))

        chrome.storage.local.set(
          {
            [APP_GRID_STORAGE_KEY]: apps,
            [APP_GRID_DATA_VERSION_KEY]: APP_GRID_DATA_VERSION
          },
          () => {
            console.log('✅ 默认应用数据初始化完成')
            resolve()
          }
        )
      }

      if (shouldReset) {
        chrome.storage.local.remove(APP_GRID_LEGACY_KEYS, initApps)
        return
      }

      if (result[APP_GRID_STORAGE_KEY] && result[APP_GRID_STORAGE_KEY].length > 0) {
        resolve()
        return
      }

      initApps()
    })
  })
}

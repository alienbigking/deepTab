import type { Apps, AppItem } from './types/appGrid'

const APP_GRID_DATA_VERSION = 10
const APP_GRID_DATA_VERSION_KEY = 'app_grid_data_version'
const APP_GRID_STORAGE_KEY = 'app_grid_data'

const platformIcon = (fileName: string) => `src/assets/images/platforms/${fileName}`

const builtinPlatformApps: Omit<Apps, 'id' | 'order'>[] = [
  { name: 'Google', icon: platformIcon('google.svg'), url: 'https://www.google.com', syncStatus: 'synced' },
  { name: 'GitHub', icon: platformIcon('github.svg'), url: 'https://github.com', syncStatus: 'synced' },
  { name: 'ChatGPT', icon: platformIcon('chatgpt.svg'), url: 'https://chatgpt.com', syncStatus: 'synced' },
  { name: 'YouTube', icon: platformIcon('youtube.svg'), url: 'https://www.youtube.com', syncStatus: 'synced' },
  { name: 'X', icon: platformIcon('x.svg'), url: 'https://x.com', syncStatus: 'synced' },
  { name: 'Reddit', icon: platformIcon('reddit.svg'), url: 'https://www.reddit.com', syncStatus: 'synced' },
  { name: '微博', icon: platformIcon('weibo.ico'), url: 'https://weibo.com', syncStatus: 'synced' },
  { name: '哔哩哔哩', icon: platformIcon('bilibili.ico'), url: 'https://www.bilibili.com', syncStatus: 'synced' },
  { name: '知乎', icon: platformIcon('zhihu.ico'), url: 'https://www.zhihu.com', syncStatus: 'synced' },
  { name: '淘宝', icon: platformIcon('taobao.ico'), url: 'https://www.taobao.com', syncStatus: 'synced' },
  { name: '京东', icon: platformIcon('jd.ico'), url: 'https://www.jd.com', syncStatus: 'synced' },
  { name: '豆瓣', icon: platformIcon('douban.ico'), url: 'https://www.douban.com', syncStatus: 'synced' },
  { name: '百度', icon: platformIcon('baidu.ico'), url: 'https://www.baidu.com', syncStatus: 'synced' },
  { name: '百度网盘', icon: platformIcon('baidu-pan.ico'), url: 'https://pan.baidu.com', syncStatus: 'synced' },
  { name: '腾讯视频', icon: platformIcon('tencent-video.ico'), url: 'https://v.qq.com', syncStatus: 'synced' },
  { name: '爱奇艺', icon: platformIcon('iqiyi.ico'), url: 'https://www.iqiyi.com', syncStatus: 'synced' },
  { name: '优酷', icon: platformIcon('youku.ico'), url: 'https://www.youku.com', syncStatus: 'synced' },
  { name: '抖音', icon: platformIcon('douyin.ico'), url: 'https://www.douyin.com', syncStatus: 'synced' },
  { name: '小红书', icon: platformIcon('xiaohongshu.ico'), url: 'https://www.xiaohongshu.com', syncStatus: 'synced' },
  { name: '微信读书', icon: platformIcon('weread.ico'), url: 'https://weread.qq.com', syncStatus: 'synced' },
  { name: '掘金', icon: platformIcon('juejin.ico'), url: 'https://juejin.cn', syncStatus: 'synced' },
  { name: 'CSDN', icon: platformIcon('csdn.ico'), url: 'https://www.csdn.net', syncStatus: 'synced' },
  { name: '网易云音乐', icon: platformIcon('netease-music.ico'), url: 'https://music.163.com', syncStatus: 'synced' },
  { name: 'QQ音乐', icon: platformIcon('qq-music.ico'), url: 'https://y.qq.com', syncStatus: 'synced' },
  { name: 'Spotify', icon: platformIcon('spotify.svg'), url: 'https://open.spotify.com', syncStatus: 'synced' },
  { name: 'Netflix', icon: platformIcon('netflix.svg'), url: 'https://www.netflix.com', syncStatus: 'synced' },
  { name: 'Amazon', icon: platformIcon('amazon.ico'), url: 'https://www.amazon.com', syncStatus: 'synced' },
  { name: 'Notion', icon: platformIcon('notion.svg'), url: 'https://www.notion.so', syncStatus: 'synced' },
  { name: 'Figma', icon: platformIcon('figma.svg'), url: 'https://www.figma.com', syncStatus: 'synced' },
  { name: 'Slack', icon: platformIcon('slack.ico'), url: 'https://slack.com', syncStatus: 'synced' },
  { name: 'Discord', icon: platformIcon('discord.svg'), url: 'https://discord.com', syncStatus: 'synced' },
  { name: 'Gmail', icon: platformIcon('gmail.svg'), url: 'https://mail.google.com', syncStatus: 'synced' },
  { name: 'Outlook', icon: platformIcon('outlook.ico'), url: 'https://outlook.live.com', syncStatus: 'synced' },
  { name: 'Microsoft', icon: platformIcon('microsoft.ico'), url: 'https://www.microsoft.com', syncStatus: 'synced' },
  { name: 'Apple', icon: platformIcon('apple.svg'), url: 'https://www.apple.com', syncStatus: 'synced' },
  { name: 'Cloudflare', icon: platformIcon('cloudflare.svg'), url: 'https://www.cloudflare.com', syncStatus: 'synced' },
  { name: 'Vercel', icon: platformIcon('vercel.svg'), url: 'https://vercel.com', syncStatus: 'synced' },
  { name: 'npm', icon: platformIcon('npm.svg'), url: 'https://www.npmjs.com', syncStatus: 'synced' },
  { name: 'Stack Overflow', icon: platformIcon('stackoverflow.svg'), url: 'https://stackoverflow.com', syncStatus: 'synced' },
  { name: 'MDN', icon: platformIcon('mdn.png'), url: 'https://developer.mozilla.org', syncStatus: 'synced' },
  { name: 'Medium', icon: platformIcon('medium.svg'), url: 'https://medium.com', syncStatus: 'synced' },
  { name: 'Product Hunt', icon: platformIcon('producthunt.ico'), url: 'https://www.producthunt.com', syncStatus: 'synced' },
  { name: 'Pinterest', icon: platformIcon('pinterest.svg'), url: 'https://www.pinterest.com', syncStatus: 'synced' },
  { name: 'Instagram', icon: platformIcon('instagram.svg'), url: 'https://www.instagram.com', syncStatus: 'synced' },
  { name: 'Facebook', icon: platformIcon('facebook.svg'), url: 'https://www.facebook.com', syncStatus: 'synced' },
  { name: 'LinkedIn', icon: platformIcon('linkedin.ico'), url: 'https://www.linkedin.com', syncStatus: 'synced' },
  { name: 'Telegram', icon: platformIcon('telegram.svg'), url: 'https://telegram.org', syncStatus: 'synced' },
  { name: 'WhatsApp', icon: platformIcon('whatsapp.svg'), url: 'https://www.whatsapp.com', syncStatus: 'synced' },
  { name: 'Dribbble', icon: platformIcon('dribbble.svg'), url: 'https://dribbble.com', syncStatus: 'synced' },
  { name: 'Behance', icon: platformIcon('behance.svg'), url: 'https://www.behance.net', syncStatus: 'synced' }
]

const builtinCategoryApps: Omit<Apps, 'id' | 'order'>[] = [
  { name: 'ChatGPT', icon: platformIcon('chatgpt.svg'), url: 'https://chatgpt.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'Claude', icon: platformIcon('claude.png'), url: 'https://claude.ai', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'Gemini', icon: platformIcon('gemini.png'), url: 'https://gemini.google.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'DeepSeek', icon: platformIcon('deepseek.ico'), url: 'https://chat.deepseek.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'Kimi', icon: platformIcon('kimi.png'), url: 'https://kimi.moonshot.cn', categoryId: 'ai', syncStatus: 'synced' },
  { name: '豆包', icon: platformIcon('doubao.png'), url: 'https://www.doubao.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: '通义千问', icon: platformIcon('tongyi.png'), url: 'https://tongyi.aliyun.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: '文心一言', icon: platformIcon('wenxin.png'), url: 'https://yiyan.baidu.com', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'Perplexity', icon: platformIcon('perplexity.ico'), url: 'https://www.perplexity.ai', categoryId: 'ai', syncStatus: 'synced' },
  { name: 'Poe', icon: platformIcon('poe.ico'), url: 'https://poe.com', categoryId: 'ai', syncStatus: 'synced' },

  { name: 'Figma', icon: platformIcon('figma.svg'), url: 'https://www.figma.com', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Canva', icon: platformIcon('canva.ico'), url: 'https://www.canva.com', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Dribbble', icon: platformIcon('dribbble.svg'), url: 'https://dribbble.com', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Behance', icon: platformIcon('behance.svg'), url: 'https://www.behance.net', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Pinterest', icon: platformIcon('pinterest.svg'), url: 'https://www.pinterest.com', categoryId: 'design', syncStatus: 'synced' },
  { name: '站酷', icon: platformIcon('zcool.ico'), url: 'https://www.zcool.com.cn', categoryId: 'design', syncStatus: 'synced' },
  { name: '花瓣', icon: platformIcon('huaban.png'), url: 'https://huaban.com', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Iconfont', icon: platformIcon('iconfont.svg'), url: 'https://www.iconfont.cn', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Unsplash', icon: platformIcon('unsplash.ico'), url: 'https://unsplash.com', categoryId: 'design', syncStatus: 'synced' },
  { name: 'Pexels', icon: platformIcon('pexels.png'), url: 'https://www.pexels.com', categoryId: 'design', syncStatus: 'synced' },

  { name: 'GitHub', icon: platformIcon('github.svg'), url: 'https://github.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'Stack Overflow', icon: platformIcon('stackoverflow.svg'), url: 'https://stackoverflow.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'MDN', icon: platformIcon('mdn.png'), url: 'https://developer.mozilla.org', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'npm', icon: platformIcon('npm.svg'), url: 'https://www.npmjs.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'Vercel', icon: platformIcon('vercel.svg'), url: 'https://vercel.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'Cloudflare', icon: platformIcon('cloudflare.svg'), url: 'https://www.cloudflare.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: '掘金', icon: platformIcon('juejin.ico'), url: 'https://juejin.cn', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'CSDN', icon: platformIcon('csdn.ico'), url: 'https://www.csdn.net', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'Docker', icon: platformIcon('docker.png'), url: 'https://www.docker.com', categoryId: 'dev', syncStatus: 'synced' },
  { name: 'GitLab', icon: platformIcon('gitlab.png'), url: 'https://gitlab.com', categoryId: 'dev', syncStatus: 'synced' },

  { name: '淘宝', icon: platformIcon('taobao.ico'), url: 'https://www.taobao.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '京东', icon: platformIcon('jd.ico'), url: 'https://www.jd.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '天猫', icon: platformIcon('tmall.png'), url: 'https://www.tmall.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '拼多多', icon: platformIcon('pinduoduo.png'), url: 'https://www.pinduoduo.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: 'Amazon', icon: platformIcon('amazon.ico'), url: 'https://www.amazon.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: 'eBay', icon: platformIcon('ebay.ico'), url: 'https://www.ebay.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: 'AliExpress', icon: platformIcon('aliexpress.png'), url: 'https://www.aliexpress.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '苏宁易购', icon: '苏', iconBg: '#f59e0b', url: 'https://www.suning.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '唯品会', icon: platformIcon('vip.ico'), url: 'https://www.vip.com', categoryId: 'shop', syncStatus: 'synced' },
  { name: '得物', icon: platformIcon('dewu.ico'), url: 'https://www.dewu.com', categoryId: 'shop', syncStatus: 'synced' }
]

/**
 * 初始化默认应用数据
 * 用于首次使用时填充一些常用应用
 */
export const defaultApps: Omit<Apps, 'id' | 'order'>[] = [
  { name: '日期', icon: '27', iconBg: '#f59e0b', url: 'deeptab://widget/calendar', widgetSpan: 4, syncStatus: 'synced' },
  { name: '天气', icon: '☁', iconBg: '#38bdf8', url: 'deeptab://widget/weather', widgetSpan: 4, syncStatus: 'synced' },
  { name: '待办事项', icon: '✓', iconBg: '#7c3aed', url: 'deeptab://widget/todo', widgetSpan: 4, syncStatus: 'synced' },
  { name: '热搜榜', icon: '热', iconBg: '#ef4444', url: 'deeptab://widget/hotSearch', widgetSpan: 4, syncStatus: 'synced' },
  ...builtinPlatformApps,
  ...builtinCategoryApps
]

const getDefaultAppKey = (app: Pick<Apps, 'url' | 'categoryId'>) =>
  `${app.categoryId || 'home'}::${app.url}`

const createDefaultAppItems = (startOrder = 0): AppItem[] => {
  const timestamp = Date.now()
  return defaultApps.map((app, index) => ({
    ...app,
    type: 'item',
    id: `app_init_${timestamp}_${startOrder + index}`,
    order: startOrder + index,
    createdAt: new Date().toISOString()
  }))
}

const mergeDefaultApps = (storedApps: AppItem[]): AppItem[] => {
  const existedKeys = new Set(storedApps.map(getDefaultAppKey))
  const nextOrder = storedApps.length ? Math.max(...storedApps.map((app) => app.order || 0)) + 1 : 0
  const missingDefaults = createDefaultAppItems(nextOrder).filter((app) => !existedKeys.has(getDefaultAppKey(app)))

  if (!missingDefaults.length) return storedApps
  return [...storedApps, ...missingDefaults]
}

/**
 * 初始化应用数据到 storage
 */
export const initDefaultApps = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([APP_GRID_STORAGE_KEY, APP_GRID_DATA_VERSION_KEY], (result) => {
      const storedVersion = result[APP_GRID_DATA_VERSION_KEY]
      const shouldReset = storedVersion !== APP_GRID_DATA_VERSION

      const initApps = () => {
        const apps = createDefaultAppItems()

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
        const storedApps = (result[APP_GRID_STORAGE_KEY] || []) as AppItem[]
        if (storedApps.length > 0) {
          chrome.storage.local.set(
            {
              [APP_GRID_STORAGE_KEY]: mergeDefaultApps(storedApps),
              [APP_GRID_DATA_VERSION_KEY]: APP_GRID_DATA_VERSION
            },
            () => {
              console.log('✅ 默认应用数据已补齐')
              resolve()
            }
          )
          return
        }

        initApps()
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

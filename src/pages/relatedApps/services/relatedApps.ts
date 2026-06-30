import type { IRelatedApp } from '../types/relatedApps'

export default {
  async getRelatedApps(): Promise<IRelatedApp[]> {
    return [
      {
        id: 'auto-refresh',
        name: 'autoRefresh',
        description:
          '一款轻量级浏览器自动刷新插件，支持按标签页设置刷新间隔、快捷时间预设、指定开始时间、一键暂停或恢复，以及最大刷新次数限制，适合监控页面状态、定时刷新数据看板和保持网页内容更新。',
        icon: 'AR',
        url: 'https://deeptab.com/auto-refresh',
        category: '效率工具'
      }
    ]
  }
}

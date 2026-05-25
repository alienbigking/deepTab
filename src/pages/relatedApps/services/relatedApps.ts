import type { IRelatedApp } from '../types/relatedApps'

export default {
  async getRelatedApps(): Promise<IRelatedApp[]> {
    return [
      {
        id: 'deep-tab',
        name: 'Deep Tab',
        description: '当前正在使用的新标签页插件，支持快捷入口、壁纸、组件和云同步。',
        icon: 'DT',
        url: 'https://deeptab.com',
        category: '效率'
      },
      {
        id: 'unbounded-social',
        name: 'Unbounded Social',
        description: 'Deep Tab 后端账号与云同步服务所属项目。',
        icon: 'US',
        url: 'https://unbounded.social',
        category: '服务'
      }
    ]
  }
}

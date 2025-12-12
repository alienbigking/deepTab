import { http } from '@/utils'
import { env } from '@/config/env'
import type { Apps, AddAppParams, UpdateAppParams } from '../types/appGrid'
import { defaultApps } from '../initData'

// ========== 本地存储工具 ==========
const STORAGE_KEY = 'app_grid_data'

const storageUtils = {
  // 获取本地应用列表
  async getLocal(): Promise<Apps[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const apps = result[STORAGE_KEY] || []
        resolve(apps.sort((a: Apps, b: Apps) => a.order - b.order))
      })
    })
  },

  // 保存到本地
  async saveLocal(apps: Apps[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: apps }, resolve)
    })
  },

  // 生成唯一 ID
  generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // 获取下一个排序号
  async getNextOrder(): Promise<number> {
    const apps = await this.getLocal()
    return apps.length > 0 ? Math.max(...apps.map((a) => a.order)) + 1 : 0
  }
}

// ========== 远程 API 接口(预留) ==========
const apiService = {
  // 获取应用列表
  getList() {
    // TODO: 接入后端 API
    // return http(`${env.HOST_API_URL}apps`).then((response) => {
    //   return response
    // })
    throw new Error('远程 API 未实现')
  },

  // 添加应用
  add(params: AddAppParams) {
    // TODO: 接入后端 API
    // return http(`${env.HOST_API_URL}apps`, {
    //   method: 'POST',
    //   data: params
    // }).then((response) => {
    //   return response
    // })
    console.log('[API] 添加应用', params)
  },

  // 更新应用
  update(id: string, params: UpdateAppParams) {
    // TODO: 接入后端 API
    // return http(`${env.HOST_API_URL}apps/${id}`, {
    //   method: 'PUT',
    //   data: params
    // }).then((response) => {
    //   return response
    // })
    console.log('[API] 更新应用', id, params)
  },

  // 删除应用
  delete(id: string) {
    // TODO: 接入后端 API
    // return http(`${env.HOST_API_URL}apps/${id}`, {
    //   method: 'DELETE'
    // }).then((response) => {
    //   return response
    // })
    console.log('[API] 删除应用', id)
  },

  // 批量更新顺序
  updateOrder(apps: Array<{ id: string; order: number }>) {
    // TODO: 接入后端 API
    // return http(`${env.HOST_API_URL}apps/order`, {
    //   method: 'PUT',
    //   data: { apps }
    // }).then((response) => {
    //   return response
    // })
    console.log('[API] 更新顺序', apps.length)
  }
}

// ========== 业务逻辑层(本地 + 远程同步) ==========
export default {
  /**
   * 获取应用列表
   * 优先从本地读取,如果已登录则从远程同步
   */
  async getList(): Promise<Apps[]> {
    // 1. 先从本地读取
    const localApps = await storageUtils.getLocal()

    // 2. TODO: 如果已登录,尝试从远程同步
    // if (isLoggedIn()) {
    //   try {
    //     const response = await apiService.getList()
    //     const remoteApps = response.data
    //     await storageUtils.saveLocal(remoteApps)
    //     return remoteApps
    //   } catch (error) {
    //     console.warn('远程同步失败,使用本地数据', error)
    //   }
    // }

    return localApps
  },

  /**
   * 添加应用
   */
  async add(params: AddAppParams): Promise<Apps> {
    const newApp: Apps = {
      ...params,
      id: storageUtils.generateId(),
      order: await storageUtils.getNextOrder(),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    // 1. 保存到本地
    const apps = await storageUtils.getLocal()
    apps.push(newApp)
    await storageUtils.saveLocal(apps)

    // 2. TODO: 如果已登录,同步到远程
    // if (isLoggedIn()) {
    //   apiService.add(params).catch(console.error)
    // }

    return newApp
  },

  /**
   * 更新应用
   */
  async update(id: string, params: UpdateAppParams): Promise<Apps> {
    const apps = await storageUtils.getLocal()
    const index = apps.findIndex((app) => app.id === id)

    if (index === -1) {
      throw new Error('应用不存在')
    }

    const updatedApp: Apps = {
      ...apps[index],
      ...params,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    apps[index] = updatedApp
    await storageUtils.saveLocal(apps)

    // TODO: 如果已登录,同步到远程
    // if (isLoggedIn()) {
    //   apiService.update(id, params).catch(console.error)
    // }

    return updatedApp
  },

  /**
   * 删除应用
   */
  async delete(id: string): Promise<void> {
    const apps = await storageUtils.getLocal()
    const filteredApps = apps.filter((app) => app.id !== id)

    // 1. 从本地删除
    await storageUtils.saveLocal(filteredApps)

    // 2. TODO: 如果已登录,同步到远程
    // if (isLoggedIn()) {
    //   apiService.delete(id).catch(console.error)
    // }
  },

  /**
   * 更新应用顺序
   */
  async updateOrder(apps: Apps[]): Promise<void> {
    // 更新 order 字段
    const updatedApps = apps.map((app, index) => ({
      ...app,
      order: index,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const
    }))

    // 1. 更新本地
    await storageUtils.saveLocal(updatedApps)

    // 2. TODO: 如果已登录,同步到远程
    // if (isLoggedIn()) {
    //   const orderData = updatedApps.map(a => ({ id: a.id, order: a.order }))
    //   apiService.updateOrder(orderData).catch(console.error)
    // }
  },

  /**
   * 重置为默认推荐应用
   */
  async resetToDefault(): Promise<Apps[]> {
    const apps: Apps[] = defaultApps.map((app, index) => ({
      ...app,
      id: storageUtils.generateId(),
      order: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    }))

    await storageUtils.saveLocal(apps)
    return apps
  }
}

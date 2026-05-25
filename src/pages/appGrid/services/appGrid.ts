import type {
  Apps,
  AddAppParams,
  UpdateAppParams,
  AppNode,
  AppItem,
  AppFolder,
  CreateFolderParams,
  MoveToFolderParams,
  MoveFromFolderParams,
  DeleteFolderParams,
  IconSettings
} from '../types/appGrid'
import { defaultApps } from '../initData'

// ========== 本地存储工具 ==========
const STORAGE_KEY = 'app_grid_data'
const ICON_SETTINGS_KEY = 'app_grid_icon_settings'

const storageUtils = {
  // 获取本地应用列表（兼容旧数据）
  async getLocal(): Promise<AppNode[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const apps = result[STORAGE_KEY] || []
        // 兼容旧数据：如果没有 type 字段，则转为 AppItem
        const migrated = apps.map((app: any) => {
          if (!app.type) {
            return { ...app, type: 'item' as const, url: app.url || '' }
          }
          return app
        })
        resolve(migrated.sort((a: AppNode, b: AppNode) => a.order - b.order))
      })
    })
  },

  // 保存到本地
  async saveLocal(nodes: AppNode[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: nodes }, () => {
        const err = chrome.runtime.lastError
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  },

  // 生成唯一 ID
  generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // 获取下一个排序号
  async getNextOrder(): Promise<number> {
    const nodes = await this.getLocal()
    return nodes.length > 0 ? Math.max(...nodes.map((a) => a.order)) + 1 : 0
  },

  // 图标设置
  async getIconSettings(): Promise<IconSettings | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([ICON_SETTINGS_KEY], (result) => {
        resolve(result[ICON_SETTINGS_KEY] || null)
      })
    })
  },

  async saveIconSettings(settings: IconSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [ICON_SETTINGS_KEY]: settings }, () => {
        const err = chrome.runtime.lastError
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }
}

// ========== 业务逻辑层(本地存储) ==========
export default {
  /**
   * 获取应用列表（支持文件夹）
   */
  async getList(): Promise<AppNode[]> {
    const localNodes = await storageUtils.getLocal()
    return localNodes
  },

  /**
   * 添加应用
   */
  async add(params: AddAppParams): Promise<AppItem> {
    const newApp: AppItem = {
      ...params,
      type: 'item',
      id: storageUtils.generateId(),
      order: await storageUtils.getNextOrder(),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    const nodes = await storageUtils.getLocal()
    nodes.push(newApp)
    await storageUtils.saveLocal(nodes)

    return newApp
  },

  /**
   * 更新应用
   */
  async update(id: string, params: UpdateAppParams): Promise<AppNode> {
    const nodes = await storageUtils.getLocal()
    const index = nodes.findIndex((node) => node.id === id)

    if (index === -1) {
      throw new Error('应用不存在')
    }

    const updatedNode: AppNode = {
      ...nodes[index],
      ...params,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    nodes[index] = updatedNode
    await storageUtils.saveLocal(nodes)

    return updatedNode
  },

  /**
   * 删除应用
   */
  async delete(id: string): Promise<void> {
    const nodes = await storageUtils.getLocal()
    const filteredNodes = nodes.filter((node) => node.id !== id)
    await storageUtils.saveLocal(filteredNodes)
  },

  /**
   * 更新应用顺序
   */
  async updateOrder(nodes: AppNode[]): Promise<void> {
    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      order: index,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const
    }))
    await storageUtils.saveLocal(updatedNodes)
  },

  /**
   * 重新排序应用（只更新 order 字段）
   */
  async reorder(orderList: { id: string; order: number }[]): Promise<void> {
    const nodes = await storageUtils.getLocal()
    const orderMap = new Map(orderList.map((item) => [item.id, item.order]))

    const updatedNodes = nodes.map((node) => {
      const newOrder = orderMap.get(node.id)
      if (newOrder !== undefined) {
        return {
          ...node,
          order: newOrder,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' as const
        }
      }
      return node
    })

    // 按新顺序排序后保存
    updatedNodes.sort((a, b) => a.order - b.order)
    await storageUtils.saveLocal(updatedNodes)
  },

  /**
   * 覆盖保存整份应用数据
   */
  async saveAll(nodes: AppNode[]): Promise<void> {
    await storageUtils.saveLocal(nodes)
  },

  async saveIconSettings(settings: IconSettings): Promise<void> {
    await storageUtils.saveIconSettings(settings)
  },

  async getIconSettings(): Promise<IconSettings | null> {
    return storageUtils.getIconSettings()
  },

  /**
   * 重置为默认推荐应用
   */
  async resetToDefault(): Promise<AppNode[]> {
    const nodes: AppNode[] = defaultApps.map((app, index) => ({
      ...app,
      type: 'item' as const,
      id: storageUtils.generateId(),
      url: app.url || '',
      order: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    }))

    await storageUtils.saveLocal(nodes)
    return nodes
  },

  // ========== 文件夹相关方法 ==========

  /**
   * 创建文件夹
   */
  async createFolder(params: CreateFolderParams): Promise<AppFolder> {
    const newFolder: AppFolder = {
      type: 'folder',
      id: storageUtils.generateId(),
      name: params.name,
      icon: params.icon || '📁',
      order: await storageUtils.getNextOrder(),
      children: params.children || [],
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    const nodes = await storageUtils.getLocal()
    nodes.push(newFolder)
    await storageUtils.saveLocal(nodes)

    return newFolder
  },

  /**
   * 将图标移动到文件夹
   */
  async moveToFolder(params: MoveToFolderParams): Promise<void> {
    const nodes = await storageUtils.getLocal()
    const folderIndex = nodes.findIndex(
      (node) => node.id === params.folderId && node.type === 'folder'
    )
    if (folderIndex === -1) throw new Error('文件夹不存在')

    const folder = nodes[folderIndex] as AppFolder
    if (folder.children.length >= 50) throw new Error('文件夹已满（最多 50 个图标）')

    const itemIndex = nodes.findIndex((node) => node.id === params.itemId && node.type === 'item')
    if (itemIndex === -1) throw new Error('图标不存在')

    const item = nodes[itemIndex] as AppItem
    // 从主网格移除
    nodes.splice(itemIndex, 1)
    // 插入到文件夹
    const insertIndex =
      params.insertIndex !== undefined ? params.insertIndex : folder.children.length
    folder.children.splice(insertIndex, 0, item)

    await storageUtils.saveLocal(nodes)
  },

  /**
   * 从文件夹移出图标
   */
  async moveFromFolder(params: MoveFromFolderParams): Promise<void> {
    const nodes = await storageUtils.getLocal()
    const folderIndex = nodes.findIndex(
      (node) => node.id === params.folderId && node.type === 'folder'
    )
    if (folderIndex === -1) throw new Error('文件夹不存在')

    const folder = nodes[folderIndex] as AppFolder
    const childIndex = folder.children.findIndex((child) => child.id === params.itemId)
    if (childIndex === -1) throw new Error('图标不在该文件夹中')

    const item = folder.children[childIndex]
    // 从文件夹移除
    folder.children.splice(childIndex, 1)
    // 插入到主网格
    const targetOrder = params.targetOrder !== undefined ? params.targetOrder : nodes.length
    const insertIndex = targetOrder
    nodes.splice(insertIndex, 0, item)

    await storageUtils.saveLocal(nodes)
  },

  /**
   * 删除文件夹
   */
  async deleteFolder(params: DeleteFolderParams): Promise<void> {
    const nodes = await storageUtils.getLocal()
    const folderIndex = nodes.findIndex(
      (node) => node.id === params.folderId && node.type === 'folder'
    )
    if (folderIndex === -1) throw new Error('文件夹不存在')

    const folder = nodes[folderIndex] as AppFolder
    // 从主网格移除文件夹
    nodes.splice(folderIndex, 1)

    // 如果不删除内部图标，则将它们移回主网格
    if (!params.deleteChildren) {
      const insertIndex = folderIndex // 在原位置插入
      nodes.splice(insertIndex, 0, ...folder.children)
    }

    await storageUtils.saveLocal(nodes)
  },

  /**
   * 更新文件夹名称或封面
   */
  async updateFolder(
    id: string,
    params: Pick<UpdateAppParams, 'name' | 'icon'>
  ): Promise<AppFolder> {
    const nodes = await storageUtils.getLocal()
    const index = nodes.findIndex((node) => node.id === id && node.type === 'folder')
    if (index === -1) throw new Error('文件夹不存在')

    const folder = nodes[index] as AppFolder
    const updatedFolder: AppFolder = {
      ...folder,
      ...params,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    nodes[index] = updatedFolder
    await storageUtils.saveLocal(nodes)

    return updatedFolder
  }
}

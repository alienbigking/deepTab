import { create } from 'zustand'
import type {
  AppNode,
  AppItem,
  AppFolder,
  ContextMenuState,
  CreateFolderParams,
  MoveToFolderParams,
  MoveFromFolderParams,
  DeleteFolderParams,
  UpdateAppParams,
  IconSettings,
  AppGridStore
} from '../types/appGrid'

/**
 * AppGrid 状态管理 Store
 */
export const defaultIconSettings: IconSettings = {
  size: 72,
  radius: 16,
  opacity: 100,
  spacing: 24,
  fontSize: 12,
  fontColor: 'light'
}

export const useAppGridStore = create<AppGridStore>((set, get) => ({
  // 初始状态
  apps: [],
  isEditMode: false,
  contextMenu: null,
  isLoading: false,
  syncStatus: 'idle',
  iconSettings: defaultIconSettings,
  openedFolderId: null,

  // Actions
  setApps: (apps) =>
    set((state) => ({
      apps: typeof apps === 'function' ? apps(state.apps) : apps
    })),
  setIsEditMode: (isEditMode) => set({ isEditMode }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setIconSettings: (settings) =>
    set((state) => ({
      iconSettings: { ...state.iconSettings, ...settings }
    })),
  resetIconSettings: () => set({ iconSettings: defaultIconSettings }),
  setOpenedFolderId: (folderId) => set({ openedFolderId: folderId }),

  // 加载应用列表
  loadApps: async () => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      const apps = await appGridService.getList()
      setApps(apps)
    } catch (error) {
      console.error('加载应用列表失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  },

  // 文件夹相关 actions
  createFolder: async (params) => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      const newFolder = await appGridService.createFolder(params)
      setApps((prev) => [...prev, newFolder])
      return newFolder
    } catch (error) {
      console.error('创建文件夹失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  },

  moveToFolder: async (params) => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      await appGridService.moveToFolder(params)
      // 重新加载列表以反映最新状态
      const updated = await appGridService.getList()
      setApps(updated)
    } catch (error) {
      console.error('移入文件夹失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  },

  moveFromFolder: async (params) => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      await appGridService.moveFromFolder(params)

      // 检查文件夹是否为空，如果为空则自动删除
      const currentList = await appGridService.getList()
      const folder = currentList.find((item) => item.id === params.folderId)
      if (folder && folder.type === 'folder' && folder.children.length === 0) {
        console.log('文件夹为空，自动删除:', params.folderId)
        await appGridService.delete(params.folderId)
      }

      const updated = await appGridService.getList()
      setApps(updated)
    } catch (error) {
      console.error('从文件夹移出失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  },

  deleteFolder: async (params) => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      await appGridService.deleteFolder(params)
      const updated = await appGridService.getList()
      setApps(updated)
    } catch (error) {
      console.error('删除文件夹失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  },

  updateFolder: async (id, params) => {
    const { setApps, setIsLoading } = get()
    setIsLoading(true)
    try {
      const appGridService = (await import('../services/appGrid')).default
      const updatedFolder = await appGridService.updateFolder(id, params)
      setApps((prev) => prev.map((node) => (node.id === id ? updatedFolder : node)))
    } catch (error) {
      console.error('更新文件夹失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }
}))

export default useAppGridStore

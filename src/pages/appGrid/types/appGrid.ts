/**
 * 应用图标数据模型
 */
export interface Apps {
  id: string // 唯一标识s
  name: string // 应用名称
  icon: string // 图标(emoji 或 URL)
  url: string // 应用链接
  order: number // 排序序号
  categoryId?: string // 分类/分页 ID
  userId?: string // 用户 ID(接入后端后使用)
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
  syncStatus?: 'synced' | 'pending' | 'error' // 同步状态
}

/**
 * 图标设置
 */
export interface IconSettings {
  size: number
  radius: number
  opacity: number
  spacing: number
  fontSize: number
  fontColor: 'light' | 'dark'
}

/**
 * 应用节点类型（支持文件夹）
 */
export type AppNode = AppItem | AppFolder

/**
 * 普通应用图标项
 */
export interface AppItem extends Apps {
  type: 'item'
}

/**
 * 文件夹项
 */
export interface AppFolder extends Omit<Apps, 'url'> {
  type: 'folder'
  children: AppItem[]
  coverIcon?: string // 封面图标，默认为前几个图标的拼合
}

/**
 * 右键菜单状态
 */
export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  appId: string
  appType?: 'item' | 'folder' | 'blank' // 区分图标、文件夹或空白区域
}

/**
 * 添加应用参数
 */
export interface AddAppParams {
  name: string
  icon: string
  url: string
}

/**
 * 更新应用参数
 */
export interface UpdateAppParams {
  id: string
  name?: string
  icon?: string
  url?: string
}

/**
 * 创建文件夹参数
 */
export interface CreateFolderParams {
  name: string
  icon?: string
  children?: AppItem[]
}

/**
 * 移动图标到文件夹参数
 */
export interface MoveToFolderParams {
  itemId: string
  folderId: string
  insertIndex?: number
}

/**
 * 从文件夹移出图标参数
 */
export interface MoveFromFolderParams {
  itemId: string
  folderId: string
  targetOrder?: number
}

/**
 * 删除文件夹参数
 */
export interface DeleteFolderParams {
  folderId: string
  deleteChildren?: boolean // 是否同时删除内部图标
}

/**
 * AppGrid Store 接口
 */
export interface AppGridStore {
  // 状态
  apps: AppNode[]
  isEditMode: boolean
  contextMenu: ContextMenuState | null
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  iconSettings: IconSettings
  openedFolderId: string | null // 当前打开的文件夹 ID

  // Actions
  setApps: (apps: AppNode[] | ((prevApps: AppNode[]) => AppNode[])) => void
  setIsEditMode: (isEditMode: boolean) => void
  setContextMenu: (contextMenu: ContextMenuState | null) => void
  setIsLoading: (isLoading: boolean) => void
  setSyncStatus: (syncStatus: 'idle' | 'syncing' | 'error') => void
  setIconSettings: (settings: Partial<IconSettings>) => void
  resetIconSettings: () => void
  setOpenedFolderId: (folderId: string | null) => void

  // 数据加载 actions
  loadApps: () => Promise<void>

  // 文件夹相关 actions
  createFolder: (params: CreateFolderParams) => Promise<AppFolder>
  moveToFolder: (params: MoveToFolderParams) => Promise<void>
  moveFromFolder: (params: MoveFromFolderParams) => Promise<void>
  deleteFolder: (params: DeleteFolderParams) => Promise<void>
  updateFolder: (id: string, params: Pick<UpdateAppParams, 'name' | 'icon'>) => Promise<void>
}

/**
 * API 响应格式
 */
export interface AppGridResponse<T = any> {
  code: number
  message: string
  data: T
}

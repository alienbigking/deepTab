/**
 * 应用图标数据模型
 */
export interface App {
  id: string // 唯一标识
  name: string // 应用名称
  icon: string // 图标(emoji 或 URL)
  url: string // 应用链接
  order: number // 排序序号
  userId?: string // 用户 ID(接入后端后使用)
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
  syncStatus?: 'synced' | 'pending' | 'error' // 同步状态
}

/**
 * 右键菜单状态
 */
export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  appId: string
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
 * API 响应格式
 */
export interface AppGridResponse<T = any> {
  code: number
  message: string
  data: T
}

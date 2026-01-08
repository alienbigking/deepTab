/**
 * BottomBar Store 接口
 */
export interface BottomBarStore {
  pinnedAppIds: string[]
  setPinnedAppIds: (pinnedAppIds: string[] | ((prev: string[]) => string[])) => void
}

/**
 * BottomBar 数据结构
 */
export interface BottomBarPins {
  pinnedAppIds: string[]
}

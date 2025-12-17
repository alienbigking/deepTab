export type CategoryIconKey =
  | 'home'
  | 'ai'
  | 'design'
  | 'code'
  | 'shop'
  | 'folder'
  | 'star'
  | 'heart'
  | 'tag'
  | 'tool'

export interface AppCategory {
  id: string
  name: string
  icon: CategoryIconKey
  order: number
  createdAt: string
}

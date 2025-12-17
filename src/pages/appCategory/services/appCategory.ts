import type { AppCategory, CategoryIconKey } from '../types/appCategory'

const STORAGE_KEY = 'app_categories'
const BUILTIN_CATEGORY_IDS = new Set(['home', 'ai', 'design', 'dev', 'shop'])

const defaultCategories: AppCategory[] = [
  {
    id: 'home',
    name: '主页',
    icon: 'home',
    order: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai',
    name: 'AI工具',
    icon: 'ai',
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'design',
    name: '设计',
    icon: 'design',
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'dev',
    name: '程序',
    icon: 'code',
    order: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop',
    name: '购物',
    icon: 'shop',
    order: 4,
    createdAt: new Date().toISOString()
  }
]

const generateId = () => {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const sortByOrder = (list: AppCategory[]) => [...list].sort((a, b) => a.order - b.order)

export default {
  async getCategories(): Promise<AppCategory[]> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEY])
      const raw = (result[STORAGE_KEY] || []) as AppCategory[]

      if (!raw || raw.length === 0) {
        await chrome.storage.local.set({ [STORAGE_KEY]: defaultCategories })
        return sortByOrder(defaultCategories)
      }

      return sortByOrder(raw)
    } catch (error) {
      console.error('获取分类失败:', error)
      return sortByOrder(defaultCategories)
    }
  },

  async saveCategories(categories: AppCategory[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: categories })
    } catch (error) {
      console.error('保存分类失败:', error)
      throw error
    }
  },

  async addCategory(params: { name: string; icon?: CategoryIconKey }): Promise<AppCategory> {
    const categories = await this.getCategories()
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 0

    const newCategory: AppCategory = {
      id: generateId(),
      name: params.name,
      icon: params.icon || 'folder',
      order: nextOrder,
      createdAt: new Date().toISOString()
    }

    const next = [...categories, newCategory]
    await this.saveCategories(next)
    return newCategory
  },

  async updateCategory(
    id: string,
    updates: { name?: string; icon?: CategoryIconKey }
  ): Promise<void> {
    try {
      const categories = await this.getCategories()
      const idx = categories.findIndex((c) => c.id === id)
      if (idx === -1) return

      const next = [...categories]
      next[idx] = {
        ...next[idx],
        ...(typeof updates.name === 'string' ? { name: updates.name } : {}),
        ...(updates.icon ? { icon: updates.icon } : {})
      }

      await this.saveCategories(next)
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (BUILTIN_CATEGORY_IDS.has(id)) {
      throw new Error('内置分类不允许删除')
    }

    try {
      const categories = await this.getCategories()
      const next = categories.filter((c) => c.id !== id)
      await this.saveCategories(next)

      const after = await this.getCategories()
      if (after.some((c) => c.id === id)) {
        throw new Error('删除失败：数据未更新')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }
}

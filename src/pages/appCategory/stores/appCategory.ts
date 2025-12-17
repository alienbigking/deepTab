import { create } from 'zustand'
import type { AppCategory, CategoryIconKey } from '../types/appCategory'
import appCategoryService from '../services/appCategory'

interface AppCategoryStore {
  categories: AppCategory[]
  activeCategoryId: string
  init: () => Promise<void>
  setActiveCategoryId: (id: string) => void
  addCategory: (params: { name: string; icon?: CategoryIconKey }) => Promise<AppCategory>
  updateCategory: (id: string, updates: { name?: string; icon?: CategoryIconKey }) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  setCategories: (categories: AppCategory[]) => void
}

export const useAppCategoryStore = create<AppCategoryStore>((set, get) => ({
  categories: [],
  activeCategoryId: 'home',

  init: async () => {
    const list = await appCategoryService.getCategories()
    set({ categories: list })

    const active = get().activeCategoryId
    if (!list.some((c) => c.id === active)) {
      set({ activeCategoryId: list[0]?.id || 'home' })
    }
  },

  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  addCategory: async (params) => {
    const created = await appCategoryService.addCategory(params)
    const next = [...get().categories, created].sort((a, b) => a.order - b.order)
    set({ categories: next, activeCategoryId: created.id })
    return created
  },

  updateCategory: async (id, updates) => {
    await appCategoryService.updateCategory(id, updates)
    const list = await appCategoryService.getCategories()
    set({ categories: list })
  },

  deleteCategory: async (id) => {
    const prev = get().categories
    const optimistic = prev.filter((c) => c.id !== id)
    const active = get().activeCategoryId
    const optimisticActive =
      active === id
        ? optimistic.some((c) => c.id === 'home')
          ? 'home'
          : optimistic[0]?.id || 'home'
        : active
    set({ categories: optimistic, activeCategoryId: optimisticActive })

    try {
      await appCategoryService.deleteCategory(id)
      const list = await appCategoryService.getCategories()
      const nextActive =
        optimisticActive === id
          ? list.some((c) => c.id === 'home')
            ? 'home'
            : list[0]?.id || 'home'
          : optimisticActive
      set({ categories: list, activeCategoryId: nextActive })
    } catch (error) {
      const list = await appCategoryService.getCategories()
      set({ categories: list })
      throw error
    }
  },

  setCategories: (categories) => set({ categories })
}))

export default useAppCategoryStore

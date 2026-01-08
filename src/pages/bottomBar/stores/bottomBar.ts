import { create } from 'zustand'
import type { BottomBarStore } from '../types/bottomBar'

export const useBottomBarStore = create<BottomBarStore>((set) => ({
  pinnedAppIds: [],
  setPinnedAppIds: (pinnedAppIds) =>
    set((state) => ({
      pinnedAppIds:
        typeof pinnedAppIds === 'function' ? pinnedAppIds(state.pinnedAppIds) : pinnedAppIds
    }))
}))

export default useBottomBarStore

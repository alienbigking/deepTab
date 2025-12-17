import { create } from 'zustand'

interface BottomBarStore {
  pinnedAppIds: string[]
  setPinnedAppIds: (pinnedAppIds: string[] | ((prev: string[]) => string[])) => void
}

export const useBottomBarStore = create<BottomBarStore>((set) => ({
  pinnedAppIds: [],
  setPinnedAppIds: (pinnedAppIds) =>
    set((state) => ({
      pinnedAppIds:
        typeof pinnedAppIds === 'function' ? pinnedAppIds(state.pinnedAppIds) : pinnedAppIds
    }))
}))

export default useBottomBarStore

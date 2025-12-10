import { create } from 'zustand'

interface AboutStore {
  info: any
  setInfo: (info: any) => void
}

export const useAboutStore = create<AboutStore>((set) => ({
  info: null,
  setInfo: (info) => set({ info })
}))

export default useAboutStore

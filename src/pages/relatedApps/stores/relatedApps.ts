import { create } from 'zustand'

interface RelatedAppsStore {
  apps: any[]
  setApps: (apps: any[]) => void
}

export const useRelatedAppsStore = create<RelatedAppsStore>((set) => ({
  apps: [],
  setApps: (apps) => set({ apps })
}))

export default useRelatedAppsStore

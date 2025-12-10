import { create } from 'zustand'
import { IInvitationStats } from '../types/invitation'

interface InvitationStore {
  stats: IInvitationStats | null
  setStats: (stats: IInvitationStats | null) => void
}

export const useInvitationStore = create<InvitationStore>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats })
}))

export default useInvitationStore

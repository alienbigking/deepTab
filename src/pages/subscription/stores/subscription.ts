import { create } from 'zustand'
import { ISubscriptionStatus } from '../types/subscription'

interface SubscriptionStore {
  status: ISubscriptionStatus
  showUpgradeModal: boolean
  setStatus: (status: ISubscriptionStatus) => void
  setShowUpgradeModal: (show: boolean) => void
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  status: {
    plan: 'free',
    isActive: true,
    autoRenew: false
  },
  showUpgradeModal: false,
  setStatus: (status) => set({ status }),
  setShowUpgradeModal: (showUpgradeModal) => set({ showUpgradeModal })
}))

export default useSubscriptionStore

import { atom } from 'recoil'
import { ISubscriptionStatus } from '../types/subscription'

// 订阅状态
const subscriptionStatusStore = atom<ISubscriptionStatus>({
  key: 'subscriptionStatusStore',
  default: {
    plan: 'free',
    isActive: true,
    autoRenew: false
  }
})

// 是否显示升级弹窗
const showUpgradeModalStore = atom<boolean>({
  key: 'showUpgradeModalStore',
  default: false
})

export default { subscriptionStatusStore, showUpgradeModalStore }

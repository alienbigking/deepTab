/**
 * subscription 模块类型定义
 */

// 订阅计划类型
type SubscriptionPlan = 'free' | 'pro' | 'premium'

// 订阅状态
interface ISubscriptionStatus {
  plan: SubscriptionPlan
  startDate?: string
  endDate?: string
  isActive: boolean
  autoRenew: boolean
}

// 订阅套餐
interface ISubscriptionPackage {
  id: string
  name: string
  plan: SubscriptionPlan
  price: number
  duration: number // 天数
  features: string[]
  popular?: boolean
}

// 订阅历史
interface ISubscriptionHistory {
  id: string
  plan: SubscriptionPlan
  startDate: string
  endDate: string
  amount: number
  status: 'active' | 'expired' | 'cancelled'
}

export { SubscriptionPlan, ISubscriptionStatus, ISubscriptionPackage, ISubscriptionHistory }

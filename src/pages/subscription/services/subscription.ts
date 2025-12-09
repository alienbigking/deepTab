import { http } from '@/utils'
import { env } from '@/config/env'
import { ISubscriptionStatus, ISubscriptionPackage, ISubscriptionHistory } from '../types/subscription'

/**
 * subscription 服务层
 */
export default {
  // 获取订阅状态
  async getSubscriptionStatus(): Promise<ISubscriptionStatus> {
    try {
      const result = await chrome.storage.local.get(['subscriptionStatus'])
      return (
        result.subscriptionStatus || {
          plan: 'free',
          isActive: true,
          autoRenew: false
        }
      )
    } catch (error) {
      console.error('获取订阅状态失败:', error)
      return {
        plan: 'free',
        isActive: true,
        autoRenew: false
      }
    }
  },

  // 获取订阅套餐列表
  async getSubscriptionPackages(): Promise<ISubscriptionPackage[]> {
    try {
      const response = await http(`${env.HOST_API_URL}subscription/packages`)
      return response.data
    } catch (error) {
      console.error('获取订阅套餐失败:', error)
      // 返回模拟数据
      return [
        {
          id: '1',
          name: '专业版',
          plan: 'pro',
          price: 29,
          duration: 30,
          features: ['无限壁纸', '高级主题', '优先支持']
        },
        {
          id: '2',
          name: '高级版',
          plan: 'premium',
          price: 99,
          duration: 365,
          features: ['专业版所有功能', '自定义开发', 'VIP专属客服'],
          popular: true
        }
      ]
    }
  },

  // 获取订阅历史
  async getSubscriptionHistory(): Promise<ISubscriptionHistory[]> {
    try {
      const result = await chrome.storage.local.get(['subscriptionHistory'])
      return result.subscriptionHistory || []
    } catch (error) {
      console.error('获取订阅历史失败:', error)
      return []
    }
  },

  // 购买订阅
  async purchaseSubscription(packageId: string): Promise<void> {
    try {
      await http(`${env.HOST_API_URL}subscription/purchase`, {
        method: 'POST',
        data: { packageId }
      })
    } catch (error) {
      console.error('购买订阅失败:', error)
      throw error
    }
  },

  // 取消订阅
  async cancelSubscription(): Promise<void> {
    try {
      await http(`${env.HOST_API_URL}subscription/cancel`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('取消订阅失败:', error)
      throw error
    }
  }
}

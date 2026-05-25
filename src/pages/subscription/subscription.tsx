import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { App, Badge, Button, Card, Tag } from 'antd'
import { CheckCircleOutlined, CrownOutlined } from '@ant-design/icons'
import styles from './subscription.module.less'
import subscriptionService from './services/subscription'
import type { ISubscriptionPackage, ISubscriptionStatus } from './types/subscription'

const Subscription: React.FC = () => {
  const { message } = App.useApp()
  const [status, setStatus] = useState<ISubscriptionStatus>({
    plan: 'free',
    isActive: true,
    autoRenew: false
  })
  const [packages, setPackages] = useState<ISubscriptionPackage[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [statusData, packageData] = await Promise.all([
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getSubscriptionPackages()
      ])
      setStatus(statusData)
      setPackages(packageData)
    }
    void load()
  }, [])

  const handlePurchase = async (item: ISubscriptionPackage) => {
    setLoadingId(item.id)
    try {
      await subscriptionService.purchaseSubscription(item.id)
      const next: ISubscriptionStatus = {
        plan: item.plan,
        isActive: true,
        autoRenew: false,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000).toISOString()
      }
      await chrome.storage.local.set({ subscriptionStatus: next })
      setStatus(next)
      message.success('订阅状态已更新')
    } catch (error: any) {
      message.error(error?.message || '订阅失败，请稍后再试')
    } finally {
      setLoadingId(null)
    }
  }

  const planName = status.plan === 'free' ? '免费版' : status.plan === 'pro' ? '专业版' : '高级版'

  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.currentPlan)}>
        <Badge.Ribbon text={status.plan.toUpperCase()} color={status.plan === 'free' ? 'gray' : 'gold'}>
          <Card className='dtSettingsCard' variant='borderless'>
            <div className={cn(styles.planInfo)}>
              <CrownOutlined className={styles.planIcon} />
              <h3>{planName}</h3>
              <p>{status.isActive ? '当前订阅有效' : '订阅已过期'}</p>
              {status.endDate ? (
                <Tag color='processing'>到期：{new Date(status.endDate).toLocaleDateString()}</Tag>
              ) : null}
            </div>
          </Card>
        </Badge.Ribbon>
      </div>

      <div className={cn(styles.packageGrid)}>
        {packages.map((item) => (
          <Card key={item.id} className='dtSettingsCard' variant='borderless'>
            <div className={styles.packageHeader}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.duration} 天</p>
              </div>
              {item.popular ? <Tag color='gold'>推荐</Tag> : null}
            </div>
            <div className={styles.price}>¥{item.price}</div>
            <div className={styles.features}>
              {item.features.map((feature) => (
                <span key={feature}>
                  <CheckCircleOutlined />
                  {feature}
                </span>
              ))}
            </div>
            <Button
              block
              type={status.plan === item.plan ? 'default' : 'primary'}
              disabled={status.plan === item.plan}
              loading={loadingId === item.id}
              onClick={() => void handlePurchase(item)}
            >
              {status.plan === item.plan ? '当前方案' : '选择方案'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Subscription

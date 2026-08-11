import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { App, Badge, Button, Card, Tag } from 'antd'
import { CheckCircleOutlined, CrownOutlined } from '@ant-design/icons'
import styles from './subscription.module.less'
import subscriptionService from './services/subscription'
import type { ISubscriptionPackage, ISubscriptionStatus } from './types/subscription'
import { useTranslation } from 'react-i18next'

const FEATURE_TRANSLATION_KEYS: Record<string, string> = {
  '无限壁纸': 'unlimitedWallpapers',
  'Unlimited wallpapers': 'unlimitedWallpapers',
  '高级主题': 'advancedThemes',
  'Advanced themes': 'advancedThemes',
  '优先支持': 'prioritySupport',
  'Priority support': 'prioritySupport',
  '专业版所有功能': 'allProFeatures',
  'All Pro features': 'allProFeatures',
  '自定义开发': 'customDevelopment',
  'Custom development': 'customDevelopment',
  'VIP专属客服': 'vipSupport',
  'VIP support': 'vipSupport'
}

const Subscription: React.FC = () => {
  const { message } = App.useApp()
  const { t, i18n } = useTranslation()
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
      message.success(t('subscription.updated', { defaultValue: 'Subscription updated' }))
    } catch (error: any) {
      console.error('Subscription purchase failed:', error)
      message.error(t('subscription.failed', { defaultValue: 'Subscription failed. Try again later.' }))
    } finally {
      setLoadingId(null)
    }
  }

  const planName = status.plan === 'free' ? t('subscription.free', { defaultValue: 'Free' }) : status.plan === 'pro' ? t('subscription.pro', { defaultValue: 'Pro' }) : t('subscription.premium', { defaultValue: 'Premium' })
  const getPackageName = (item: ISubscriptionPackage) =>
    t(`subscription.${item.plan}`, { defaultValue: item.name })
  const getFeatureName = (feature: string) => {
    const key = FEATURE_TRANSLATION_KEYS[feature]
    return key ? t(`subscription.features.${key}`, { defaultValue: feature }) : feature
  }

  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.currentPlan)}>
        <Badge.Ribbon text={planName} color={status.plan === 'free' ? 'gray' : 'gold'}>
          <Card className='dtSettingsCard' variant='borderless'>
            <div className={cn(styles.planInfo)}>
              <CrownOutlined className={styles.planIcon} />
              <h3>{planName}</h3>
              <p>{status.isActive ? t('subscription.active', { defaultValue: 'Subscription active' }) : t('subscription.expired', { defaultValue: 'Subscription expired' })}</p>
              {status.endDate ? (
                <Tag color='processing'>{t('subscription.expires', { defaultValue: 'Expires' })}: {new Date(status.endDate).toLocaleDateString(i18n.resolvedLanguage)}</Tag>
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
                <h3>{getPackageName(item)}</h3>
                <p>{t('subscription.days', { count: item.duration, defaultValue: `${item.duration} days` })}</p>
              </div>
              {item.popular ? <Tag color='gold'>{t('subscription.popular', { defaultValue: 'Popular' })}</Tag> : null}
            </div>
            <div className={styles.price}>¥{item.price}</div>
            <div className={styles.features}>
              {item.features.map((feature) => (
                <span key={feature}>
                  <CheckCircleOutlined />
                  {getFeatureName(feature)}
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
              {status.plan === item.plan ? t('subscription.current', { defaultValue: 'Current plan' }) : t('subscription.choose', { defaultValue: 'Choose plan' })}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Subscription

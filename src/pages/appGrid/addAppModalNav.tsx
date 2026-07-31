import React from 'react'
import { Button, Tabs } from 'antd'
import cn from 'classnames'
import styles from './addAppModalNav.module.less'
import { useTranslation } from 'react-i18next'

interface RecommendedApp {
  key: string
  name: string
  icon: string
  url: string
  desc: string
  iconBg?: string
}

interface AddAppModalNavProps {
  apps: RecommendedApp[]
  activeCategory: string
  categories: { key: string; label: string }[]
  activeSubTab: 'today' | 'recent' | 'popular'
  loading?: boolean
  onChangeCategory: (key: any) => void
  onChangeSubTab: (key: 'today' | 'recent' | 'popular') => void
  onAddApp: (app: RecommendedApp) => void
}

const AddAppModalNav: React.FC<AddAppModalNavProps> = ({
  apps,
  activeCategory,
  categories,
  activeSubTab,
  loading = false,
  onChangeCategory,
  onChangeSubTab,
  onAddApp
}) => {
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <div className={styles.categoryRow}>
        {categories.map((category) => (
          <button
            key={category.key}
            type='button'
            className={cn(styles.categoryItem, activeCategory === category.key && styles.categoryItemActive)}
            onClick={() => onChangeCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className={styles.subTabsRow}>
        <Tabs
          size='small'
          activeKey={activeSubTab}
          onChange={(key) => onChangeSubTab(key as 'today' | 'recent' | 'popular')}
          items={[
            { key: 'today', label: t('addAppCatalog.tabs.today') },
            { key: 'recent', label: t('addAppCatalog.tabs.recent') },
            { key: 'popular', label: t('addAppCatalog.tabs.popular') }
          ]}
        />
      </div>

      <div className={styles.grid}>
        {apps.map((app) => (
          <div key={app.key} className={styles.card}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ backgroundColor: app.iconBg || '#fff' }}>
                  {app.icon}
                </div>
                <div className={styles.cardTitle}>{app.name}</div>
              </div>
              <div className={styles.cardDesc}>{app.desc}</div>
            </div>
            <div className={styles.cardFooter}>
              <Button
                type='primary'
                size='small'
                loading={loading}
                onClick={() => {
                  onAddApp(app)
                }}
              >
                {t('addAppCatalog.add')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AddAppModalNav

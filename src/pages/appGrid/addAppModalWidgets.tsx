import React from 'react'
import { Button, Tabs } from 'antd'
import cn from 'classnames'
import styles from './addAppModalWidgets.module.less'

interface RecommendedApp {
  key: string
  name: string
  icon: string
  url: string
  desc: string
  iconBg?: string
  popularity?: number
}

interface AddAppModalWidgetsProps {
  apps: RecommendedApp[]
  activeCategory: string
  categories: { key: string; label: string }[]
  activeSubTab: 'today' | 'recent' | 'popular'
  loading?: boolean
  onChangeCategory: (key: any) => void
  onChangeSubTab: (key: 'today' | 'recent' | 'popular') => void
  onAddApp: (app: RecommendedApp) => void
}

const AddAppModalWidgets: React.FC<AddAppModalWidgetsProps> = ({
  apps,
  activeCategory,
  categories,
  activeSubTab,
  loading = false,
  onChangeCategory,
  onChangeSubTab,
  onAddApp
}) => {
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
            { key: 'today', label: '今日推荐' },
            { key: 'recent', label: '最近更新' },
            { key: 'popular', label: '最受欢迎' }
          ]}
        />
      </div>

      <div className={styles.grid}>
        {apps.map((app, index) => (
          <div key={app.key} className={styles.card}>
            <div className={styles.cardMain}>
              <div className={styles.iconArea} style={{ background: app.iconBg || undefined }}>
                {app.icon}
              </div>
              <div className={styles.text}>
                <div className={styles.title}>{app.name}</div>
                <div className={styles.subtitle}>{app.desc}</div>
              </div>
            </div>
            <div className={styles.footer}>
              <div className={styles.hot}>
                <span>🔥</span>
                <span>{app.popularity || (index + 1) * 1000}</span>
              </div>
              <Button
                type='primary'
                size='small'
                loading={loading}
                onClick={() => {
                  onAddApp(app)
                }}
              >
                添加
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AddAppModalWidgets

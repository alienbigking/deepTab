import React from 'react'
import { Button, Tabs } from 'antd'
import cn from 'classnames'
import styles from './addAppModalNav.module.less'

interface RecommendedApp {
  key: string
  name: string
  icon: string
  url: string
  desc: string
}

interface AddAppModalNavProps {
  apps: RecommendedApp[]
  activeSubTab: 'today' | 'recent' | 'popular'
  onChangeSubTab: (key: 'today' | 'recent' | 'popular') => void
  onAddApp: (app: RecommendedApp) => void
}

const AddAppModalNav: React.FC<AddAppModalNavProps> = ({
  apps,
  activeSubTab,
  onChangeSubTab,
  onAddApp
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.categoryRow}>
        <span className={cn(styles.categoryItem, styles.categoryItemActive)}>全部</span>
        <span className={styles.categoryItem}>效率</span>
        <span className={styles.categoryItem}>学习</span>
        <span className={styles.categoryItem}>视频</span>
        <span className={styles.categoryItem}>社交</span>
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
        {apps.map((app) => (
          <div key={app.key} className={styles.card}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>{app.icon}</div>
                <div className={styles.cardTitle}>{app.name}</div>
              </div>
              <div className={styles.cardDesc}>{app.desc}</div>
            </div>
            <div className={styles.cardFooter}>
              <Button
                type='primary'
                size='small'
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

export default AddAppModalNav

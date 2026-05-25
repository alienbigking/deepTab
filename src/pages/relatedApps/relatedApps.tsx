import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { Button, Card, List, Tag } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import styles from './relatedApps.module.less'
import relatedAppsService from './services/relatedApps'
import type { IRelatedApp } from './types/relatedApps'

const RelatedApps: React.FC = () => {
  const [apps, setApps] = useState<IRelatedApp[]>([])

  useEffect(() => {
    const load = async () => {
      setApps(await relatedAppsService.getRelatedApps())
    }
    void load()
  }, [])

  const openApp = (url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={cn(styles.container)}>
      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={apps}
        locale={{ emptyText: '暂无相关应用' }}
        renderItem={(item) => (
          <List.Item>
            <Card className='dtSettingsCard' variant='borderless'>
              <div className={styles.appCard}>
                <div className={styles.appIcon}>{item.icon}</div>
                <div className={styles.appMeta}>
                  <div className={styles.appTitle}>
                    <span>{item.name}</span>
                    <Tag>{item.category}</Tag>
                  </div>
                  <p>{item.description}</p>
                  <Button icon={<ExportOutlined />} onClick={() => openApp(item.url)}>
                    打开
                  </Button>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}

export default RelatedApps

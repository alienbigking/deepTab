import React from 'react'
import { Card, List } from 'antd'
import styles from './relatedApps.module.less'

const RelatedApps: React.FC = () => {
  const apps = [
    { id: '1', name: 'deepTab Pro', description: '专业版扩展', icon: '🎨' }
  ]

  return (
    <div className={styles.container}>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={apps}
        renderItem={(item) => (
          <List.Item>
            <Card title={item.icon + ' ' + item.name}>
              <p>{item.description}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}

export default RelatedApps

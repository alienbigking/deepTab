import React from 'react'
import { Card, Radio, Space } from 'antd'
import { SunOutlined, MoonOutlined, BulbOutlined } from '@ant-design/icons'
import styles from './theme.module.less'

const Theme: React.FC = () => {
  return (
    <div className={styles.container}>
      <Card title='主题模式'>
        <Radio.Group defaultValue='auto'>
          <Space direction='vertical' size='large'>
            <Radio value='light'>
              <Space>
                <SunOutlined />
                浅色模式
              </Space>
            </Radio>
            <Radio value='dark'>
              <Space>
                <MoonOutlined />
                深色模式
              </Space>
            </Radio>
            <Radio value='auto'>
              <Space>
                <BulbOutlined />
                跟随系统
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>
    </div>
  )
}

export default Theme

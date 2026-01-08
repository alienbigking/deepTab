import React, { useEffect } from 'react'
import cn from 'classnames'
import { Card, Radio, Space } from 'antd'
import { SunOutlined, MoonOutlined, BulbOutlined, SkinOutlined } from '@ant-design/icons'
import styles from './theme.module.less'
import themeService from './services/theme'
import useThemeStore from './stores/theme'

const Theme: React.FC = () => {
  const { config, setConfig, init } = useThemeStore()

  useEffect(() => {
    void init()
  }, [init])

  const handleChange = async (e: any) => {
    const mode = e.target.value
    const next = { ...config, mode }
    setConfig(next)
    await themeService.saveThemeConfig(next)
  }

  return (
    <div className={cn(styles.container)}>
      <Card title='主题模式' className='dtSettingsCard' bordered={false}>
        <Radio.Group value={config.mode} onChange={handleChange}>
          <Space direction='vertical' size='large'>
            <Radio value='default'>
              <Space>
                <SkinOutlined />
                默认模式
              </Space>
            </Radio>
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
            <Radio value='system'>
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

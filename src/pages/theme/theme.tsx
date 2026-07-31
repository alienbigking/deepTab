import React, { useEffect } from 'react'
import cn from 'classnames'
import { Card, Radio, Space } from 'antd'
import { SunOutlined, MoonOutlined, BulbOutlined, SkinOutlined } from '@ant-design/icons'
import styles from './theme.module.less'
import themeService from './services/theme'
import useThemeStore from './stores/theme'
import { useTranslation } from 'react-i18next'

const Theme: React.FC = () => {
  const { config, setConfig, init } = useThemeStore()
  const { t } = useTranslation()

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
      <Card title={t('theme.title', { defaultValue: 'Theme mode' })} className='dtSettingsCard' variant='borderless'>
        <Radio.Group value={config.mode} onChange={handleChange}>
          <Space direction='vertical' size='large'>
            <Radio value='default'>
              <Space>
                <SkinOutlined />
                {t('theme.default', { defaultValue: 'Default' })}
              </Space>
            </Radio>
            <Radio value='light'>
              <Space>
                <SunOutlined />
                {t('theme.light', { defaultValue: 'Light' })}
              </Space>
            </Radio>
            <Radio value='dark'>
              <Space>
                <MoonOutlined />
                {t('theme.dark', { defaultValue: 'Dark' })}
              </Space>
            </Radio>
            <Radio value='system'>
              <Space>
                <BulbOutlined />
                {t('theme.system', { defaultValue: 'Use system setting' })}
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>
    </div>
  )
}

export default Theme

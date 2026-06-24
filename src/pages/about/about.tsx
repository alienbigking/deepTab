import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { Card, Descriptions, Alert, Button, Space } from 'antd'
import styles from './about.module.less'
import generalSettingsService from '../generalSettings/services/generalSettings'
import { defaultGeneralSettings } from '../generalSettings/stores/generalSettings'
import LegalModal from '@/pages/legal/legalModal'
import type { LegalDocumentType } from '@/pages/legal/legalDocuments'

const About: React.FC = () => {
  const [showIcp, setShowIcp] = useState(defaultGeneralSettings.other.showIcp)
  const [legalType, setLegalType] = useState<LegalDocumentType | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setShowIcp(Boolean(data.other.showIcp))
    }

    void load()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes?.generalSettings) return
      void load()
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  return (
    <div className={cn(styles.container)}>
      <Alert
        message='💡 首次使用提示'
        description='如果您在新标签页右下角看到"自定义Chrome"按钮,这是 Chrome 浏览器的功能。您可以点击该按钮,选择"在新标签页上隐藏页脚",按钮将永久隐藏。'
        type='info'
        showIcon
        closable
        className={styles.tipAlert}
      />
      <Card title='关于 deepTab' className='dtSettingsCard' variant='borderless'>
        <Descriptions column={1}>
          <Descriptions.Item label='版本'>V2.2.22</Descriptions.Item>
          <Descriptions.Item label='作者'>deepTab Team</Descriptions.Item>
          <Descriptions.Item label='邮箱'>1260213657@qq.com</Descriptions.Item>
          <Descriptions.Item label='官网'>https://deeptab.com</Descriptions.Item>
          <Descriptions.Item label='合规文档'>
            <Space size={8} wrap>
              <Button type='link' size='small' onClick={() => setLegalType('terms')}>
                用户协议
              </Button>
              <Button type='link' size='small' onClick={() => setLegalType('privacy')}>
                隐私政策
              </Button>
            </Space>
          </Descriptions.Item>
          {showIcp && (
            <Descriptions.Item label='备案号'>
              <a
                href='https://beian.miit.gov.cn/'
                target='_blank'
                rel='noreferrer'
                className={styles.icpLink}
              >
                湘ICP备2021011742号
              </a>
            </Descriptions.Item>
          )}
          <Descriptions.Item label='描述'>一款漂亮的新标签页插件</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title='隐私与权限概览' className='dtSettingsCard' variant='borderless'>
        <div className={styles.privacySummary}>
          <p>Deep Tab 使用浏览器本地存储保存您的主页图标、壁纸、主题、搜索历史、小组件和偏好设置。</p>
          <p>登录后，您可以选择将主页 icon、分类、Dock、设置、主题等配置同步到 Deep Tab 服务端。</p>
          <p>天气、热搜、搜索建议和壁纸素材会按功能需要请求第三方服务；反馈附件、头像和邀请邮件由 Deep Tab 服务端处理。</p>
        </div>
      </Card>

      <LegalModal open={Boolean(legalType)} type={legalType || 'terms'} onClose={() => setLegalType(null)} />
    </div>
  )
}

export default About

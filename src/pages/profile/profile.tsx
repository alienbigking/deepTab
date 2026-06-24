import React, { useRef, useState } from 'react'
import cn from 'classnames'
import { App, Avatar, Button, Card, Descriptions, Tag } from 'antd'
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import AuthModal from '@/pages/auth/authModal'
import useAuthStore from '@/pages/auth/stores/auth'
import styles from './profile.module.less'

const getDisplayValue = (value?: string) => value || '未设置'

const Profile: React.FC = () => {
  const { message } = App.useApp()
  const session = useAuthStore((s) => s.session)
  const initAuth = useAuthStore((s) => s.init)
  const logout = useAuthStore((s) => s.logout)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const [authOpen, setAuthOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const user = session?.user
  const displayName = user?.nickname || user?.username || user?.userIdentifier || 'Deep Tab 用户'
  const accountId = user?.userId || user?.id || user?.userIdentifier

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      return
    }

    try {
      await uploadAvatar(file)
      message.success('头像已更新')
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error('头像上传失败，请稍后再试')
    }
  }

  const handleLoginClose = () => {
    setAuthOpen(false)
    void initAuth()
  }

  const handleLogout = async () => {
    await logout()
    message.success('已退出登录')
  }

  return (
    <div className={cn(styles.container)}>
      <Card className={cn('dtSettingsCard', styles.heroCard)} variant='borderless'>
        <div className={cn(styles.hero)}>
          <div className={cn(styles.avatarWrap)}>
            <Avatar size={88} src={user?.avatar} icon={<UserOutlined />} />
          </div>
          <div className={cn(styles.heroInfo)}>
            <div className={cn(styles.titleRow)}>
              <h2>{session ? displayName : '未登录'}</h2>
              <Tag color={session ? 'success' : 'default'}>{session ? '已登录' : '游客模式'}</Tag>
            </div>
            <p>
              {session
                ? '这里展示您的 DeepTab 账号基础信息，头像和资料会用于同步、反馈与邀请等功能。'
                : '登录后可同步主页 icon、分类、Dock、设置和主题等个人配置。'}
            </p>
            <div className={cn(styles.actions)}>
              {session ? (
                <>
                  <Button loading={isAuthLoading} onClick={() => avatarInputRef.current?.click()}>
                    更换头像
                  </Button>
                  <Button
                    className={styles.logoutBtn}
                    icon={<LogoutOutlined />}
                    danger
                    onClick={() => void handleLogout()}
                  >
                    退出登录
                  </Button>
                </>
              ) : (
                <Button type='primary' icon={<LoginOutlined />} onClick={() => setAuthOpen(true)}>
                  登录 / 注册
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title='基本信息' className='dtSettingsCard' variant='borderless'>
        <Descriptions
          column={1}
          styles={{
            label: { whiteSpace: 'nowrap' }
          }}
        >
          <Descriptions.Item label='昵称'>{getDisplayValue(user?.nickname)}</Descriptions.Item>
          <Descriptions.Item label='用户名'>{getDisplayValue(user?.username)}</Descriptions.Item>
          <Descriptions.Item label='账号标识'>{getDisplayValue(user?.userIdentifier)}</Descriptions.Item>
          <Descriptions.Item label='用户 ID'>{getDisplayValue(accountId)}</Descriptions.Item>
          <Descriptions.Item label='邮箱'>{getDisplayValue(user?.email)}</Descriptions.Item>
          <Descriptions.Item label='手机号'>{getDisplayValue(user?.mobile)}</Descriptions.Item>
          <Descriptions.Item label='身份类型'>{getDisplayValue(user?.identityType)}</Descriptions.Item>
          <Descriptions.Item label='账号状态'>{getDisplayValue(user?.status)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title='同步能力' className='dtSettingsCard' variant='borderless'>
        <div className={cn(styles.syncList)}>
          <span>主页 icon</span>
          <span>分类</span>
          <span>Dock</span>
          <span>设置</span>
          <span>主题</span>
          <span>个人资料</span>
        </div>
      </Card>

      <input
        ref={avatarInputRef}
        type='file'
        accept='image/*'
        className={styles.avatarInput}
        onChange={handleAvatarChange}
      />
      <AuthModal open={authOpen} onClose={handleLoginClose} />
    </div>
  )
}

export default Profile

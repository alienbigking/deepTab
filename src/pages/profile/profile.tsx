import React, { useRef, useState } from 'react'
import cn from 'classnames'
import { App, Avatar, Button, Card, Descriptions, Tag } from 'antd'
import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import AuthModal from '@/pages/auth/authModal'
import useAuthStore from '@/pages/auth/stores/auth'
import styles from './profile.module.less'
import { useTranslation } from 'react-i18next'

const Profile: React.FC = () => {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const getDisplayValue = (value?: string) => value || t('profile.notSet', { defaultValue: 'Not set' })
  const session = useAuthStore((s) => s.session)
  const initAuth = useAuthStore((s) => s.init)
  const logout = useAuthStore((s) => s.logout)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const [authOpen, setAuthOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const user = session?.user
  const displayName = user?.nickname || user?.username || user?.userIdentifier || t('sidebar.user')
  const accountId = user?.userId || user?.id || user?.userIdentifier

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      message.warning(t('profile.imageRequired', { defaultValue: 'Choose an image file' }))
      return
    }

    try {
      await uploadAvatar(file)
      message.success(t('profile.avatarUpdated', { defaultValue: 'Avatar updated' }))
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error(t('profile.avatarFailed', { defaultValue: 'Could not upload the avatar' }))
    }
  }

  const handleLoginClose = () => {
    setAuthOpen(false)
    void initAuth()
  }

  const handleLogout = async () => {
    await logout()
    message.success(t('profile.signedOut', { defaultValue: 'Signed out' }))
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
              <h2>{session ? displayName : t('sidebar.guest')}</h2>
              <Tag color={session ? 'success' : 'default'}>{session ? t('sidebar.signedIn') : t('profile.guestMode', { defaultValue: 'Guest mode' })}</Tag>
            </div>
            <p>
              {session
                ? t('profile.signedInDescription', { defaultValue: 'Your profile is used for sync, feedback, and invitations.' })
                : t('profile.guestDescription', { defaultValue: 'Sign in to sync shortcuts, categories, Dock, settings, and themes.' })}
            </p>
            <div className={cn(styles.actions)}>
              {session ? (
                <>
                  <Button loading={isAuthLoading} onClick={() => avatarInputRef.current?.click()}>
                    {t('sidebar.changeAvatar')}
                  </Button>
                  <Button
                    className={styles.logoutBtn}
                    icon={<LogoutOutlined />}
                    danger
                    onClick={() => void handleLogout()}
                  >
                    {t('sidebar.logout')}
                  </Button>
                </>
              ) : (
                <Button type='primary' icon={<LoginOutlined />} onClick={() => setAuthOpen(true)}>
                  {t('sidebar.loginRegister')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title={t('profile.basicInfo', { defaultValue: 'Basic information' })} className='dtSettingsCard' variant='borderless'>
        <Descriptions
          column={1}
          styles={{
            label: { whiteSpace: 'nowrap' }
          }}
        >
          <Descriptions.Item label={t('profile.nickname', { defaultValue: 'Nickname' })}>{getDisplayValue(user?.nickname)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.username', { defaultValue: 'Username' })}>{getDisplayValue(user?.username)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.identifier', { defaultValue: 'Account identifier' })}>{getDisplayValue(user?.userIdentifier)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.userId', { defaultValue: 'User ID' })}>{getDisplayValue(accountId)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.email', { defaultValue: 'Email' })}>{getDisplayValue(user?.email)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.phone', { defaultValue: 'Phone' })}>{getDisplayValue(user?.mobile)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.identityType', { defaultValue: 'Identity type' })}>{getDisplayValue(user?.identityType)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.status', { defaultValue: 'Account status' })}>{getDisplayValue(user?.status)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('profile.syncFeatures', { defaultValue: 'Synced data' })} className='dtSettingsCard' variant='borderless'>
        <div className={cn(styles.syncList)}>
          <span>{t('profile.homeIcons', { defaultValue: 'Home icons' })}</span>
          <span>{t('profile.categories', { defaultValue: 'Categories' })}</span>
          <span>Dock</span>
          <span>{t('common.settings')}</span>
          <span>{t('sidebar.theme')}</span>
          <span>{t('sidebar.profile')}</span>
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

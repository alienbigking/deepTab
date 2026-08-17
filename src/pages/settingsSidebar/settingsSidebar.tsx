import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { App, Button, Drawer, Avatar, Badge, Dropdown } from 'antd'
import SimpleBar from 'simplebar-react'
import {
  UserOutlined,
  CrownOutlined,
  GiftOutlined,
  SettingOutlined,
  BgColorsOutlined,
  SkinOutlined,
  SearchOutlined,
  BellOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  MessageOutlined,
  ReloadOutlined,
  CloudSyncOutlined,
  AppstoreAddOutlined,
  SmileOutlined
} from '@ant-design/icons'
import styles from './settingsSidebar.module.less'
import Subscription from '@/pages/subscription/subscription'
import Invitation from '@/pages/invitation/invitation'
import GeneralSettings from '@/pages/generalSettings/generalSettings'
import Wallpaper from '@/pages/wallpaper/wallpaper'
import Theme from '@/pages/theme/theme'
import SearchEngine from '@/pages/searchEngine/searchEngine'
import Notification from '@/pages/notification/notification'
import About from '@/pages/about/about'
import RelatedApps from '@/pages/relatedApps/relatedApps'
import Feedback from '@/pages/feedback/feedback'
import ResetSettings from '@/pages/resetSettings/resetSettings'
import BackupRestore from '@/pages/backupRestore/backupRestore'
import IconControl from '@/pages/iconControl/iconControl'
import AuthModal from '@/pages/auth/authModal'
import useAuthStore from '@/pages/auth/stores/auth'
import LegalModal from '@/pages/legal/legalModal'
import type { LegalDocumentType } from '@/pages/legal/legalDocuments'
import Profile from '@/pages/profile/profile'
import { useTranslation } from 'react-i18next'
import DesktopPetSettings from '@/pages/desktopPet/DesktopPetSettings'

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
  openToMenu?: string
}

type MenuKey =
  | 'profile'
  | 'subscription'
  | 'invitation'
  | 'settings'
  | 'wallpaper'
  | 'theme'
  | 'search'
  | 'notification'
  | 'about'
  | 'apps'
  | 'feedback'
  | 'reset'
  | 'backup'
  | 'iconControl'
  | 'pet'

/**
 * 设置侧边栏组件
 * 完整的设置面板，包含多个功能模块
 */
const SettingsSidebar: React.FC<SettingsSidebarProps> = (props) => {
  const { open = false, onClose, openToMenu } = props
  const { message } = App.useApp()
  const { t, i18n } = useTranslation()
  const [activeMenu, setActiveMenu] = useState<MenuKey>('wallpaper')
  const [authOpen, setAuthOpen] = useState(false)
  const [legalType, setLegalType] = useState<LegalDocumentType | null>(null)
  const session = useAuthStore((s) => s.session)
  const initAuth = useAuthStore((s) => s.init)
  const logout = useAuthStore((s) => s.logout)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const user = session?.user
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const userName = user?.nickname || user?.username || user?.userIdentifier || t('sidebar.user')
  const userSubText = user?.email || user?.mobile || user?.userIdentifier || t('sidebar.signedIn')

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return
    try {
      await uploadAvatar(file)
      message.success(t('sidebar.avatarUpdated', { defaultValue: 'Avatar updated' }))
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error(t('sidebar.avatarFailed', { defaultValue: 'Could not upload the avatar' }))
    }
  }

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!open) return
    if (!openToMenu) return

    const keys = new Set<MenuKey>([
      'profile',
      'subscription',
      'invitation',
      'settings',
      'wallpaper',
      'theme',
      'search',
      'notification',
      'about',
      'apps',
      'feedback',
      'reset',
      'backup',
      'iconControl',
      'pet'
    ])

    if (keys.has(openToMenu as MenuKey)) {
      setActiveMenu(openToMenu as MenuKey)
    }
  }, [open, openToMenu])

  // 菜单项
  const menuItems = [
    { key: 'profile', icon: <UserOutlined />, label: t('sidebar.profile') },
    {
      key: 'subscription',
      icon: <CrownOutlined />,
      label: t('sidebar.subscription'),
      badge: 'FREE'
    },
    { key: 'invitation', icon: <GiftOutlined />, label: t('sidebar.invitation') },
    { key: 'settings', icon: <SettingOutlined />, label: t('sidebar.general') },
    { key: 'wallpaper', icon: <BgColorsOutlined />, label: t('sidebar.wallpaper') },
    { key: 'theme', icon: <SkinOutlined />, label: t('sidebar.theme') },
    { key: 'search', icon: <SearchOutlined />, label: t('sidebar.searchEngine') },
    { key: 'notification', icon: <BellOutlined />, label: t('sidebar.notification') },
    { key: 'reset', icon: <ReloadOutlined />, label: t('sidebar.reset') },
    { key: 'backup', icon: <CloudSyncOutlined />, label: t('sidebar.backup') },
    { key: 'iconControl', icon: <AppstoreAddOutlined />, label: t('sidebar.iconControl') },
    { key: 'pet', icon: <SmileOutlined />, label: t('pet.title', { defaultValue: 'Desktop pet' }) },
    { key: 'about', icon: <InfoCircleOutlined />, label: t('sidebar.about') },
    { key: 'apps', icon: <AppstoreOutlined />, label: t('sidebar.relatedApps') },
    { key: 'feedback', icon: <MessageOutlined />, label: t('sidebar.feedback') }
  ]

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile':
        return <Profile />
      case 'subscription':
        return <Subscription />
      case 'invitation':
        return <Invitation />
      case 'settings':
        return <GeneralSettings />
      case 'wallpaper':
        return <Wallpaper />
      case 'theme':
        return <Theme />
      case 'search':
        return <SearchEngine />
      case 'notification':
        return <Notification />
      case 'reset':
        return <ResetSettings />
      case 'backup':
        return <BackupRestore />
      case 'iconControl':
        return <IconControl />
      case 'pet':
        return <DesktopPetSettings />
      case 'about':
        return <About />
      case 'apps':
        return <RelatedApps />
      case 'feedback':
        return <Feedback />
      default:
        return (
          <div className={styles.placeholderContent}>
            <p>{t('sidebar.developing', { defaultValue: 'Coming soon...' })}</p>
          </div>
        )
    }
  }

  return (
    <Drawer
      placement={i18n.dir() === 'rtl' ? 'right' : 'left'}
      onClose={onClose}
      open={open}
      width={1000}
      zIndex={1600}
      rootClassName={cn(styles.settingsDrawer)}
      closable={false}
      styles={{
        body: { padding: 0 }
      }}
    >
      <div className={cn(styles.sidebarLayout)}>
        {/* 左侧菜单 */}
        <div className={cn(styles.leftMenu)}>
          {/* 用户信息 */}
          <div className={cn(styles.userInfo)}>
            {session ? (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'avatar',
                      label: isAuthLoading ? t('sidebar.uploading') : t('sidebar.changeAvatar')
                    },
                    { key: 'logout', label: t('sidebar.logout') }
                  ],
                  onClick: async ({ key }) => {
                    if (key === 'avatar') {
                      avatarInputRef.current?.click()
                    }
                    if (key === 'logout') {
                      await logout()
                    }
                  }
                }}
              >
                <div className={cn(styles.userProfile)}>
                  <Avatar size={48} src={user?.avatar} icon={<UserOutlined />} />
                  <span className={cn(styles.userName)}>{userName}</span>
                  <span className={cn(styles.userEmail)}>{userSubText}</span>
                </div>
              </Dropdown>
            ) : (
              <div className={cn(styles.userProfile)}>
                <Avatar size={48} icon={<UserOutlined />} />
                <span className={cn(styles.userName)}>{t('sidebar.guest')}</span>
                <Button type='primary' size='small' onClick={() => setAuthOpen(true)}>
                  {t('sidebar.loginRegister')}
                </Button>
              </div>
            )}
          </div>

          {/* 菜单列表 */}
          <SimpleBar className={cn(styles.menuList, 'dtPrettyScrollbar')} autoHide>
            <div className={styles.menuListInner}>
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className={cn(styles.menuItem, { [styles.active]: activeMenu === item.key })}
                  onClick={() => setActiveMenu(item.key as MenuKey)}
                >
                  <span className={cn(styles.menuIcon)}>{item.icon}</span>
                  <span className={cn(styles.menuLabel)}>{item.label}</span>
                  {item.badge && <Badge count={item.badge} className={cn(styles.menuBadge)} />}
                </div>
              ))}
            </div>
          </SimpleBar>

          {/* 底部信息 */}
          <div className={cn(styles.bottomInfo)}>
            <div className={cn(styles.version)}>V2.2.22</div>
            <div className={cn(styles.links)}>
              <button type='button' onClick={() => setLegalType('terms')}>
                {t('sidebar.terms')}
              </button>
              <button type='button' onClick={() => setLegalType('privacy')}>
                {t('sidebar.privacy')}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧内容 */}
        <SimpleBar className={cn(styles.rightContent, 'dtPrettyScrollbar')} autoHide>
          <div className={styles.rightContentInner}>{renderContent()}</div>
        </SimpleBar>
      </div>
      <input
        ref={avatarInputRef}
        type='file'
        accept='image/*'
        className={styles.avatarInput}
        onChange={handleAvatarChange}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <LegalModal
        open={Boolean(legalType)}
        type={legalType || 'terms'}
        onClose={() => setLegalType(null)}
      />
    </Drawer>
  )
}

export default SettingsSidebar

import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { App, Button, Drawer, Avatar, Badge, Dropdown } from 'antd'
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
  AppstoreAddOutlined
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

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
  openToMenu?: string
}

type MenuKey =
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

/**
 * 设置侧边栏组件
 * 完整的设置面板，包含多个功能模块
 */
const SettingsSidebar: React.FC<SettingsSidebarProps> = (props) => {
  const { open = false, onClose, openToMenu } = props
  const { message } = App.useApp()
  const [activeMenu, setActiveMenu] = useState<MenuKey>('wallpaper')
  const [authOpen, setAuthOpen] = useState(false)
  const session = useAuthStore((s) => s.session)
  const initAuth = useAuthStore((s) => s.init)
  const logout = useAuthStore((s) => s.logout)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const user = session?.user
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const userName = user?.nickname || user?.username || user?.userIdentifier || 'Deep Tab 用户'
  const userSubText = user?.email || user?.mobile || user?.userIdentifier || '已登录'

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return
    try {
      await uploadAvatar(file)
      message.success('头像已更新')
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error('头像上传失败，请稍后再试')
    }
  }

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!open) return
    if (!openToMenu) return

    const keys = new Set<MenuKey>([
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
      'iconControl'
    ])

    if (keys.has(openToMenu as MenuKey)) {
      setActiveMenu(openToMenu as MenuKey)
    }
  }, [open, openToMenu])

  // 菜单项
  const menuItems = [
    { key: 'subscription', icon: <CrownOutlined />, label: '订阅管理', badge: 'FREE' },
    { key: 'invitation', icon: <GiftOutlined />, label: '我的邀请' },
    { key: 'settings', icon: <SettingOutlined />, label: '常规设置' },
    { key: 'wallpaper', icon: <BgColorsOutlined />, label: '壁纸' },
    { key: 'theme', icon: <SkinOutlined />, label: '主题切换' },
    { key: 'search', icon: <SearchOutlined />, label: '搜索引擎' },
    { key: 'notification', icon: <BellOutlined />, label: '消息通知' },
    { key: 'reset', icon: <ReloadOutlined />, label: '重置设置' },
    { key: 'backup', icon: <CloudSyncOutlined />, label: '备份与恢复' },
    { key: 'iconControl', icon: <AppstoreAddOutlined />, label: '图标控制' },
    { key: 'about', icon: <InfoCircleOutlined />, label: '关于我们' },
    { key: 'apps', icon: <AppstoreOutlined />, label: '相关应用' },
    { key: 'feedback', icon: <MessageOutlined />, label: '投诉与反馈' }
  ]

  const renderContent = () => {
    switch (activeMenu) {
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
      case 'about':
        return <About />
      case 'apps':
        return <RelatedApps />
      case 'feedback':
        return <Feedback />
      default:
        return (
          <div className={styles.placeholderContent}>
            <p>功能开发中...</p>
          </div>
        )
    }
  }

  return (
    <Drawer
      placement='left'
      onClose={onClose}
      open={open}
      width={1000}
      rootClassName={cn(styles.settingsDrawer)}
      closable={false}
      styles={{
        body: { padding: 0 }
      }}
      getContainer={false}
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
                    { key: 'avatar', label: isAuthLoading ? '上传中...' : '更换头像' },
                    { key: 'logout', label: '退出登录' }
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
                <span className={cn(styles.userName)}>未登录</span>
                <Button type='primary' size='small' onClick={() => setAuthOpen(true)}>
                  登录 / 注册
                </Button>
              </div>
            )}
          </div>

          {/* 菜单列表 */}
          <div className={cn(styles.menuList)}>
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

          {/* 底部信息 */}
          <div className={cn(styles.bottomInfo)}>
            <div className={cn(styles.version)}>V2.2.22</div>
            <div className={cn(styles.links)}>
              <span>用户协议</span>
              <span>隐私政策</span>
            </div>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className={cn(styles.rightContent)}>{renderContent()}</div>
      </div>
      <input
        ref={avatarInputRef}
        type='file'
        accept='image/*'
        className={styles.avatarInput}
        onChange={handleAvatarChange}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </Drawer>
  )
}

export default SettingsSidebar

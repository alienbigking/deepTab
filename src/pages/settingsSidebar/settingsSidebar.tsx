import React, { useState } from 'react'
import cn from 'classnames'
import { Drawer, Avatar, Badge } from 'antd'
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
  MessageOutlined
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

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
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

/**
 * 设置侧边栏组件
 * 完整的设置面板，包含多个功能模块
 */
const SettingsSidebar: React.FC<SettingsSidebarProps> = (props) => {
  const { open = false, onClose } = props
  const [activeMenu, setActiveMenu] = useState<MenuKey>('wallpaper')

  // 菜单项
  const menuItems = [
    { key: 'subscription', icon: <CrownOutlined />, label: '订阅管理', badge: 'FREE' },
    { key: 'invitation', icon: <GiftOutlined />, label: '我的邀请' },
    { key: 'settings', icon: <SettingOutlined />, label: '常规设置' },
    { key: 'wallpaper', icon: <BgColorsOutlined />, label: '壁纸' },
    { key: 'theme', icon: <SkinOutlined />, label: '主题切换' },
    { key: 'search', icon: <SearchOutlined />, label: '搜索引擎' },
    { key: 'notification', icon: <BellOutlined />, label: '消息通知' },
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
      className={cn(styles.settingsDrawer)}
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
            <Avatar size={48} icon={<UserOutlined />} />
            <span className={cn(styles.userEmail)}>1260213657@qq.com</span>
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
    </Drawer>
  )
}

export default SettingsSidebar

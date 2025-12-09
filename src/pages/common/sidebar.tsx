import React from 'react'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  MailOutlined,
  DashboardOutlined,
  HistoryOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import styles from './sidebar.module.less'
import cn from 'classnames'

const { Sider } = Layout

export type MenuKey = 'home' | 'notifications' | 'dashboard' | 'history' | 'settings' | 'about'

interface SidebarProps {
  selectedKey: MenuKey
  onChange: (key: MenuKey) => void
}

const Sidebar: React.FC<SidebarProps> = ({ selectedKey, onChange }) => {
  return (
    <Sider className={cn([styles.sidebar])} width={64} theme='light' style={{ borderRight: '1px solid #f0f0f0' }}>
      <Menu
        mode='inline'
        selectedKeys={[selectedKey]}
        onClick={(info) => onChange(info.key as MenuKey)}
        style={{ height: '100%', borderRight: 0 }}
      >
        <Menu.Item key='home' icon={<HomeOutlined />}></Menu.Item>
        <Menu.Item key='notifications' icon={<MailOutlined />}></Menu.Item>
        <Menu.Item key='dashboard' icon={<DashboardOutlined />}></Menu.Item>
        <Menu.Item key='history' icon={<HistoryOutlined />}></Menu.Item>
        <Menu.Item key='settings' icon={<SettingOutlined />}></Menu.Item>
        <Menu.Item key='about' icon={<InfoCircleOutlined />}></Menu.Item>
      </Menu>
    </Sider>
  )
}

export default Sidebar

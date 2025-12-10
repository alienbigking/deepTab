import React, { useEffect } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  FolderOpenOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import cn from 'classnames'
import styles from './appGrid.module.less'

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  onOpenCurrent: () => void
  onOpenNew: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = (props) => {
  const {
    visible = false,
    x = 0,
    y = 0,
    onOpenCurrent,
    onOpenNew,
    onEdit,
    onDelete,
    onClose
  } = props

  // 点击外部关闭菜单
  useEffect(() => {
    if (visible) {
      const handleClick = () => onClose()
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [visible, onClose])

  // ESC 键关闭菜单
  useEffect(() => {
    if (visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose])

  const menuItems: MenuProps['items'] = [
    {
      key: 'open-current',
      label: '在当前标签页打开',
      icon: <FolderOpenOutlined />
    },
    {
      key: 'open-new',
      label: '在新标签页打开',
      icon: <FolderAddOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true
    }
  ]

  // 处理菜单点击事件
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    console.log('触发了菜单项, key:', key)
    switch (key) {
      case 'open-current':
        console.log('执行: 在当前标签页打开')
        onOpenCurrent()
        break
      case 'open-new':
        console.log('执行: 在新标签页打开')
        onOpenNew()
        break
      case 'edit':
        console.log('执行: 编辑')
        onEdit()
        break
      case 'delete':
        console.log('执行: 删除')
        onDelete()
        break
    }
  }

  if (!visible) {
    console.log('ContextMenu: visible = false, 不渲染')
    return null
  }

  console.log('ContextMenu 渲染:', { visible, x, y, menuItemsCount: menuItems.length })

  return (
    <div
      className={cn(styles.contextMenuWrapper)}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000
      }}
    >
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        open={true}
        trigger={['click']}
        placement='bottomLeft'
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      >
        <div style={{ width: 1, height: 1, cursor: 'pointer' }} />
      </Dropdown>
    </div>
  )
}

export default ContextMenu

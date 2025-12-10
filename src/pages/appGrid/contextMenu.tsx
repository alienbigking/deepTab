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
      icon: <FolderOpenOutlined />,
      onClick: onOpenCurrent
    },
    {
      key: 'open-new',
      label: '在新标签页打开',
      icon: <FolderAddOutlined />,
      onClick: onOpenNew
    },
    {
      type: 'divider'
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: onEdit
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: onDelete
    }
  ]

  if (!visible) return null

  return (
    <div
      className={cn(styles.contextMenuWrapper)}
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Dropdown
        menu={{ items: menuItems }}
        open={true}
        trigger={['click']}
        getPopupContainer={(node) => node.parentElement || document.body}
      >
        <div className={styles.contextMenuTrigger} />
      </Dropdown>
    </div>
  )
}

export default ContextMenu

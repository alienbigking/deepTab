import React, { useEffect } from 'react'
import { Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  FolderOpenOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined
} from '@ant-design/icons'
import cn from 'classnames'
import styles from './contextMenu.module.less'
import type { AppNode, AppItem, AppFolder } from './types/appGrid'

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  nodeType: 'item' | 'folder' | 'blank'
  onOpenCurrent: () => void
  onOpenNew: () => void
  onEdit: () => void
  onDelete: () => void
  onCreateFolder: (name: string) => void
  onMoveToFolder?: (targetFolderId: string) => void
  onClose: () => void
  allFolders?: AppFolder[] // 用于"移动到文件夹"子菜单
  onCreateFolderRequested?: () => void // 新增：请求创建文件夹
}

const ContextMenu: React.FC<ContextMenuProps> = (props) => {
  const {
    visible = false,
    x = 0,
    y = 0,
    nodeType,
    onOpenCurrent,
    onOpenNew,
    onEdit,
    onDelete,
    onCreateFolder,
    onMoveToFolder,
    onClose,
    allFolders = [],
    onCreateFolderRequested
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

  // 动态生成菜单项
  const menuItems: MenuProps['items'] = React.useMemo(() => {
    const items: MenuProps['items'] = []

    // 如果是普通图标，显示打开选项
    if (nodeType === 'item') {
      items.push(
        {
          key: 'open-current',
          label: '在当前标签页打开',
          icon: <FolderOpenOutlined />
        },
        {
          key: 'open-new',
          label: '在新标签页打开',
          icon: <FolderAddOutlined />
        }
      )
    }

    // 分隔线
    items.push({ type: 'divider' })

    // 创建文件夹（只在空白区域显示）
    if (nodeType === 'blank') {
      items.push({
        key: 'create-folder',
        label: '创建文件夹',
        icon: <PlusOutlined />
      })
    }

    // 如果是普通图标，显示"移动到文件夹"子菜单
    if (nodeType === 'item' && allFolders.length > 0) {
      items.push({
        key: 'move-to-folder',
        label: '移动到文件夹',
        icon: <FolderOutlined />,
        children: allFolders.map((folder) => ({
          key: `move-to-${folder.id}`,
          label: folder.name,
          onClick: () => onMoveToFolder?.(folder.id)
        }))
      })
    }

    // 编辑选项（只对图标和文件夹显示）
    if (nodeType === 'item' || nodeType === 'folder') {
      items.push(
        {
          key: 'edit',
          label: nodeType === 'folder' ? '重命名/封面' : '编辑',
          icon: <EditOutlined />
        },
        {
          key: 'delete',
          label: nodeType === 'folder' ? '删除文件夹' : '删除',
          icon: <DeleteOutlined />,
          danger: true
        }
      )
    }

    return items
  }, [nodeType, allFolders, onMoveToFolder])

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
      case 'create-folder':
        console.log('执行: 创建文件夹')
        onCreateFolderRequested?.()
        break
      case 'edit':
        console.log('执行: 编辑')
        onEdit()
        break
      case 'delete':
        console.log('执行: 删除')
        onDelete()
        break
      default:
        // 移动到文件夹的子菜单项已在 children 中处理
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

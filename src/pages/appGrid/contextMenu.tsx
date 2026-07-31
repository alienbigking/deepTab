import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  FolderOpenOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreAddOutlined,
  FolderOutlined,
  DownloadOutlined,
  BgColorsOutlined,
  LayoutOutlined
} from '@ant-design/icons'
import cn from 'classnames'
import styles from './contextMenu.module.less'
import type { AppFolder } from './types/appGrid'
import { useTranslation } from 'react-i18next'

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  nodeType: 'item' | 'folder' | 'widget' | 'blank'
  onOpenCurrent: () => void
  onOpenNew: () => void
  onEdit: () => void
  onDelete: () => void
  onCreateFolder: (name: string) => void
  onMoveToFolder?: (targetFolderId: string) => void
  onClose: () => void
  allFolders?: AppFolder[] // 用于"移动到文件夹"子菜单
  onCreateFolderRequested?: () => void // 新增：请求创建文件夹
  onAddAppRequested?: () => void
  onDownloadWallpaper?: () => void
  onRandomWallpaper?: () => void
  onEditHome?: () => void
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
    onCreateFolderRequested,
    onAddAppRequested,
    onDownloadWallpaper,
    onRandomWallpaper,
    onEditHome
  } = props
  const { t } = useTranslation()
  const menuWidth = 220
  const menuHeight = nodeType === 'blank' ? 268 : nodeType === 'item' ? 236 : 128
  const menuX = Math.min(Math.max(x + 8, 8), window.innerWidth - menuWidth - 8)
  const menuY = Math.min(Math.max(y + 8, 8), window.innerHeight - menuHeight - 8)

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
          label: t('context.openCurrent', { defaultValue: 'Open in current tab' }),
          icon: <FolderOpenOutlined />
        },
        {
          key: 'open-new',
          label: t('context.openNew', { defaultValue: 'Open in new tab' }),
          icon: <FolderAddOutlined />
        }
      )
    }

    if (items.length) {
      items.push({ type: 'divider' })
    }

    // 创建文件夹（只在空白区域显示）
    if (nodeType === 'blank') {
      items.push(
        {
          key: 'add-app',
          label: t('context.addApp', { defaultValue: 'Add app' }),
          icon: <AppstoreAddOutlined />
        },
        {
          key: 'create-folder',
          label: t('context.createFolder', { defaultValue: 'Create folder' }),
          icon: <PlusOutlined />
        },
        { type: 'divider' },
        {
          key: 'download-wallpaper',
          label: t('context.downloadWallpaper', { defaultValue: 'Download current wallpaper' }),
          icon: <DownloadOutlined />
        },
        {
          key: 'random-wallpaper',
          label: t('context.randomWallpaper', { defaultValue: 'Random wallpaper' }),
          icon: <BgColorsOutlined />
        },
        {
          key: 'edit-home',
          label: t('context.editHome', { defaultValue: 'Edit home page' }),
          icon: <LayoutOutlined />
        }
      )
    }

    // 如果是普通图标，显示"移动到文件夹"子菜单
    if (nodeType === 'item' && allFolders.length > 0) {
      items.push({
        key: 'move-to-folder',
        label: t('context.moveToFolder', { defaultValue: 'Move to folder' }),
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
          label: nodeType === 'folder' ? t('context.renameFolder', { defaultValue: 'Rename / cover' }) : t('common.edit'),
          icon: <EditOutlined />
        },
        {
          key: 'delete',
          label: nodeType === 'folder' ? t('context.deleteFolder', { defaultValue: 'Delete folder' }) : t('common.delete'),
          icon: <DeleteOutlined />,
          danger: true
        }
      )
    }

    if (nodeType === 'widget') {
      items.push({
        key: 'delete',
        label: t('context.removeWidget', { defaultValue: 'Remove widget' }),
        icon: <DeleteOutlined />,
        danger: true
      })
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
      case 'add-app':
        console.log('执行: 添加应用')
        onAddAppRequested?.()
        break
      case 'download-wallpaper':
        onDownloadWallpaper?.()
        break
      case 'random-wallpaper':
        onRandomWallpaper?.()
        break
      case 'edit-home':
        onEditHome?.()
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

  if (!visible) return null

  return createPortal(
    <div
      className={cn(styles.contextMenuWrapper)}
      style={{
        position: 'fixed',
        left: `${menuX}px`,
        top: `${menuY}px`,
        zIndex: 1200
      }}
    >
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        open={true}
        trigger={['click']}
        placement='bottomLeft'
        transitionName=''
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      >
        <div style={{ width: 1, height: 1, cursor: 'pointer' }} />
      </Dropdown>
    </div>,
    document.body
  )
}

export default ContextMenu

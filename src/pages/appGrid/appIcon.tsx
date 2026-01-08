import React, { useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CloseCircleFilled, FolderFilled } from '@ant-design/icons'
import cn from 'classnames'
import styles from './appGrid.module.less'
import type { AppNode, AppItem, AppFolder, IconSettings } from './types/appGrid'

interface AppIconProps {
  node: AppNode
  isEditMode: boolean
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string, nodeType: 'item' | 'folder') => void
  onLongPress: () => void
  onFolderClick?: (folder: AppFolder) => void // 点击文件夹打开弹层
  disableDrag?: boolean // 禁用拖拽（当被 DroppableIcon 包装时）
}

/**
 * 单个应用图标组件（支持文件夹）
 * 支持拖拽、长按进入编辑模式、右键菜单、文件夹点击打开
 */
const AppIcon: React.FC<AppIconProps> = (props) => {
  const {
    node,
    isEditMode = false,
    iconSettings,
    onDelete,
    onContextMenu,
    onLongPress,
    onFolderClick,
    disableDrag = false
  } = props

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  const isFolder = node.type === 'folder'
  const folder = isFolder ? (node as AppFolder) : null
  const item = !isFolder ? (node as AppItem) : null

  // 拖拽相关 - 只有在不禁用拖拽时才使用
  const sortable = useSortable({
    id: node.id,
    data: {
      container: 'grid',
      appId: node.id,
      nodeType: node.type
    },
    disabled: disableDrag
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  // 当禁用拖拽时，不应用 transform 样式
  const style: React.CSSProperties = disableDrag
    ? { pointerEvents: 'none' }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }

  const iconWrapperStyle: React.CSSProperties = {
    width: iconSettings.size,
    height: iconSettings.size,
    borderRadius: iconSettings.radius,
    opacity: iconSettings.opacity / 100
  }

  const appNameStyle: React.CSSProperties = {
    fontSize: iconSettings.fontSize,
    color: iconSettings.fontColor === 'light' ? '#ffffff' : 'rgba(0,0,0,0.85)'
  }

  // URL 规范化 - 确保 URL 以 http:// 或 https:// 开头
  const normalizeUrl = (url: string): string => {
    if (!url) return ''
    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`
    }
    return trimmedUrl
  }

  // 点击打开链接或文件夹
  const handleClick = (e: React.MouseEvent) => {
    // 编辑模式下不打开
    if (isEditMode) {
      e.preventDefault()
      return
    }

    // 如果是长按触发,不打开
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }

    if (isFolder && onFolderClick) {
      onFolderClick(folder!)
      return
    }

    if (!item) return

    try {
      const normalizedUrl = normalizeUrl(item.url)
      if (normalizedUrl) {
        chrome.tabs.create({ url: normalizedUrl, active: true })
      }
    } catch (error) {
      console.error('打开失败:', error)
    }
  }

  // 长按开始
  const handleMouseDown = () => {
    if (isEditMode) return

    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      onLongPress()
    }, 1000) // 1000ms (1秒) 长按触发
  }

  // 长按结束
  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu(e, node.id, node.type)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <div
      ref={disableDrag ? undefined : setNodeRef}
      style={style}
      className={cn(styles.appIcon, {
        [styles.editMode]: isEditMode,
        [styles.dragging]: isDragging && !disableDrag
      })}
      onClick={handleClick}
      onMouseDown={disableDrag ? undefined : handleMouseDown}
      onMouseUp={disableDrag ? undefined : handleMouseUp}
      onMouseLeave={disableDrag ? undefined : handleMouseUp}
      onContextMenu={handleContextMenu}
      {...(disableDrag ? {} : attributes)}
      {...(disableDrag || isFolder ? {} : listeners)}
    >
      {/* 删除按钮 - 直接触发父组件的删除确认逻辑 */}
      {isEditMode && (
        <div className={styles.deleteBtnWrapper}>
          <div
            className={styles.deleteBtn}
            onClick={(e) => {
              // 阻止冒泡,避免触发图标点击/拖拽
              e.stopPropagation()
              onDelete(node.id)
            }}
          >
            <CloseCircleFilled />
          </div>
        </div>
      )}

      {/* 图标 */}
      <div className={styles.iconWrapper} style={iconWrapperStyle}>
        {isFolder ? (
          <>
            {/* 文件夹封面 - 显示最多4个子图标 */}
            {folder && folder.children.length > 0 ? (
              <div className={styles.folderCover}>
                {folder.children.slice(0, 4).map((child, index) => (
                  <span key={child.id} className={styles.folderCoverIcon}>
                    {child.icon}
                  </span>
                ))}
              </div>
            ) : (
              <span className={styles.iconEmoji}>{folder?.icon || <FolderFilled />}</span>
            )}
            {/* 徽标计数 */}
            {folder && folder.children.length > 0 && (
              <div className={styles.folderBadge}>
                {folder.children.length > 99 ? '99+' : folder.children.length}
              </div>
            )}
          </>
        ) : (
          <span className={styles.iconEmoji}>{item?.icon}</span>
        )}
      </div>

      {/* 应用名称 */}
      <div className={styles.appName} style={appNameStyle}>
        {node.name}
      </div>
    </div>
  )
}

export default AppIcon

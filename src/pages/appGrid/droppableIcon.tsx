import React from 'react'
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CloseCircleFilled } from '@ant-design/icons'
import type { AppItem, IconSettings } from './types/appGrid'
import cn from 'classnames'
import styles from './appGrid.module.less'

interface DroppableIconProps {
  icon: AppItem
  isEditMode: boolean
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string, nodeType: 'item' | 'folder') => void
  onLongPress: () => void
}

// 禁用拖拽过程中的自动排序动画
const animateLayoutChanges = (args: Parameters<typeof defaultAnimateLayoutChanges>[0]) => {
  const { isSorting, wasDragging } = args
  // 只在拖拽结束后才进行动画
  if (isSorting || wasDragging) {
    return false
  }
  return defaultAnimateLayoutChanges(args)
}

const DroppableIcon: React.FC<DroppableIconProps> = ({
  icon,
  isEditMode,
  iconSettings,
  onDelete,
  onContextMenu,
  onLongPress
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: icon.id,
      data: {
        type: 'item',
        item: icon
      },
      animateLayoutChanges
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none'
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

  // URL 规范化
  const normalizeUrl = (url: string): string => {
    if (!url) return ''
    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`
    }
    return trimmedUrl
  }

  // 点击打开链接 - 只在非拖拽时触发
  const handleClick = (e: React.MouseEvent) => {
    // 如果正在拖拽或编辑模式，不打开链接
    if (isDragging || isEditMode) {
      return
    }
    try {
      const normalizedUrl = normalizeUrl(icon.url)
      if (normalizedUrl) {
        chrome.tabs.create({ url: normalizedUrl, active: true })
      }
    } catch (error) {
      console.error('打开失败:', error)
    }
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu(e, icon.id, 'item')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(styles.droppableIcon, styles.appIcon, {
        [styles.iconDropOver]: isOver && !isDragging,
        [styles.isDragging]: isDragging,
        [styles.editMode]: isEditMode
      })}
      onContextMenu={handleContextMenu}
      {...attributes}
      {...listeners}
    >
      {/* 删除按钮 */}
      {isEditMode && (
        <div className={styles.deleteBtnWrapper}>
          <div
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(icon.id)
            }}
          >
            <CloseCircleFilled />
          </div>
        </div>
      )}

      {/* 图标 - 点击打开链接 */}
      <div className={styles.iconWrapper} style={iconWrapperStyle} onClick={handleClick}>
        <span className={styles.iconEmoji}>{icon.icon}</span>
      </div>

      {/* 应用名称 */}
      <div className={styles.appName} style={appNameStyle} onClick={handleClick}>
        {icon.name}
      </div>
    </div>
  )
}

export default DroppableIcon

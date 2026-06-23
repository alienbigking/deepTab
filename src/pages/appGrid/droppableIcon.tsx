import React from 'react'
import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CloseCircleFilled } from '@ant-design/icons'
import type { AppItem, IconSettings } from './types/appGrid'
import cn from 'classnames'
import styles from './appGrid.module.less'
import { createFallbackIcon, isImageIconSource } from './iconFallback'

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges(args)

interface DroppableIconProps {
  icon: AppItem
  isEditMode: boolean
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string, nodeType: 'item' | 'folder') => void
  onLongPress: () => void
}

const DroppableIcon: React.FC<DroppableIconProps> = ({
  icon,
  isEditMode,
  iconSettings,
  onDelete,
  onContextMenu,
  onLongPress
}) => {
  const [iconLoadFailed, setIconLoadFailed] = React.useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: icon.id,
      animateLayoutChanges,
      data: {
        container: 'grid',
        appId: icon.id,
        type: 'item',
        item: icon
      }
    })

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
    opacity: isDragging ? 0.12 : 1,
    touchAction: 'none'
  }

  const iconWrapperStyle: React.CSSProperties = {
    width: iconSettings.size,
    height: iconSettings.size,
    borderRadius: iconSettings.radius,
    opacity: iconSettings.opacity / 100,
    background: isImageIconSource(icon.icon) ? undefined : icon.iconBg || undefined
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

  const hasImageIcon = isImageIconSource(icon.icon)
  const isImageIcon = hasImageIcon && !iconLoadFailed
  const fallbackIcon = createFallbackIcon(icon.name)

  return (
    <div
      ref={setNodeRef}
      data-app-grid-id={icon.id}
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
        <span className={styles.iconEmoji}>
          {isImageIcon ? (
            <img
              className={styles.iconImg}
              src={icon.icon}
              alt=''
              onError={() => setIconLoadFailed(true)}
            />
          ) : hasImageIcon ? (
            <img className={styles.iconImg} src={fallbackIcon} alt='' />
          ) : (
            icon.icon || <img className={styles.iconImg} src={fallbackIcon} alt='' />
          )}
        </span>
      </div>

      {/* 应用名称 */}
      <div className={styles.appName} style={appNameStyle} onClick={handleClick}>
        {icon.name}
      </div>
    </div>
  )
}

export default DroppableIcon

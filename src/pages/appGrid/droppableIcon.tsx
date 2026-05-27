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

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

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
        type: 'item',
        item: icon
      }
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
    opacity: isDragging ? 0 : 1,
    touchAction: 'none'
  }

  const iconWrapperStyle: React.CSSProperties = {
    width: iconSettings.size,
    height: iconSettings.size,
    borderRadius: iconSettings.radius,
    opacity: iconSettings.opacity / 100,
    background: /^(https?:\/\/|data:image\/)/i.test(icon.icon) ? undefined : icon.iconBg || undefined
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

  const hasImageIcon = /^(https?:\/\/|data:image\/)/i.test(icon.icon)
  const isImageIcon = hasImageIcon && !iconLoadFailed
  const iconTextFromName = () => {
    const text = String(icon.name || '').trim()
    const chinese = text.match(/[\u4e00-\u9fa5]/g)
    if (chinese?.length) return chinese.slice(0, 2).join('')
    const letters = text.replace(/[^a-z0-9]/gi, '').slice(0, 2)
    return (letters || text.slice(0, 2) || 'A').toUpperCase()
  }

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
          ) : (
            hasImageIcon ? iconTextFromName() : icon.icon || iconTextFromName()
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

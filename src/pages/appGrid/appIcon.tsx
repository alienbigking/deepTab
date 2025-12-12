import React, { useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CloseCircleFilled } from '@ant-design/icons'
import cn from 'classnames'
import styles from './appGrid.module.less'
import type { IconSettings } from './stores/appGrid'

interface AppIconProps {
  id: string
  name: string
  icon: string
  url: string
  isEditMode: boolean
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onLongPress: () => void
}

/**
 * 单个应用图标组件
 * 支持拖拽、长按进入编辑模式、右键菜单
 */
const AppIcon: React.FC<AppIconProps> = (props) => {
  const {
    id,
    name,
    icon,
    url,
    isEditMode = false,
    iconSettings,
    onDelete,
    onContextMenu,
    onLongPress
  } = props

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  // 拖拽相关
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  })

  const style = {
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

  // 点击打开链接
  const handleClick = (e: React.MouseEvent) => {
    // 编辑模式下不打开链接
    if (isEditMode) {
      e.preventDefault()
      return
    }

    // 如果是长按触发,不打开链接
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }

    try {
      const normalizedUrl = normalizeUrl(url)
      if (normalizedUrl) {
        // 使用 Chrome API 创建新标签页
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
    onContextMenu(e, id)
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
      ref={setNodeRef}
      style={style}
      className={cn(styles.appIcon, {
        [styles.editMode]: isEditMode,
        [styles.dragging]: isDragging
      })}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      {...attributes}
      {...listeners}
    >
      {/* 删除按钮 - 直接触发父组件的删除确认逻辑 */}
      {isEditMode && (
        <div className={styles.deleteBtnWrapper}>
          <div
            className={styles.deleteBtn}
            onClick={(e) => {
              // 阻止冒泡,避免触发图标点击/拖拽
              e.stopPropagation()
              onDelete(id)
            }}
          >
            <CloseCircleFilled />
          </div>
        </div>
      )}

      {/* 图标 */}
      <div className={styles.iconWrapper} style={iconWrapperStyle}>
        <span className={styles.iconEmoji}>{icon}</span>
      </div>

      {/* 应用名称 */}
      <div className={styles.appName} style={appNameStyle}>
        {name}
      </div>
    </div>
  )
}

export default AppIcon

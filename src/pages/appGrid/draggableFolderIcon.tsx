import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { AppItem, IconSettings } from './types/appGrid'
import cn from 'classnames'
import styles from './appGrid.module.less'
import { createFallbackIcon, isImageIconSource } from './iconFallback'

interface DraggableFolderIconProps {
  icon: AppItem
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent) => void
}

const DraggableFolderIcon: React.FC<DraggableFolderIconProps> = ({
  icon,
  iconSettings,
  onDelete,
  onContextMenu
}) => {
  const [iconLoadFailed, setIconLoadFailed] = React.useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: icon.id,
    data: {
      container: 'folder',
      appId: icon.id,
      type: 'folder-item',
      item: icon
    }
  })

  const iconWrapperStyle: React.CSSProperties = {
    width: iconSettings.size,
    height: iconSettings.size,
    borderRadius: iconSettings.radius,
    opacity: iconSettings.opacity / 100,
    background: icon.iconBg || 'var(--dt-app-icon-bg)',
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  const appNameStyle: React.CSSProperties = {
    fontSize: iconSettings.fontSize,
    color: iconSettings.fontColor === 'light' ? '#ffffff' : 'rgba(0,0,0,0.85)'
  }

  const hasImageIcon = isImageIconSource(icon.icon)
  const isImageIcon = hasImageIcon && !iconLoadFailed
  const fallbackIcon = createFallbackIcon(icon.name)

  return (
    <div
      ref={setNodeRef}
      className={cn(styles.draggableFolderIcon, {
        [styles.dragging]: isDragging
      })}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
      {...attributes}
      {...listeners}
    >
      <div className={styles.appIcon}>
        {/* 图标 */}
        <div className={styles.iconWrapper} style={iconWrapperStyle}>
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
        <div className={styles.appName} style={appNameStyle}>
          {icon.name}
        </div>
      </div>
    </div>
  )
}

export default DraggableFolderIcon

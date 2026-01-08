import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { AppItem, IconSettings } from './types/appGrid'
import cn from 'classnames'
import styles from './appGrid.module.less'

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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: icon.id,
    data: {
      type: 'folder-item',
      item: icon
    }
  })

  const iconWrapperStyle: React.CSSProperties = {
    width: iconSettings.size,
    height: iconSettings.size,
    borderRadius: iconSettings.radius,
    opacity: iconSettings.opacity / 100,
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  const appNameStyle: React.CSSProperties = {
    fontSize: iconSettings.fontSize,
    color: iconSettings.fontColor === 'light' ? '#ffffff' : 'rgba(0,0,0,0.85)'
  }

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
          <span className={styles.iconEmoji}>{icon.icon}</span>
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

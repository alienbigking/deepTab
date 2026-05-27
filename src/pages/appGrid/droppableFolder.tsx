import React, { useRef } from 'react'
import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AppFolder, IconSettings } from './types/appGrid'
import AppIcon from './appIcon'
import cn from 'classnames'
import styles from './appGrid.module.less'

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

interface DroppableFolderProps {
  folder: AppFolder
  isEditMode: boolean
  iconSettings: IconSettings
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string, nodeType: 'item' | 'folder') => void
  onLongPress: () => void
  onFolderClick?: (folder: AppFolder) => void // 点击文件夹打开弹层
}

const DroppableFolder: React.FC<DroppableFolderProps> = ({
  folder,
  isEditMode,
  iconSettings,
  onDelete,
  onContextMenu,
  onLongPress,
  onFolderClick
}) => {
  const isDraggingRef = useRef(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: folder.id,
      animateLayoutChanges,
      data: {
        type: 'folder',
        folder: folder
      }
    })

  // 更新拖拽状态
  if (isDragging !== isDraggingRef.current) {
    isDraggingRef.current = isDragging
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
    opacity: isDragging ? 0 : 1,
    touchAction: 'none'
  }

  // 点击处理 - 打开文件夹
  const handleClick = (e: React.MouseEvent) => {
    // 如果正在拖拽或编辑模式，不打开文件夹
    if (isDraggingRef.current || isEditMode) {
      return
    }
    if (onFolderClick) {
      onFolderClick(folder)
    }
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu(e, folder.id, 'folder')
  }

  return (
    <div
      ref={setNodeRef}
      data-app-grid-id={folder.id}
      style={style}
      className={cn(styles.droppableFolder, styles.appIcon, {
        [styles.folderDropOver]: isOver && !isDragging,
        [styles.isDragging]: isDragging,
        [styles.editMode]: isEditMode
      })}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      {...attributes}
      {...listeners}
    >
      <AppIcon
        node={folder}
        isEditMode={isEditMode}
        iconSettings={iconSettings}
        onDelete={onDelete}
        onContextMenu={onContextMenu}
        onLongPress={onLongPress}
        onFolderClick={onFolderClick}
        disableDrag={true}
      />
    </div>
  )
}

export default DroppableFolder

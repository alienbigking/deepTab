import React, { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cn from 'classnames'
import styles from './bottomBar.module.less'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import useBottomBarStore from './stores/bottomBar'
import bottomBarService from './services/bottomBar'
import { Dropdown } from 'antd'
import AddAppModal from '@/pages/appGrid/addAppModal'
import appGridService from '@/pages/appGrid/services/appGrid'
import type { AppNode, AppItem } from '@/pages/appGrid/types/appGrid'

interface BottomBarProps {
  activeCategoryId?: string
}

export const BOTTOM_BAR_DROPPABLE_ID = 'bottom-bar-dock'

const getDockSortableId = (appId: string) => {
  return `dock:${appId}`
}

const MAX_FALLBACK_ITEMS = 5

interface DockItemProps {
  app: AppItem
  onOpen: (url: string) => void
  onRemove: (id: string) => void
  onEdit: (app: AppItem) => void
}

const DockSortableItem: React.FC<DockItemProps> = (props) => {
  const { app, onOpen, onRemove, onEdit } = props

  // 只允许普通图标在底部栏，文件夹不支持
  if (app.type !== 'item') return null

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: getDockSortableId(app.id),
    data: {
      container: 'dock',
      appId: app.id
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  }

  const isImageIcon = (icon: string) => {
    return /^(https?:\/\/|data:image\/)/.test(icon)
  }

  return (
    <Dropdown
      trigger={['contextMenu']}
      menu={{
        items: [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => onEdit(app)
          },
          {
            key: 'remove',
            label: '从 Dock 移除',
            onClick: () => onRemove(app.id)
          }
        ]
      }}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(styles.dockItem, { [styles.dragging]: isDragging })}
        title={app.name}
        onClick={() => onOpen(app.url)}
        {...attributes}
        {...listeners}
      >
        {isImageIcon(app.icon) ? (
          <img className={cn(styles.iconImg)} src={app.icon} alt={app.name} />
        ) : (
          <span className={cn(styles.emoji)}>{app.icon}</span>
        )}
      </div>
    </Dropdown>
  )
}

const BottomBar: React.FC<BottomBarProps> = (props) => {
  const { activeCategoryId = 'home' } = props
  const apps = useAppGridStore((s) => s.apps)
  const setApps = useAppGridStore((s) => s.setApps)
  const pinnedAppIds = useBottomBarStore((s) => s.pinnedAppIds)
  const setPinnedAppIds = useBottomBarStore((s) => s.setPinnedAppIds)
  const [editOpen, setEditOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<AppItem | null>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: BOTTOM_BAR_DROPPABLE_ID,
    data: {
      container: 'dock'
    }
  })

  const pinnedApps = useMemo(() => {
    return pinnedAppIds
      .map((id) => apps.find((a) => a.id === id) || null)
      .filter(Boolean) as AppItem[]
  }, [apps, pinnedAppIds])

  const dockApps = useMemo(() => {
    return apps
      .filter((node): node is AppItem => node.type === 'item')
      .filter((app) => (app.categoryId || 'home') === activeCategoryId)
      .sort((a, b) => a.order - b.order)
      .slice(0, MAX_FALLBACK_ITEMS)
  }, [apps, activeCategoryId])

  const normalizeUrl = (url: string): string => {
    if (!url) return ''
    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`
    }
    return trimmedUrl
  }

  const openApp = (url: string) => {
    try {
      const normalizedUrl = normalizeUrl(url)
      if (!normalizedUrl) return
      chrome.tabs.create({ url: normalizedUrl, active: true })
    } catch (error) {
      console.error('打开失败:', error)
    }
  }

  const onRemove = async (id: string) => {
    const next = pinnedAppIds.filter((x) => x !== id)
    setPinnedAppIds(next)
    await bottomBarService.savePins(next)
  }

  const onEdit = (app: AppItem) => {
    setEditingApp(app)
    setEditOpen(true)
  }

  const fallbackApps = dockApps

  return (
    <div className={cn(styles.bottomBarWrap)}>
      <div ref={setNodeRef} className={cn(styles.dock, { [styles.dockOver]: isOver })}>
        {pinnedApps.length ? (
          <SortableContext
            items={pinnedApps.map((a) => getDockSortableId(a.id))}
            strategy={rectSortingStrategy}
          >
            {pinnedApps.map((app) => (
              <DockSortableItem
                key={app.id}
                app={app}
                onOpen={openApp}
                onRemove={onRemove}
                onEdit={onEdit}
              />
            ))}
          </SortableContext>
        ) : (
          fallbackApps.map((app) => (
            <div
              key={app.id}
              className={cn(styles.dockItem)}
              title={app.name}
              onClick={() => openApp(app.url)}
            >
              {/^(https?:\/\/|data:image\/)/.test(app.icon) ? (
                <img className={cn(styles.iconImg)} src={app.icon} alt={app.name} />
              ) : (
                <span className={cn(styles.emoji)}>{app.icon}</span>
              )}
            </div>
          ))
        )}
      </div>

      <AddAppModal
        open={editOpen}
        editingApp={editingApp}
        onClose={() => {
          setEditOpen(false)
          setEditingApp(null)
        }}
        onSuccess={async () => {
          const data = await appGridService.getList()
          setApps(data)
        }}
      />
    </div>
  )
}

export default BottomBar

import React, { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import cn from 'classnames'
import styles from './bottomBar.module.less'
import useAppGridStore from '@/pages/appGrid/stores/appGrid'
import useBottomBarStore from './stores/bottomBar'

interface BottomBarProps {
  activeCategoryId?: string
}

export const BOTTOM_BAR_DROPPABLE_ID = 'bottom-bar-dock'

const MAX_ITEMS = 5

const BottomBar: React.FC<BottomBarProps> = (props) => {
  const { activeCategoryId = 'home' } = props
  const apps = useAppGridStore((s) => s.apps)
  const pinnedAppIds = useBottomBarStore((s) => s.pinnedAppIds)

  const { setNodeRef, isOver } = useDroppable({
    id: BOTTOM_BAR_DROPPABLE_ID
  })

  const dockApps = useMemo(() => {
    const pinnedApps = pinnedAppIds
      .map((id) => apps.find((a) => a.id === id) || null)
      .filter(Boolean) as typeof apps

    if (pinnedApps.length) {
      return pinnedApps.slice(0, MAX_ITEMS)
    }

    const filtered = apps.filter((app) => (app.categoryId || 'home') === activeCategoryId)
    return filtered
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, MAX_ITEMS)
  }, [apps, activeCategoryId, pinnedAppIds])

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

  const isImageIcon = (icon: string) => {
    return /^(https?:\/\/|data:image\/)/.test(icon)
  }

  return (
    <div className={cn(styles.bottomBarWrap)}>
      <div ref={setNodeRef} className={cn(styles.dock, { [styles.dockOver]: isOver })}>
        {dockApps.map((app) => (
          <div
            key={app.id}
            className={cn(styles.dockItem)}
            title={app.name}
            onClick={() => openApp(app.url)}
          >
            {isImageIcon(app.icon) ? (
              <img className={cn(styles.iconImg)} src={app.icon} alt={app.name} />
            ) : (
              <span className={cn(styles.emoji)}>{app.icon}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BottomBar

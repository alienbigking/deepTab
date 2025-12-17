import React, { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import cn from 'classnames'
import styles from './main.module.less'
import SearchBar from './searchBar/searchBar'
import WidgetsContainer from './widgetsContainer/widgetsContainer'
import AppGrid from './appGrid/appGrid'
import SettingsSidebar from './settingsSidebar/settingsSidebar'
import { App } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import WallpaperBackground from './wallpaper/WallpaperBackground'
import generalSettingsService from './generalSettings/services/generalSettings'
import { defaultGeneralSettings } from './generalSettings/stores/generalSettings'
import { AppCategorySidebar } from './appCategory'
import useAppCategoryStore from './appCategory/stores/appCategory'
import BottomBar from './bottomBar/bottomBar'
import appGridService from './appGrid/services/appGrid'
import useAppGridStore from './appGrid/stores/appGrid'
import bottomBarService from './bottomBar/services/bottomBar'
import useBottomBarStore from './bottomBar/stores/bottomBar'
import { BOTTOM_BAR_DROPPABLE_ID } from './bottomBar/bottomBar'

/**
 * 新标签页主组件
 * 实现类似 macOS 风格的标签页界面
 */
const Main: React.FC = () => {
  const { message } = App.useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsMenu, setSettingsMenu] = useState<string | undefined>(undefined)
  const [showIcp, setShowIcp] = useState(defaultGeneralSettings.other.showIcp)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [appCategorySidebarVisible, setAppCategorySidebarVisible] = useState(
    defaultGeneralSettings.controlBar.sidebar !== 'alwaysHide'
  )
  const [appCategorySidebarPosition, setAppCategorySidebarPosition] = useState<'left' | 'right'>(
    defaultGeneralSettings.controlBar.sidebarPosition
  )
  const [bottomBarVisible, setBottomBarVisible] = useState(
    defaultGeneralSettings.controlBar.bottomBar !== 'alwaysHide'
  )
  const activeCategoryId = useAppCategoryStore((s) => s.activeCategoryId)
  const apps = useAppGridStore((s) => s.apps)
  const setApps = useAppGridStore((s) => s.setApps)
  const setPinnedAppIds = useBottomBarStore((s) => s.setPinnedAppIds)

  const draggingApp = useMemo(() => {
    if (!activeDragId) return null
    return apps.find((a) => a.id === activeDragId) || null
  }, [activeDragId, apps])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 页面加载时清空地址栏并聚焦
  useEffect(() => {
    // 使用 history.replaceState 清空地址栏显示
    window.history.replaceState({}, document.title, '/')

    // 确保窗口获得焦点
    window.focus()

    // 创建临时输入框触发地址栏聚焦
    const focusAddressBar = () => {
      const input = document.createElement('input')
      input.style.position = 'fixed'
      input.style.top = '-100px'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()

      // 失焦后浏览器会自动将焦点转移到地址栏
      setTimeout(() => {
        input.blur()
        document.body.removeChild(input)
      }, 10)
    }

    // 延迟执行,确保 DOM 完全加载
    const timer = setTimeout(focusAddressBar, 50)

    const onOpenSettings = (e: any) => {
      const menu = e?.detail?.menu
      if (typeof menu === 'string') {
        setSettingsMenu(menu)
      }
      setSettingsOpen(true)
    }

    window.addEventListener('dt:openSettings', onOpenSettings)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('dt:openSettings', onOpenSettings)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setShowIcp(Boolean(data.other.showIcp))
      setAppCategorySidebarVisible(data.controlBar.sidebar !== 'alwaysHide')
      setAppCategorySidebarPosition(data.controlBar.sidebarPosition)
      setBottomBarVisible(data.controlBar.bottomBar !== 'alwaysHide')
    }

    const loadPins = async () => {
      const ids = await bottomBarService.getPins()
      setPinnedAppIds(ids)
    }

    void load()
    void loadPins()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (changes?.generalSettings) {
        void load()
      }
      if (changes?.bottom_bar_pins) {
        void loadPins()
      }
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const onOpenSet = () => {
    console.log('触发了')
    setSettingsMenu(undefined)
    setSettingsOpen(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    const activeId = String(active.id)
    setActiveDragId(null)

    if (!over) return

    const overId = String(over.id)

    if (overId === BOTTOM_BAR_DROPPABLE_ID) {
      let nextPinned: string[] | null = null
      setPinnedAppIds((prev) => {
        if (prev.includes(activeId)) {
          nextPinned = null
          return prev
        }
        nextPinned = [...prev, activeId]
        return nextPinned
      })

      if (nextPinned) {
        try {
          await bottomBarService.savePins(nextPinned)
        } catch (error) {
          console.error('保存底部栏失败:', error)
          message.error('固定到底部栏失败，请重试')
        }
      }

      return
    }

    if (activeId === overId) return

    const visibleApps = apps.filter((app) => (app.categoryId || 'home') === activeCategoryId)
    const oldIndex = visibleApps.findIndex((app) => app.id === activeId)
    const newIndex = visibleApps.findIndex((app) => app.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const movedVisible = arrayMove(visibleApps, oldIndex, newIndex)

    const indices = apps
      .map((app, index) => ({ app, index }))
      .filter(({ app }) => (app.categoryId || 'home') === activeCategoryId)
      .map(({ index }) => index)

    const nextApps = [...apps]
    indices.forEach((idx, k) => {
      nextApps[idx] = movedVisible[k]
    })

    setApps(nextApps)

    try {
      await appGridService.updateOrder(nextApps)
    } catch (error) {
      console.error('保存顺序失败:', error)
      message.error('拖放失败，请重试！')
    }
  }

  return (
    <div className={cn(styles.container)}>
      <WallpaperBackground />
      <div className={cn(styles.content)}>
        {/* 设置按钮 */}
        <div className={cn(styles.settingsButton)} onClick={() => onOpenSet()}>
          <SettingOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>

        {/* 搜索框 */}
        <SearchBar />

        {/* 小部件区域 */}
        <WidgetsContainer />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={handleDragEnd}
        >
          {/* 应用图标网格 */}
          <AppGrid activeCategoryId={activeCategoryId} />

          {bottomBarVisible && <BottomBar activeCategoryId={activeCategoryId} />}

          <DragOverlay>
            {draggingApp ? (
              <div className={cn(styles.dragOverlayItem)}>
                {/^(https?:\/\/|data:image\/)/.test(draggingApp.icon) ? (
                  <img
                    className={cn(styles.dragOverlayImg)}
                    src={draggingApp.icon}
                    alt={draggingApp.name}
                  />
                ) : (
                  <span className={cn(styles.dragOverlayEmoji)}>{draggingApp.icon}</span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 设置侧边栏 */}
        <SettingsSidebar
          open={settingsOpen}
          openToMenu={settingsMenu}
          onClose={() => setSettingsOpen(false)}
        />

        {showIcp && (
          <div className={styles.icpFooter}>
            <a href='https://beian.miit.gov.cn/' target='_blank' rel='noreferrer'>
              湘ICP备2021011742号
            </a>
          </div>
        )}

        {appCategorySidebarVisible && <AppCategorySidebar position={appCategorySidebarPosition} />}
      </div>
    </div>
  )
}

export default Main

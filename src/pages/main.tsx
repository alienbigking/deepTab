import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import cn from 'classnames'
import styles from './main.module.less'
import SearchBar from './searchBar/searchBar'
import AppGrid, { GridDragOverlayContent } from './appGrid/appGrid'
import SettingsSidebar from './settingsSidebar/settingsSidebar'
import { App } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import WallpaperBackground from './wallpaper/WallpaperBackground'
import type { IWallpaperConfig } from './wallpaper/types/wallpaper'
import generalSettingsService from './generalSettings/services/generalSettings'
import { defaultGeneralSettings } from './generalSettings/stores/generalSettings'
import { AppCategorySidebar } from './appCategory'
import useAppCategoryStore from './appCategory/stores/appCategory'
import BottomBar from './bottomBar/bottomBar'
import SearchStyleModal from './generalSettings/searchStyleModal'
import appGridService from './appGrid/services/appGrid'
import useAppGridStore from './appGrid/stores/appGrid'
import bottomBarService from './bottomBar/services/bottomBar'
import useBottomBarStore from './bottomBar/stores/bottomBar'
import RemoteNotificationBridge from './notification/RemoteNotificationBridge'
import { BOTTOM_BAR_DROPPABLE_ID } from './bottomBar/bottomBar'
import { MAIN_GRID_DROPPABLE_ID } from './appGrid/appGrid'
import { isImageIconSource } from './appGrid/iconFallback'
import SyncConflictModal from './deepTabSync/SyncConflictModal'
import syncPresentationStyles from './deepTabSync/syncPresentation.module.less'
import { useTranslation } from 'react-i18next'

const pageCollisionDetection: CollisionDetection = (args) => {
  const isContainerId = (id: string | number) =>
    id === MAIN_GRID_DROPPABLE_ID || id === BOTTOM_BAR_DROPPABLE_ID

  const pointerCollisions = pointerWithin(args)
  const dockPointerCollision = pointerCollisions.find(
    (collision) => collision.id === BOTTOM_BAR_DROPPABLE_ID
  )
  if (dockPointerCollision) {
    return [dockPointerCollision]
  }

  const nonContainerDroppables = args.droppableContainers.filter(
    (container) => !isContainerId(container.id)
  )

  const pointerOnItems = pointerCollisions.filter((collision) => !isContainerId(collision.id))
  if (pointerOnItems.length > 0) {
    return pointerOnItems
  }

  const cornerOnItems = closestCorners({
    ...args,
    droppableContainers: nonContainerDroppables
  })
  if (cornerOnItems.length > 0) {
    return cornerOnItems
  }

  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }

  return closestCorners(args)
}

/**
 * 新标签页主组件
 * 实现类似 macOS 风格的标签页界面
 */
interface MainProps {
  initialWallpaperConfig?: IWallpaperConfig | null
}

const Main: React.FC<MainProps> = ({ initialWallpaperConfig }) => {
  const { message, notification } = App.useApp()
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsMenu, setSettingsMenu] = useState<string | undefined>(undefined)
  const [showIcp, setShowIcp] = useState(defaultGeneralSettings.other.showIcp)
  const [scrollSensitivity, setScrollSensitivity] = useState(
    defaultGeneralSettings.other.scrollSensitivity
  )
  const [useSystemFont, setUseSystemFont] = useState(defaultGeneralSettings.other.useSystemFont)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [searchStyleOpen, setSearchStyleOpen] = useState(false)
  const [searchStyleWidth, setSearchStyleWidth] = useState(
    defaultGeneralSettings.search.searchBarWidth
  )
  const [searchStyleOpacity, setSearchStyleOpacity] = useState(
    defaultGeneralSettings.search.searchBarOpacity
  )

  const applySearchStyleVars = (widthPercent: number, opacityPercent: number) => {
    try {
      document.documentElement.style.setProperty('--dt-search-width', `${String(widthPercent)}vw`)
      document.documentElement.style.setProperty(
        '--dt-search-opacity',
        String(opacityPercent / 100)
      )
    } catch (error) {
      console.error('设置搜索框样式变量失败:', error)
    }
  }

  const handlePageContextMenu = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (
      target?.closest('input, textarea, [contenteditable="true"], [role="textbox"]')
    ) {
      return
    }

    if (event.defaultPrevented) return

    event.preventDefault()

    window.dispatchEvent(
      new CustomEvent('dt:openAppGridBlankMenu', {
        detail: {
          x: event.clientX,
          y: event.clientY
        }
      })
    )
  }

  const handlePageClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    const isInteractiveTarget = target.closest(
      [
        'input',
        'textarea',
        'button',
        'a',
        '[contenteditable="true"]',
        '[role="button"]',
        '[role="textbox"]',
        '[data-app-grid-id]',
        '.ant-modal-root',
        '.ant-drawer',
        '.ant-dropdown',
        '.ant-popover',
        '.ant-select-dropdown'
      ].join(', ')
    )

    if (isInteractiveTarget) return

    window.dispatchEvent(new CustomEvent('dt:cancelAppGridEditMode'))
  }

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
  const categories = useAppCategoryStore((s) => s.categories)
  const initCategories = useAppCategoryStore((s) => s.init)
  const setActiveCategoryId = useAppCategoryStore((s) => s.setActiveCategoryId)
  const apps = useAppGridStore((s) => s.apps)
  const pinnedAppIds = useBottomBarStore((s) => s.pinnedAppIds)
  const setPinnedAppIds = useBottomBarStore((s) => s.setPinnedAppIds)

  const contentRef = useRef<HTMLDivElement | null>(null)
  const wheelAccRef = useRef(0)
  const wheelLockRef = useRef(false)
  const pageSwitchScrollLockUntilRef = useRef(0)
  const previousCategoryIdRef = useRef(activeCategoryId)
  const [homePageMotion, setHomePageMotion] = useState<{
    direction: 'next' | 'prev'
    tick: number
  }>({
    direction: 'next',
    tick: 0
  })

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

  const activeDockApp = useMemo(() => {
    if (!activeDragId) return null
    return apps.find((app) => app.id === activeDragId && app.type === 'item') || null
  }, [activeDragId, apps])

  // 页面加载时清空地址栏并聚焦
  useEffect(() => {
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

    const onOpenSearchStyle = async () => {
      try {
        const data = await generalSettingsService.getGeneralSettings()
        setSearchStyleWidth(data.search.searchBarWidth)
        setSearchStyleOpacity(data.search.searchBarOpacity)
        applySearchStyleVars(data.search.searchBarWidth, data.search.searchBarOpacity)
      } catch (error) {
        console.error('获取搜索框样式失败:', error)
      }

      setSettingsOpen(false)
      setSettingsMenu(undefined)
      setSearchStyleOpen(true)
    }

    window.addEventListener('dt:openSettings', onOpenSettings)
    window.addEventListener('dt:openSearchStyle', onOpenSearchStyle)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('dt:openSettings', onOpenSettings)
      window.removeEventListener('dt:openSearchStyle', onOpenSearchStyle)
    }
  }, [])

  useEffect(() => {
    const onAutoSyncSuccess = () => {
      notification.success({
        key: 'deepTab-auto-sync-success',
        message: t('sync.synced'),
        placement: 'topLeft',
        duration: 2.4,
        className: syncPresentationStyles.syncNotification
      })
    }

    window.addEventListener('dt:autoSyncSuccess', onAutoSyncSuccess)
    return () => {
      window.removeEventListener('dt:autoSyncSuccess', onAutoSyncSuccess)
    }
  }, [notification, t])

  useEffect(() => {
    void initCategories()

    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setShowIcp(Boolean(data.other.showIcp))
      setAppCategorySidebarVisible(data.controlBar.sidebar !== 'alwaysHide')
      setAppCategorySidebarPosition(data.controlBar.sidebarPosition)
      setBottomBarVisible(data.controlBar.bottomBar !== 'alwaysHide')
      setScrollSensitivity(data.other.scrollSensitivity)
      setUseSystemFont(Boolean(data.other.useSystemFont))
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
  }, [initCategories, setPinnedAppIds])

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-font', useSystemFont ? 'system' : 'default')
    } catch (error) {
      console.error('设置字体模式失败:', error)
    }
  }, [useSystemFont])

  useEffect(() => {
    const previousId = previousCategoryIdRef.current
    if (previousId === activeCategoryId) return

    const orderedIds = categories
      .slice()
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((category) => category.id)
    const previousIndex = orderedIds.indexOf(previousId)
    const currentIndex = orderedIds.indexOf(activeCategoryId)
    const lastIndex = orderedIds.length - 1
    const direction =
      previousIndex === 0 && currentIndex === lastIndex
        ? 'prev'
        : previousIndex === lastIndex && currentIndex === 0
          ? 'next'
          : currentIndex >= previousIndex
            ? 'next'
            : 'prev'

    previousCategoryIdRef.current = activeCategoryId
    setHomePageMotion((value) => ({
      direction,
      tick: value.tick + 1
    }))
  }, [activeCategoryId, categories])

  useLayoutEffect(() => {
    const root = contentRef.current
    if (!root) return

    root.scrollTop = 0

    const resetScroll = () => {
      root.scrollTop = 0
    }
    const firstFrame = window.requestAnimationFrame(() => {
      resetScroll()
      window.requestAnimationFrame(resetScroll)
    })
    const timeout = window.setTimeout(resetScroll, 120)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.clearTimeout(timeout)
    }
  }, [activeCategoryId])

  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const clampSensitivity = (v: number) => {
      if (!Number.isFinite(v)) return defaultGeneralSettings.other.scrollSensitivity
      return Math.min(100, Math.max(1, Math.round(v)))
    }

    const getThreshold = (v: number) => {
      const s = clampSensitivity(v)
      return 40 + (101 - s) * 4
    }

    const getOrderedCategoryIds = () => {
      const list = categories
        .slice()
        .sort((a, b) => Number(a.order) - Number(b.order))
        .map((c) => c.id)
      return list.length ? list : ['home']
    }

    const onWheel = (e: WheelEvent) => {
      if (settingsOpen) return
      if (searchStyleOpen) return
      if (activeDragId) return

      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      if (target.closest('.ant-modal, .ant-drawer')) return
      if (target.closest('[data-dt-scroll-panel="1"]')) return

      const delta = Number(e.deltaY) || 0
      if (!delta) return

      if (wheelLockRef.current || Date.now() < pageSwitchScrollLockUntilRef.current) {
        root.scrollTop = 0
        wheelAccRef.current = 0
        return
      }

      const canScroll =
        root.scrollHeight > root.clientHeight + 2 &&
        ((delta > 0 && root.scrollTop + root.clientHeight < root.scrollHeight - 2) ||
          (delta < 0 && root.scrollTop > 2))
      if (canScroll) return

      wheelAccRef.current += delta
      const threshold = Math.max(30, Math.round(getThreshold(scrollSensitivity) * 0.2))

      if (wheelLockRef.current) return
      if (Math.abs(wheelAccRef.current) < threshold) return

      const ids = getOrderedCategoryIds()
      const idx = ids.findIndex((id) => id === activeCategoryId)
      const currentIdx = idx >= 0 ? idx : 0
      const step = wheelAccRef.current > 0 ? 1 : -1
      const nextIdx = currentIdx + step
      if (nextIdx < 0 || nextIdx >= ids.length) {
        wheelAccRef.current = 0
        return
      }
      const nextId = ids[nextIdx]
      if (nextId && nextId !== activeCategoryId) {
        root.scrollTop = 0
        pageSwitchScrollLockUntilRef.current = Date.now() + 640
        setActiveCategoryId(nextId)
      }

      wheelAccRef.current = 0
      wheelLockRef.current = true
      window.setTimeout(() => {
        wheelLockRef.current = false
      }, 720)
    }

    root.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      root.removeEventListener('wheel', onWheel as any)
    }
  }, [
    activeCategoryId,
    activeDragId,
    categories,
    scrollSensitivity,
    searchStyleOpen,
    setActiveCategoryId,
    settingsOpen
  ])

  const onOpenSet = () => {
    console.log('触发了')
    setSettingsMenu(undefined)
    setSettingsOpen(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const fromContainer = String(event.active?.data?.current?.container || '')
    if (fromContainer !== 'dock') {
      setActiveDragId(null)
      return
    }
    setActiveDragId(String(event.active?.data?.current?.appId || event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    const activeAppId = String(active?.data?.current?.appId || active.id)
    const fromContainer = String(active?.data?.current?.container || '')
    const activeType = String(active?.data?.current?.type || '')
    setActiveDragId(null)

    if (!over) return

    const overAppId = String(over?.data?.current?.appId || over.id)
    const toContainer = String(over?.data?.current?.container || '')

    const isOverDock = toContainer === 'dock' || String(over.id) === BOTTOM_BAR_DROPPABLE_ID

    if (isOverDock && fromContainer !== 'dock') {
      if (activeType !== 'item') return
      if (pinnedAppIds.includes(activeAppId)) return

      const nextPinned = [...pinnedAppIds, activeAppId]
      setPinnedAppIds(nextPinned)
      try {
        await bottomBarService.savePins(nextPinned)
      } catch (error) {
        console.error('固定到底部栏失败:', error)
        message.error('固定到底部栏失败，请重试')
      }
      return
    }

    if (fromContainer !== 'dock') return

    if (toContainer === 'dock') {
      if (activeAppId === overAppId) return

      const oldIndex = pinnedAppIds.findIndex((id) => id === activeAppId)
      const newIndex = pinnedAppIds.findIndex((id) => id === overAppId)
      if (oldIndex === -1 || newIndex === -1) return

      const nextPinned = arrayMove(pinnedAppIds, oldIndex, newIndex)
      setPinnedAppIds(nextPinned)
      try {
        await bottomBarService.savePins(nextPinned)
      } catch (error) {
        console.error('保存 Dock 顺序失败:', error)
        message.error('保存 Dock 顺序失败，请重试')
      }
      return
    }

    const nextPinned = pinnedAppIds.filter((id) => id !== activeAppId)
    if (nextPinned.length !== pinnedAppIds.length) {
      setPinnedAppIds(nextPinned)
      try {
        await bottomBarService.savePins(nextPinned)
      } catch (error) {
        console.error('更新 Dock 固定项失败:', error)
        message.error('更新 Dock 失败，请重试')
      }
    }
  }

  return (
    <div
      className={cn(styles.container)}
      onClick={handlePageClick}
      onContextMenu={handlePageContextMenu}
    >
      <WallpaperBackground initialConfig={initialWallpaperConfig} />

      {/* 搜索框 */}
      <SearchBar />

      <div className={cn(styles.content)} ref={contentRef}>
        {/* 设置按钮 */}
        <button
          type='button'
          className={cn(styles.settingsButton)}
          aria-label={t('common.openSettings', { defaultValue: 'Open Deep Tab settings' })}
          onClick={() => onOpenSet()}
        >
          <SettingOutlined style={{ fontSize: 24, color: '#fff' }} />
        </button>

        <DndContext
          sensors={sensors}
          collisionDetection={pageCollisionDetection}
          modifiers={[snapCenterToCursor]}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={handleDragEnd}
        >
          <div
            className={cn(
              styles.homePage,
              homePageMotion.tick > 0 && styles.homePageAnimating
            )}
            style={
              homePageMotion.tick > 0
                ? {
                    animationName:
                      homePageMotion.direction === 'next'
                        ? homePageMotion.tick % 2
                          ? styles.homePageInNextA
                          : styles.homePageInNextB
                        : homePageMotion.tick % 2
                          ? styles.homePageInPrevA
                          : styles.homePageInPrevB
                  }
                : undefined
            }
          >
            {/* 应用图标网格 */}
            <AppGrid key={activeCategoryId} />
          </div>

          {bottomBarVisible && <BottomBar activeCategoryId={activeCategoryId} />}

          <DragOverlay dropAnimation={null} adjustScale={false}>
            {activeDockApp ? (
              <div className={cn(styles.dragOverlayItem)}>
                {isImageIconSource(activeDockApp.icon) ? (
                  <img
                    className={cn(styles.dragOverlayImg)}
                    src={activeDockApp.icon}
                    alt={activeDockApp.name}
                  />
                ) : (
                  <span className={cn(styles.dragOverlayEmoji)}>
                    {activeDockApp.icon || activeDockApp.name.slice(0, 1)}
                  </span>
                )}
              </div>
            ) : (
              <GridDragOverlayContent />
            )}
          </DragOverlay>
        </DndContext>

        {/* 设置侧边栏 */}
        <SettingsSidebar
          open={settingsOpen}
          openToMenu={settingsMenu}
          onClose={() => setSettingsOpen(false)}
        />

        <SearchStyleModal
          open={searchStyleOpen}
          widthPercent={searchStyleWidth}
          opacityPercent={searchStyleOpacity}
          onPreview={(next) => {
            setSearchStyleWidth(next.widthPercent)
            setSearchStyleOpacity(next.opacityPercent)
            applySearchStyleVars(next.widthPercent, next.opacityPercent)
          }}
          onBack={() => {
            setSearchStyleOpen(false)
            setSettingsMenu('settings')
            setSettingsOpen(true)
          }}
          onDone={async (next) => {
            try {
              const data = await generalSettingsService.getGeneralSettings()
              const merged = {
                ...data,
                search: {
                  ...data.search,
                  searchBarWidth: next.widthPercent,
                  searchBarOpacity: next.opacityPercent
                }
              }
              await generalSettingsService.saveGeneralSettings(merged)
              setSearchStyleWidth(next.widthPercent)
              setSearchStyleOpacity(next.opacityPercent)
              applySearchStyleVars(next.widthPercent, next.opacityPercent)
            } catch (error) {
              console.error('保存搜索框样式失败:', error)
              message.error('保存失败，请重试')
              return
            }

            setSearchStyleOpen(false)
          }}
        />

        {showIcp && (
          <div className={styles.icpFooter}>
            <a href='https://beian.miit.gov.cn/' target='_blank' rel='noreferrer'>
              湘ICP备2021011742号
            </a>
          </div>
        )}

        <RemoteNotificationBridge />
        <SyncConflictModal />
        {appCategorySidebarVisible && <AppCategorySidebar position={appCategorySidebarPosition} />}
      </div>
    </div>
  )
}

export default Main

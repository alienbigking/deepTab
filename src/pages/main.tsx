import React, { useState, useEffect, useMemo, useRef } from 'react'
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
import SearchStyleModal from './generalSettings/searchStyleModal'
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
  const setApps = useAppGridStore((s) => s.setApps)
  const pinnedAppIds = useBottomBarStore((s) => s.pinnedAppIds)
  const setPinnedAppIds = useBottomBarStore((s) => s.setPinnedAppIds)

  const contentRef = useRef<HTMLDivElement | null>(null)
  const wheelAccRef = useRef(0)
  const wheelLockRef = useRef(false)

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

      wheelAccRef.current += delta
      const threshold = getThreshold(scrollSensitivity)

      if (wheelLockRef.current) return
      if (Math.abs(wheelAccRef.current) < threshold) return

      const ids = getOrderedCategoryIds()
      const idx = ids.findIndex((id) => id === activeCategoryId)
      const currentIdx = idx >= 0 ? idx : 0
      const step = wheelAccRef.current > 0 ? 1 : -1
      const nextIdx = (currentIdx + step + ids.length) % ids.length
      const nextId = ids[nextIdx]
      if (nextId && nextId !== activeCategoryId) {
        setActiveCategoryId(nextId)
      }

      wheelAccRef.current = 0
      wheelLockRef.current = true
      window.setTimeout(() => {
        wheelLockRef.current = false
      }, 350)
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
    setActiveDragId(String(event.active?.data?.current?.appId || event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    const activeAppId = String(active?.data?.current?.appId || active.id)
    setActiveDragId(null)

    if (!over) return

    const overAppId = String(over?.data?.current?.appId || over.id)

    const fromContainer = String(active?.data?.current?.container || '')
    const toContainer = String(over?.data?.current?.container || '')

    const isOverDock = toContainer === 'dock' || String(over.id) === BOTTOM_BAR_DROPPABLE_ID

    if (fromContainer === 'dock' && toContainer === 'dock') {
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

    if (isOverDock) {
      let nextPinned: string[] | null = null
      setPinnedAppIds((prev) => {
        if (prev.includes(activeAppId)) {
          nextPinned = null
          return prev
        }
        nextPinned = [...prev, activeAppId]
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

    if (fromContainer === 'dock') return

    if (activeAppId === overAppId) return

    const visibleApps = apps.filter((app) => (app.categoryId || 'home') === activeCategoryId)
    const oldIndex = visibleApps.findIndex((app) => app.id === activeAppId)
    const newIndex = visibleApps.findIndex((app) => app.id === overAppId)
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
      <div className={cn(styles.content)} ref={contentRef}>
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
          <AppGrid />

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

        {appCategorySidebarVisible && <AppCategorySidebar position={appCategorySidebarPosition} />}
      </div>
    </div>
  )
}

export default Main

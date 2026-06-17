import React, { useEffect, useMemo, useState } from 'react'
import { DragOverlay, useDndMonitor, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { App, Button } from 'antd'
import cn from 'classnames'
import styles from './appGrid.module.less'
import DroppableFolder from './droppableFolder'
import DroppableIcon from './droppableIcon'
import DroppableWidget from './droppableWidget'
import ContextMenu from './contextMenu'
import AddAppModal from './addAppModal'
import AppFolderPopover from './appFolderPopover'
import CreateFolderModal from './createFolderModal'
import AppIcon from './appIcon'
import CalendarWidget from '@/pages/widgetsContainer/calendarWidget'
import WeatherWidget from '@/pages/widgetsContainer/weatherWidget'
import TodoWidget from '@/pages/widgetsContainer/todoWidget'
import HotSearchWidget from '@/pages/widgetsContainer/hotSearchWidget'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import appGridService from './services/appGrid'
import useAppGridStore from './stores/appGrid'
import type { AppNode, AppItem, AppFolder, ContextMenuState, WidgetKind } from './types/appGrid'
import { initDefaultApps } from './initData'
import { useNotification } from '@/common/ui'
import useAppCategoryStore from '@/pages/appCategory/stores/appCategory'

export const MAIN_GRID_DROPPABLE_ID = 'main-grid'

const delayedReorderStrategy = () => null
const widgetUrlPrefix = 'deeptab://widget/'
const iconTrackWidth = 120

const getWidgetKind = (node?: AppNode | null): WidgetKind | null => {
  if (!node || node.type !== 'item') return null
  const url = String(node.url || '')
  if (!url.startsWith(widgetUrlPrefix)) return null
  const kind = url.slice(widgetUrlPrefix.length)
  if (kind === 'calendar' || kind === 'weather' || kind === 'todo' || kind === 'hotSearch') {
    return kind
  }
  return null
}

const widgetPreviewMap: Record<WidgetKind, React.ReactNode> = {
  calendar: <CalendarWidget />,
  weather: <WeatherWidget />,
  todo: <TodoWidget />,
  hotSearch: <HotSearchWidget />
}

const getGridItemRects = () => {
  const rects = new Map<string, DOMRect>()
  document.querySelectorAll<HTMLElement>('[data-app-grid-id]').forEach((element) => {
    const id = element.dataset.appGridId
    if (id) rects.set(id, element.getBoundingClientRect())
  })
  return rects
}

const animateGridReorder = (previousRects: Map<string, DOMRect>, activeId: string) => {
  requestAnimationFrame(() => {
    document.querySelectorAll<HTMLElement>('[data-app-grid-id]').forEach((element) => {
      const id = element.dataset.appGridId
      if (!id || id === activeId) return

      const previous = previousRects.get(id)
      if (!previous) return

      const next = element.getBoundingClientRect()
      const deltaX = previous.left - next.left
      const deltaY = previous.top - next.top

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

      element.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' }
        ],
        {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        }
      )
    })
  })
}

const getDropPoint = (event: DragEndEvent) => {
  const translated = event.active.rect.current.translated
  const fallback = event.active.rect.current.initial
  const rect = translated || fallback
  if (!rect) return null

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

const findClosestGridItemId = (point: { x: number; y: number }, activeId: string) => {
  let closestId: string | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  document.querySelectorAll<HTMLElement>('[data-app-grid-id]').forEach((element) => {
    const id = element.dataset.appGridId
    if (!id || id === activeId) return

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distance = Math.hypot(point.x - centerX, point.y - centerY)

    if (distance < closestDistance) {
      closestDistance = distance
      closestId = id
    }
  })

  return closestId
}

const AppGrid: React.FC = () => {
  const { message, modal } = App.useApp()
  const { showNotification } = useNotification()
  const [isEditMode, setIsEditMode] = useState(false)
  const [contextMenuData, setContextMenuData] = useState<ContextMenuState | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<AppItem | null>(null)
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null)
  const [createFolderVisible, setCreateFolderVisible] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeNode, setActiveNode] = useState<AppNode | AppItem | null>(null)

  const {
    apps,
    setApps,
    loadApps,
    iconSettings,
    setIconSettings,
    createFolder,
    moveToFolder,
    moveFromFolder,
    deleteFolder,
    updateFolder
  } = useAppGridStore()
  const activeCategoryId = useAppCategoryStore((s) => s.activeCategoryId)

  const visibleApps = useMemo(() => {
    return apps.filter((app) => (app.categoryId || 'home') === activeCategoryId)
  }, [activeCategoryId, apps])

  const { setNodeRef, isOver } = useDroppable({
    id: MAIN_GRID_DROPPABLE_ID,
    data: {
      container: 'grid'
    }
  })

  useEffect(() => {
    const initAndLoadApps = async () => {
      try {
        const persistedIconSettings = await appGridService.getIconSettings()
        if (persistedIconSettings) {
          setIconSettings(persistedIconSettings)
        }

        await initDefaultApps()
        await loadApps()
      } catch (error) {
        console.error('初始化失败:', error)
      }
    }

    void initAndLoadApps()
  }, [loadApps, setIconSettings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        setIsEditMode(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode])

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isEditMode) {
      setIsEditMode(false)
    }
  }

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const target = e.target as HTMLElement
    const isAppIcon = target.closest(`.${styles.appIcon}`)
    const isAddButton = target.closest(`.${styles.addBtnWrapper}`)

    if (!isAppIcon && !isAddButton) {
      setContextMenuData({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        appId: '',
        appType: 'blank'
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await appGridService.delete(id)
      message.success('删除成功，应用已从首页移除')
      await loadApps()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  const confirmDelete = (id: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个应用吗?',
      okText: '删除',
      cancelText: '取消',
      maskTransitionName: modalMaskTransitionName,
      maskStyle: modalMaskStyle,
      onOk: () => handleDelete(id)
    })
  }

  const handleContextMenu = (
    e: React.MouseEvent,
    appId: string,
    nodeType: 'item' | 'folder' | 'widget'
  ) => {
    setContextMenuData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      appId,
      appType: nodeType
    })
  }

  const closeContextMenu = () => {
    setContextMenuData(null)
  }

  const normalizeUrl = (url: string): string => {
    if (!url) return ''
    const trimmedUrl = url.trim()
    if (trimmedUrl.startsWith(widgetUrlPrefix)) return ''
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`
    }
    return trimmedUrl
  }

  const handleOpenCurrent = () => {
    const node = apps.find((a) => a.id === contextMenuData?.appId)
    if (node && node.type === 'item') {
      try {
        const normalizedUrl = normalizeUrl(node.url)
        if (!normalizedUrl) {
          showNotification('error', '无效的链接地址')
          closeContextMenu()
          return
        }
        chrome.tabs.getCurrent((tab) => {
          if (tab?.id) {
            chrome.tabs.update(tab.id, { url: normalizedUrl })
          } else {
            window.location.href = normalizedUrl
          }
        })
      } catch (error) {
        console.error('打开失败:', error)
        showNotification('error', '打开失败')
      }
    }
    closeContextMenu()
  }

  const handleOpenNew = () => {
    const node = apps.find((a) => a.id === contextMenuData?.appId)
    closeContextMenu()

    if (node && node.type === 'item') {
      try {
        const normalizedUrl = normalizeUrl(node.url)
        if (!normalizedUrl) {
          message.error('无效的链接地址')
          return
        }
        chrome.tabs.create({ url: normalizedUrl, active: true }, () => {
          if (chrome.runtime.lastError) {
            console.error('Chrome API 错误:', chrome.runtime.lastError)
            message.error('打开失败')
          } else {
            message.success(`已在新标签页打开 ${node.name}`)
          }
        })
      } catch (error) {
        console.error('打开失败:', error)
        message.error('打开失败')
      }
    }
  }

  const handleEdit = () => {
    const node = apps.find((a) => a.id === contextMenuData?.appId)
    if (node && node.type === 'item' && !getWidgetKind(node)) {
      setEditingApp(node)
      setAddModalOpen(true)
    }
    closeContextMenu()
  }

  const handleContextDelete = () => {
    const appId = contextMenuData?.appId
    if (!appId) return

    const node = apps.find((a) => a.id === appId)
    if (!node) return

    closeContextMenu()

    if (node.type === 'folder') {
      modal.confirm({
        title: '删除文件夹',
        content: '删除文件夹时，内部图标将全部移出到主网格，确定删除吗？',
        okText: '删除',
        cancelText: '取消',
        maskTransitionName: modalMaskTransitionName,
        maskStyle: modalMaskStyle,
        onOk: async () => {
          try {
            await deleteFolder({ folderId: appId, deleteChildren: false })
            message.success('文件夹已删除')
          } catch (error) {
            message.error('删除失败')
          }
        }
      })
      return
    }

    confirmDelete(appId)
  }

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder({ name })
      message.success('文件夹已创建')
    } catch (error) {
      console.error('创建文件夹失败:', error)
      message.error('创建失败')
    }
  }

  const handleMoveToFolder = async (targetFolderId: string) => {
    const sourceId = contextMenuData?.appId
    if (!sourceId || contextMenuData?.appType === 'blank' || contextMenuData?.appType === 'widget') {
      return
    }
    try {
      await moveToFolder({ itemId: sourceId, folderId: targetFolderId })
      message.success('已移入文件夹')
    } catch (error) {
      message.error('移入失败')
    }
  }

  const handleFolderClick = (folder: AppFolder) => {
    setOpenedFolderId(folder.id)
  }

  const handleMoveOut = async (itemId: string, folderId: string) => {
    try {
      await moveFromFolder({ itemId, folderId })
      message.success('图标已移出')
    } catch (error) {
      message.error('移出失败')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await appGridService.delete(itemId)
      message.success('图标已删除')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleUpdateFolder = async (id: string, params: { name?: string; icon?: string }) => {
    await updateFolder(id, params)
  }

  const handleModalSuccess = async () => {
    await loadApps()
  }

  const openedFolder = openedFolderId
    ? (apps.find((a) => a.id === openedFolderId && a.type === 'folder') as AppFolder)
    : null

  useDndMonitor({
    onDragStart: (event) => {
      const fromContainer = String(event.active?.data?.current?.container || '')
      if (fromContainer !== 'grid' && fromContainer !== 'folder') return

      const nextId = String(event.active?.data?.current?.appId || event.active.id)
      const currentData = event.active?.data?.current
      const nextNode =
        (currentData?.item as AppItem | undefined) ||
        (currentData?.folder as AppFolder | undefined) ||
        apps.find((app) => app.id === nextId) ||
        null

      setActiveId(nextId)
      setActiveNode(nextNode)
    },
    onDragCancel: (event) => {
      const fromContainer = String(event.active?.data?.current?.container || '')
      if (fromContainer !== 'grid' && fromContainer !== 'folder') return
      setActiveId(null)
      setActiveNode(null)
    },
    onDragEnd: async (event) => {
      const fromContainer = String(event.active?.data?.current?.container || '')
      if (fromContainer !== 'grid' && fromContainer !== 'folder') return

      const draggedId = String(event.active?.data?.current?.appId || event.active.id)
      const draggedNode = apps.find((app) => app.id === draggedId) || activeNode

      setActiveId(null)
      setActiveNode(null)

      if (!event.over) return

      const droppedOnId = String(event.over.id)
      const toContainer = String(event.over?.data?.current?.container || '')

      if (toContainer === 'dock') return
      if (draggedId === droppedOnId) return

      const dropPoint = getDropPoint(event)
      const closestGridItemId =
        dropPoint && fromContainer === 'grid'
          ? findClosestGridItemId(dropPoint, draggedId)
          : null
      const resolvedGridTargetId = closestGridItemId || droppedOnId
      const droppedOnNode = apps.find((app) => app.id === resolvedGridTargetId)
      const parentFolder = apps.find(
        (app) => app.type === 'folder' && app.children.some((child) => child.id === draggedId)
      ) as AppFolder | undefined

      if (event.over.id === MAIN_GRID_DROPPABLE_ID) {
        if (fromContainer === 'folder' && parentFolder) {
          try {
            await moveFromFolder({ itemId: draggedId, folderId: parentFolder.id })
            message.success('图标已移出文件夹')
            window.setTimeout(() => {
              if (openedFolderId === parentFolder.id) {
                setOpenedFolderId(null)
              }
            }, 300)
          } catch (error) {
            console.error('移出文件夹失败:', error)
            message.error('移出失败')
          }
        }
        return
      }

      if (fromContainer === 'folder') return

      if (droppedOnNode && droppedOnNode.type === 'folder') {
        if (draggedNode && draggedNode.type === 'item' && !getWidgetKind(draggedNode)) {
          try {
            await moveToFolder({ itemId: draggedId, folderId: droppedOnId })
            message.success('已移入文件夹')
          } catch (error) {
            console.error('移入文件夹失败:', error)
            message.error('移入失败')
          }
        }
        return
      }

      if (
        draggedNode &&
        (draggedNode.type === 'item' || draggedNode.type === 'folder') &&
        droppedOnNode &&
        (droppedOnNode.type === 'item' || droppedOnNode.type === 'folder')
      ) {
        const oldIndex = visibleApps.findIndex((app) => app.id === draggedId)
        const newIndex = visibleApps.findIndex((app) => app.id === resolvedGridTargetId)

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const previousRects = getGridItemRects()
          const movedVisible = [...visibleApps]
          const [movedItem] = movedVisible.splice(oldIndex, 1)
          movedVisible.splice(newIndex, 0, movedItem)

          const indices = apps
            .map((app, index) => ({ app, index }))
            .filter(({ app }) => (app.categoryId || 'home') === activeCategoryId)
            .map(({ index }) => index)

          const nextApps = [...apps]
          indices.forEach((index, order) => {
            nextApps[index] = {
              ...movedVisible[order],
              order: index
            }
          })

          setApps(nextApps)
          animateGridReorder(previousRects, draggedId)

          try {
            await appGridService.updateOrder(nextApps)
          } catch (error) {
            console.error('排序保存失败:', error)
            message.error('排序失败')
            await loadApps()
          }
        }
      }
    }
  })

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(styles.appGridContainer, styles.mainGridDropZone, {
          [styles.editModeContainer]: isEditMode,
          [styles.mainGridDropOver]: isOver
        })}
        onClick={handleContainerClick}
        onContextMenu={handleContainerContextMenu}
      >
        {isEditMode && (
          <div className={styles.addBtnWrapper}>
            <Button onClick={() => setIsEditMode(false)} size='small' className={cn(styles.doneBtn)}>
              完成
            </Button>
          </div>
        )}

        <SortableContext
          items={visibleApps.map((app) => app.id)}
          strategy={delayedReorderStrategy}
        >
          <div
            className={styles.appGrid}
            style={
              {
                '--dt-grid-gap': `${iconSettings.spacing}px`
              } as React.CSSProperties
            }
          >
            {visibleApps.map((node) => {
              const widgetKind = getWidgetKind(node)
              return widgetKind ? (
                <DroppableWidget
                  key={node.id}
                  widget={node as AppItem}
                  kind={widgetKind}
                  isEditMode={isEditMode}
                  gridGap={iconSettings.spacing}
                  onContextMenu={handleContextMenu}
                />
              ) : node.type === 'folder' ? (
                <DroppableFolder
                  key={node.id}
                  folder={node as AppFolder}
                  isEditMode={isEditMode}
                  iconSettings={iconSettings}
                  onDelete={handleDelete}
                  onContextMenu={handleContextMenu}
                  onLongPress={() => setIsEditMode(true)}
                  onFolderClick={handleFolderClick}
                />
              ) : (
                <DroppableIcon
                  key={node.id}
                  icon={node as AppItem}
                  isEditMode={isEditMode}
                  iconSettings={iconSettings}
                  onDelete={handleDelete}
                  onContextMenu={handleContextMenu}
                  onLongPress={() => setIsEditMode(true)}
                />
              )
            })}
          </div>
        </SortableContext>

        {contextMenuData && (
          <ContextMenu
            visible={contextMenuData.visible}
            x={contextMenuData.x}
            y={contextMenuData.y}
            nodeType={contextMenuData.appType || 'blank'}
            onOpenCurrent={handleOpenCurrent}
            onOpenNew={handleOpenNew}
            onEdit={handleEdit}
            onDelete={handleContextDelete}
            onCreateFolder={handleCreateFolder}
            onMoveToFolder={handleMoveToFolder}
            onClose={closeContextMenu}
            allFolders={apps.filter((a) => a.type === 'folder') as AppFolder[]}
            onCreateFolderRequested={() => setCreateFolderVisible(true)}
            onAddAppRequested={() => {
              setEditingApp(null)
              setAddModalOpen(true)
            }}
          />
        )}

        <CreateFolderModal
          visible={createFolderVisible}
          onClose={() => setCreateFolderVisible(false)}
          onCreateFolder={handleCreateFolder}
        />

        {openedFolder && (
          <AppFolderPopover
            folder={openedFolder}
            iconSettings={iconSettings}
            visible={!!openedFolderId}
            onClose={() => setOpenedFolderId(null)}
            onMoveOut={handleMoveOut}
            onDeleteItem={handleDeleteItem}
            onUpdateFolder={handleUpdateFolder}
          />
        )}

        <AddAppModal
          open={addModalOpen}
          editingApp={editingApp}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>

      <DragOverlay dropAnimation={null} adjustScale={false}>
        {activeNode ? (
          (() => {
            const activeWidgetKind = getWidgetKind(activeNode)

            if (activeWidgetKind && activeNode.type === 'item') {
              const span = activeNode.widgetSpan === 2 ? 2 : 4
              const gap = Number.isFinite(iconSettings.spacing) ? iconSettings.spacing : 24
              const width = span * iconTrackWidth + (span - 1) * gap

              return (
                <div
                  className={cn(styles.dragOverlayRoot, styles.dragOverlayWidget)}
                  style={
                    {
                      width,
                      '--dt-widget-node-width': `${width}px`
                    } as React.CSSProperties
                  }
                >
                  {widgetPreviewMap[activeWidgetKind]}
                </div>
              )
            }

            return (
              <div className={cn(styles.dragOverlayRoot, styles.dragOverlayIcon)}>
                <AppIcon
                  node={activeNode}
                  isEditMode={isEditMode}
                  iconSettings={iconSettings}
                  onDelete={() => {}}
                  onContextMenu={() => {}}
                  onLongPress={() => {}}
                  disableDrag={true}
                />
              </div>
            )
          })()
        ) : null}
      </DragOverlay>
    </>
  )
}

export default AppGrid

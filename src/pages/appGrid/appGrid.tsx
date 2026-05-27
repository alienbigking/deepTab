import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { App, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import cn from 'classnames'
import styles from './appGrid.module.less'
import AppIcon from './appIcon'
import DroppableFolder from './droppableFolder'
import DroppableIcon from './droppableIcon'
import ContextMenu from './contextMenu'
import AddAppModal from './addAppModal'
import AppFolderPopover from './appFolderPopover'
import CreateFolderModal from './createFolderModal'
import DraggableFolderIcon from './draggableFolderIcon'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import appGridService from './services/appGrid'
import useAppGridStore from './stores/appGrid'
import type { AppNode, AppItem, AppFolder, ContextMenuState } from './types/appGrid'
import { initDefaultApps } from './initData'
import { useNotification } from '@/common/ui'
import useAppCategoryStore from '@/pages/appCategory/stores/appCategory'

const REORDER_HOVER_DELAY = 500
const MERGE_HOVER_DELAY = 1000
const delayedReorderStrategy = () => null
type DragHoverMode = 'merge' | 'reorder'

const isImageIcon = (icon?: string) => /^(https?:\/\/|data:image\/)/i.test(String(icon || ''))

const iconTextFromName = (value?: string) => {
  const text = String(value || '').trim()
  if (!text) return 'A'
  const chinese = text.match(/[\u4e00-\u9fa5]/g)
  if (chinese?.length) return chinese.slice(0, 2).join('')
  const letters = text.replace(/[^a-z0-9]/gi, '').slice(0, 2)
  return (letters || text.slice(0, 2)).toUpperCase()
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

const getGridItemElement = (id: string) => {
  const items = document.querySelectorAll<HTMLElement>('[data-app-grid-id]')
  return Array.from(items).find((element) => element.dataset.appGridId === id) || null
}

const getTargetIconRect = (id: string) => {
  const element = getGridItemElement(id)
  const iconElement = element?.querySelector<HTMLElement>(`.${styles.iconWrapper}`)
  return iconElement?.getBoundingClientRect() || element?.getBoundingClientRect() || null
}

const getActiveRectCenter = (event: DragOverEvent | DragMoveEvent) => {
  const rect = event.active.rect.current.translated || event.active.rect.current.initial
  if (!rect) return null

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

const isInsideMergeZone = (event: DragOverEvent | DragMoveEvent) => {
  if (!event.over) return false

  const center = getActiveRectCenter(event)
  if (!center) return false

  const rect = getTargetIconRect(String(event.over.id))
  if (!rect) return false

  const horizontalInset = rect.width * 0.08
  const verticalInset = rect.height * 0.08

  return (
    center.x >= rect.left + horizontalInset &&
    center.x <= rect.right - horizontalInset &&
    center.y >= rect.top + verticalInset &&
    center.y <= rect.bottom - verticalInset
  )
}

/**
 * 应用图标网格组件
 * 支持拖拽排序、编辑模式、右键菜单
 */
const AppGrid: React.FC = () => {
  const { notification, message, modal } = App.useApp()
  const { showNotification } = useNotification()

  // 状态管理
  const [isEditMode, setIsEditMode] = useState(false)
  const [contextMenuData, setContextMenuData] = useState<ContextMenuState | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<AppItem | null>(null)
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // 配置拖拽传感器 - 设置较小的激活距离
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // 移动 5px 后才开始拖拽
      }
    })
  )

  // 悬停检测相关
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mergeHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mergeHoverTargetRef = useRef<string | null>(null)
  const lastOverIdRef = useRef<string | null>(null)
  const lastHoverModeRef = useRef<DragHoverMode | null>(null)
  const latestAppsRef = useRef<AppNode[]>([])
  const originalAppsRef = useRef<AppNode[] | null>(null)
  const didPreviewReorderRef = useRef(false)
  const didMergeFolderRef = useRef(false)

  // Store hooks
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

  useEffect(() => {
    latestAppsRef.current = apps
  }, [apps])

  // 初始化加载数据
  useEffect(() => {
    initAndLoadApps()
  }, [])

  // 初始化并加载应用列表
  const initAndLoadApps = async () => {
    try {
      const persistedIconSettings = await appGridService.getIconSettings()
      if (persistedIconSettings) {
        setIconSettings(persistedIconSettings)
      }

      // 首次使用时初始化默认数据
      await initDefaultApps()
      // 加载数据
      await loadApps()
    } catch (error) {
      console.error('初始化失败:', error)
    }
  }

  // 长按进入编辑模式
  const handleLongPress = () => {
    setIsEditMode(true)
  }

  // 退出编辑模式
  const exitEditMode = () => {
    setIsEditMode(false)
  }

  // ESC 键退出编辑模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        exitEditMode()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode])

  // 点击空白区域退出编辑模式
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isEditMode) {
      exitEditMode()
    }
  }

  // 空白区域右键菜单
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    // 阻止浏览器默认右键菜单
    e.preventDefault()
    e.stopPropagation()

    // 检查是否点击在空白区域
    const target = e.target as HTMLElement
    const isAppIcon = target.closest(`.${styles.appIcon}`)
    const isAddButton = target.closest(`.${styles.addBtnWrapper}`)

    // 只有在真正的空白区域才显示右键菜单
    if (!isAppIcon && !isAddButton) {
      setContextMenuData({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        appId: '',
        appType: 'blank' // 标记为空白区域
      })
    }
  }

  // 实际删除应用逻辑
  const handleDelete = async (id: string) => {
    console.log('待删除 id =', id)
    try {
      await appGridService.delete(id)
      message.success('删除成功，应用已从首页移除')
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  // 使用 antd modal.confirm 进行删除确认
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

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, appId: string, nodeType: 'item' | 'folder') => {
    setContextMenuData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      appId,
      appType: nodeType
    })
  }

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenuData(null)
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

  // 右键菜单 - 在当前标签页打开
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

  // 右键菜单 - 在新标签页打开
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
        chrome.tabs.create(
          {
            url: normalizedUrl,
            active: true
          },
          (tab) => {
            if (chrome.runtime.lastError) {
              console.error('Chrome API 错误:', chrome.runtime.lastError)
              message.error('打开失败')
            } else {
              message.success(`已在新标签页打开 ${node.name}`)
            }
          }
        )
      } catch (error) {
        console.error('打开失败:', error)
        message.error('打开失败')
      }
    }
  }

  // 右键菜单 - 编辑
  const handleEdit = () => {
    const node = apps.find((a) => a.id === contextMenuData?.appId)
    if (node && node.type === 'item') {
      setEditingApp(node as AppItem)
      setAddModalOpen(true)
    }
    closeContextMenu()
  }

  // 右键菜单 - 删除(使用 antd modal.confirm)
  const handleContextDelete = () => {
    const appId = contextMenuData?.appId
    if (!appId) {
      console.warn('右键删除时未找到 appId')
      return
    }

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
    } else {
      confirmDelete(appId)
    }
  }

  // 右键菜单 - 创建文件夹
  const handleCreateFolder = async (name: string) => {
    console.log('handleCreateFolder 被调用，name:', name)
    try {
      await createFolder({ name })
      message.success('文件夹已创建')
    } catch (error) {
      console.error('创建文件夹失败:', error)
      message.error('创建失败')
    }
  }

  // 请求创建文件夹弹窗
  const [createFolderVisible, setCreateFolderVisible] = useState(false)

  const handleCreateFolderRequested = () => {
    console.log('请求创建文件夹弹窗')
    setCreateFolderVisible(true)
  }

  const handleCreateFolderClose = () => {
    setCreateFolderVisible(false)
  }

  // 右键菜单 - 移动到文件夹（只在有源 ID 时生效）
  const handleMoveToFolder = async (targetFolderId: string) => {
    const sourceId = contextMenuData?.appId
    if (!sourceId || contextMenuData?.appType === 'blank') {
      // 空白区域不执行移动操作
      return
    }
    try {
      await moveToFolder({ itemId: sourceId, folderId: targetFolderId })
      message.success('已移入文件夹')
    } catch (error) {
      message.error('移入失败')
    }
  }

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  const clearMergeHoverTimer = () => {
    if (mergeHoverTimerRef.current) {
      clearTimeout(mergeHoverTimerRef.current)
      mergeHoverTimerRef.current = null
    }
    mergeHoverTargetRef.current = null
  }

  const clearDragHoverTimers = () => {
    clearHoverTimer()
    clearMergeHoverTimer()
  }

  const reorderTopLevelApps = (list: AppNode[], draggedId: string, overId: string) => {
    const categoryItems = list.filter((app) => (app.categoryId || 'home') === activeCategoryId)
    const oldIndex = categoryItems.findIndex((app) => app.id === draggedId)
    const newIndex = categoryItems.findIndex((app) => app.id === overId)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return { nextApps: list, changed: false }
    }

    const movedCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)
    const categoryIndices = list
      .map((app, index) => ({ app, index }))
      .filter(({ app }) => (app.categoryId || 'home') === activeCategoryId)
      .map(({ index }) => index)

    const nextApps = [...list]
    categoryIndices.forEach((idx, itemIndex) => {
      nextApps[idx] = movedCategoryItems[itemIndex]
    })

    const ordered = nextApps.map((app, index) => ({
      ...app,
      order: index,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const
    }))

    return { nextApps: ordered, changed: true }
  }

  const previewReorder = (draggedId: string, overId: string) => {
    const previousRects = getGridItemRects()
    setApps((prev) => {
      const { nextApps, changed } = reorderTopLevelApps(prev, draggedId, overId)
      if (changed) {
        didPreviewReorderRef.current = true
        latestAppsRef.current = nextApps
        animateGridReorder(previousRects, draggedId)
      }
      return nextApps
    })
  }

  const mergeIntoFolder = async (draggedId: string, overId: string) => {
    const currentList = latestAppsRef.current
    const draggedNode = currentList.find((app) => app.id === draggedId)
    const overNode = currentList.find((app) => app.id === overId)

    if (!draggedNode || !overNode) return
    if (draggedNode.type !== 'item' || overNode.type !== 'item') return
    if ((draggedNode.categoryId || 'home') !== activeCategoryId) return
    if ((overNode.categoryId || 'home') !== activeCategoryId) return

    const previousRects = getGridItemRects()
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const folder: AppFolder = {
      type: 'folder',
      id: folderId,
      name: '文件夹',
      icon: '📁',
      iconBg: overNode.iconBg,
      order: 0,
      categoryId: overNode.categoryId || draggedNode.categoryId || activeCategoryId,
      children: [
        { ...overNode, order: 0 },
        { ...draggedNode, order: 1 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    const nextApps = currentList
      .reduce<AppNode[]>((next, node) => {
        if (node.id === draggedId) return next
        if (node.id === overId) {
          next.push(folder)
          return next
        }
        next.push(node)
        return next
      }, [])
      .map((node, index) => ({
        ...node,
        order: index,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }))

    didMergeFolderRef.current = true
    didPreviewReorderRef.current = false
    setActiveId(null)
    clearMergeHoverTimer()
    lastOverIdRef.current = null
    lastHoverModeRef.current = null
    latestAppsRef.current = nextApps
    setApps(nextApps)
    animateGridReorder(previousRects, draggedId)

    try {
      await appGridService.saveAll(nextApps)
      message.success('已合并为文件夹')
    } catch (error) {
      console.error('合并文件夹失败:', error)
      message.error('合并失败，请重试')
      await loadApps()
    }
  }

  // 拖拽开始处理
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string)
    clearDragHoverTimers()
    lastOverIdRef.current = null
    lastHoverModeRef.current = null
    originalAppsRef.current = latestAppsRef.current
    didPreviewReorderRef.current = false
    didMergeFolderRef.current = false
  }

  const handleDragHover = (event: DragOverEvent | DragMoveEvent) => {
    const { active, over } = event
    if (!over || !active) {
      clearDragHoverTimers()
      lastOverIdRef.current = null
      lastHoverModeRef.current = null
      return
    }

    const draggedId = active.id as string
    const overId = over.id as string

    const draggedNode = apps.find((app) => app.id === draggedId)
    const overNode = apps.find((app) => app.id === overId)
    const hoverMode: DragHoverMode =
      draggedNode?.type === 'item' && overNode?.type === 'item' && isInsideMergeZone(event)
        ? 'merge'
        : 'reorder'

    if (lastOverIdRef.current === overId && lastHoverModeRef.current === hoverMode) return

    clearHoverTimer()
    clearMergeHoverTimer()

    // 更新当前悬停目标
    lastOverIdRef.current = overId
    lastHoverModeRef.current = hoverMode

    // 忽略拖到自己身上
    if (draggedId === overId) return

    // 忽略拖到主网格区域（这个在 dragEnd 处理）
    if (overId === 'main-grid') return

    // 检查是否是从文件夹内拖出的图标
    const parentFolder = apps.find(
      (app) => app.type === 'folder' && app.children.some((child) => child.id === draggedId)
    ) as AppFolder | undefined

    // 如果悬停在文件夹上，不启动合并计时器
    if (overNode && overNode.type === 'folder') {
      return
    }

    // 如果是主页图标之间的拖拽，启动悬停计时器
    if (
      draggedNode &&
      (draggedNode.type === 'item' || draggedNode.type === 'folder') &&
      overNode &&
      (overNode.type === 'item' || overNode.type === 'folder') &&
      !parentFolder
    ) {
      if (hoverMode === 'merge') {
        mergeHoverTargetRef.current = overId
        mergeHoverTimerRef.current = setTimeout(() => {
          if (mergeHoverTargetRef.current === overId && lastHoverModeRef.current === 'merge') {
            void mergeIntoFolder(draggedId, overId)
          }
        }, MERGE_HOVER_DELAY)
        return
      }

      hoverTimerRef.current = setTimeout(() => {
        if (lastOverIdRef.current === overId && lastHoverModeRef.current === 'reorder') {
          previewReorder(draggedId, overId)
        }
      }, REORDER_HOVER_DELAY)
    }
  }

  const handleDragMove = (event: DragMoveEvent) => {
    handleDragHover(event)
  }

  // 拖拽过程中处理（悬停检测）
  const handleDragOver = (event: DragOverEvent) => {
    handleDragHover(event)
  }

  const handleDragCancel = () => {
    clearDragHoverTimers()
    setActiveId(null)
    lastOverIdRef.current = null
    lastHoverModeRef.current = null
    didPreviewReorderRef.current = false
    didMergeFolderRef.current = false

    if (originalAppsRef.current) {
      setApps(originalAppsRef.current)
      latestAppsRef.current = originalAppsRef.current
      originalAppsRef.current = null
    }
  }

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    clearDragHoverTimers()

    // 获取待执行操作和最后悬停目标（在重置之前保存）
    const lastOverId = lastOverIdRef.current
    const didPreviewReorder = didPreviewReorderRef.current
    const didMergeFolder = didMergeFolderRef.current

    // 重置状态
    setActiveId(null)
    lastOverIdRef.current = null
    lastHoverModeRef.current = null
    didPreviewReorderRef.current = false
    didMergeFolderRef.current = false
    originalAppsRef.current = null

    if (didMergeFolder) {
      return
    }

    if (didPreviewReorder) {
      try {
        await appGridService.updateOrder(latestAppsRef.current)
      } catch (error) {
        console.error('保存排序失败:', error)
        message.error('排序保存失败，请重试')
        await loadApps()
      }
      return
    }

    if (!over) {
      return
    }

    const draggedId = active.id as string
    const droppedOnId = over.id as string

    // 防止自己拖到自己身上
    if (draggedId === droppedOnId) return

    // 查找节点
    const draggedNode = apps.find((app) => app.id === draggedId)
    const droppedOnNode = apps.find((app) => app.id === droppedOnId)

    // 检查是否是从文件夹内拖出的图标
    const parentFolder = apps.find(
      (app) => app.type === 'folder' && app.children.some((child) => child.id === draggedId)
    ) as AppFolder | undefined

    // 如果拖拽到主页网格（从文件夹拖拽到主页）
    if (over.id === 'main-grid') {
      if (parentFolder) {
        try {
          await moveFromFolder({ itemId: draggedId, folderId: parentFolder.id })
          message.success('图标已移出文件夹')
          setTimeout(() => {
            if (openedFolderId === parentFolder.id) {
              handleFolderClose()
            }
          }, 300)
        } catch (error) {
          console.error('移出文件夹失败:', error)
          message.error('移出失败')
        }
      }
      return
    }

    // 如果拖拽到文件夹上 - 只有当最终放开位置确实在文件夹上时才移入
    if (droppedOnNode && droppedOnNode.type === 'folder') {
      // 检查最后悬停的目标是否就是这个文件夹
      if (lastOverId === droppedOnId) {
        if (draggedNode && draggedNode.type === 'item') {
          try {
            await moveToFolder({ itemId: draggedId, folderId: droppedOnId })
            message.success('已移入文件夹')
          } catch (error) {
            console.error('移入文件夹失败:', error)
            message.error('移入失败')
          }
        }
      }
      return
    }

    // 主页图标之间的拖拽 - 根据悬停时间判断操作
    if (
      draggedNode &&
      draggedNode.type === 'item' &&
      droppedOnNode &&
      droppedOnNode.type === 'item' &&
      !parentFolder
    ) {
      const oldIndex = visibleApps.findIndex((app) => app.id === draggedId)
      const newIndex = visibleApps.findIndex((app) => app.id === droppedOnId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        try {
          await handleReorder(oldIndex, newIndex)
        } catch (error) {
          console.error('排序失败:', error)
          message.error('排序失败')
        }
      }
      return
    }

    // 文件夹的排序 - 文件夹拖拽到其他位置
    if (draggedNode && draggedNode.type === 'folder' && !parentFolder) {
      const oldIndex = visibleApps.findIndex((app) => app.id === draggedId)
      const newIndex = visibleApps.findIndex((app) => app.id === droppedOnId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log('执行文件夹排序操作')
        try {
          await handleReorder(oldIndex, newIndex)
        } catch (error) {
          console.error('文件夹排序失败:', error)
          message.error('排序失败')
        }
      }
      return
    }

    console.log('其他情况，不做处理')
  }

  // 处理排序
  const handleReorder = async (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return

    // 获取新的排序
    const newApps = arrayMove([...apps], oldIndex, newIndex)

    // 更新 order 字段
    const updatedApps = newApps.map((app, index) => ({
      ...app,
      order: index
    }))

    // 保存到存储
    try {
      await appGridService.reorder(updatedApps.map((app) => ({ id: app.id, order: app.order })))
      await loadApps()
      console.log('排序完成')
    } catch (error) {
      console.error('排序保存失败:', error)
      throw error
    }
  }

  // 添加应用
  const handleAddApp = () => {
    setEditingApp(null)
    setAddModalOpen(true)
  }

  // 点击文件夹打开弹层
  const handleFolderClick = (folder: AppFolder) => {
    setOpenedFolderId(folder.id)
  }

  // 关闭文件夹弹层
  const handleFolderClose = () => {
    setOpenedFolderId(null)
  }

  // 从文件夹移出图标
  const handleMoveOut = async (itemId: string, folderId: string) => {
    try {
      await moveFromFolder({ itemId, folderId })
      message.success('图标已移出')
    } catch (error) {
      message.error('移出失败')
    }
  }

  // 删除文件夹内图标
  const handleDeleteItem = async (itemId: string) => {
    try {
      await appGridService.delete(itemId)
      message.success('图标已删除')
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 更新文件夹名称或封面
  const handleUpdateFolder = async (id: string, params: { name?: string; icon?: string }) => {
    try {
      await updateFolder(id, params)
    } catch (error) {
      throw error
    }
  }

  // Modal 成功回调
  const handleModalSuccess = async () => {
    await loadApps()
  }

  const openedFolder = openedFolderId
    ? (apps.find((a) => a.id === openedFolderId && a.type === 'folder') as AppFolder)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(styles.appGridContainer, {
          [styles.editModeContainer]: isEditMode
        })}
        onClick={handleContainerClick}
        onContextMenu={handleContainerContextMenu}
      >
        {/* 添加按钮 */}
        <div className={styles.addBtnWrapper}>
          <Button type='primary' icon={<PlusOutlined />} onClick={handleAddApp} size='small'>
            添加应用
          </Button>

          {isEditMode && (
            <Button onClick={exitEditMode} size='small' className={cn(styles.doneBtn)}>
              完成
            </Button>
          )}
        </div>

        {/* 应用网格 */}
        <SortableContext items={visibleApps.map((app) => app.id)} strategy={delayedReorderStrategy}>
          <div className={styles.appGrid} style={{ gap: `${iconSettings.spacing}px` }}>
            {visibleApps.map((node) =>
              node.type === 'folder' ? (
                <DroppableFolder
                  key={node.id}
                  folder={node as AppFolder}
                  isEditMode={isEditMode}
                  iconSettings={iconSettings}
                  onDelete={handleDelete}
                  onContextMenu={handleContextMenu}
                  onLongPress={handleLongPress}
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
                  onLongPress={handleLongPress}
                />
              )
            )}
          </div>
        </SortableContext>

        {/* 右键菜单 */}
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
            onCreateFolderRequested={handleCreateFolderRequested}
          />
        )}

        {/* 创建文件夹弹窗 */}
        <CreateFolderModal
          visible={createFolderVisible}
          onClose={handleCreateFolderClose}
          onCreateFolder={handleCreateFolder}
        />

        {/* 文件夹弹层 */}
        {openedFolder && (
          <AppFolderPopover
            folder={openedFolder}
            iconSettings={iconSettings}
            visible={!!openedFolderId}
            onClose={handleFolderClose}
            onMoveOut={handleMoveOut}
            onDeleteItem={handleDeleteItem}
            onUpdateFolder={handleUpdateFolder}
          />
        )}

        {/* 添加/编辑 Modal */}
        <AddAppModal
          open={addModalOpen}
          editingApp={editingApp}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>

      {/* 拖拽覆盖层 - 显示拖拽中的图标 */}
      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div
            style={{
              opacity: 0.9,
              transform: 'scale(1.04)',
              cursor: 'grabbing',
              pointerEvents: 'none',
              transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
              filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.18))',
              zIndex: 9999
            }}
          >
            {(() => {
              const activeNode = apps.find((app) => app.id === activeId)
              if (activeNode) {
                if (activeNode.type === 'item') {
                  return (
                    <div className={styles.appIcon}>
                      <div
                        className={styles.iconWrapper}
                        style={{
                          width: iconSettings.size,
                          height: iconSettings.size,
                          borderRadius: iconSettings.radius,
                          opacity: iconSettings.opacity / 100,
                          background: isImageIcon(activeNode.icon) ? undefined : activeNode.iconBg || undefined,
                          transform: 'translateZ(0)',
                          willChange: 'transform'
                        }}
                      >
                        <span className={styles.iconEmoji}>
                          {isImageIcon(activeNode.icon) ? (
                            <img className={styles.iconImg} src={activeNode.icon} alt='' />
                          ) : (
                            activeNode.icon || iconTextFromName(activeNode.name)
                          )}
                        </span>
                      </div>
                      <div
                        className={styles.appName}
                        style={{
                          fontSize: iconSettings.fontSize,
                          color:
                            iconSettings.fontColor === 'light' ? '#ffffff' : 'rgba(0,0,0,0.85)',
                          transform: 'translateZ(0)',
                          willChange: 'transform'
                        }}
                      >
                        {activeNode.name}
                      </div>
                    </div>
                  )
                }
              }
              return null
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default AppGrid

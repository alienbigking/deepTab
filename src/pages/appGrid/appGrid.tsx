import React, { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { Button, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import cn from 'classnames'
import styles from './appGrid.module.less'
import AppIcon from './appIcon'
import ContextMenu from './contextMenu'
import AddAppModal from './addAppModal'
import appGridService from './services/appGrid'
import useAppGridStore from './stores/appGrid'
import type { App, ContextMenuState } from './types/appGrid'
import { initDefaultApps } from './initData'
import { useToast, useNotification, useConfirm } from '@/common/ui'

/**
 * 应用图标网格组件
 * 支持拖拽排序、编辑模式、右键菜单
 */
const AppGrid: React.FC = () => {
  const { apps, isEditMode, setApps, setIsEditMode } = useAppGridStore()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [contextMenuData, setContextMenuData] = useState<ContextMenuState | null>(null)
  const { showToast } = useToast()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 移动 8px 后才开始拖拽,避免与点击冲突
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 初始化加载数据
  useEffect(() => {
    initAndLoadApps()
    message.success('成功弹出了')
  }, [])

  // 初始化并加载应用列表
  const initAndLoadApps = async () => {
    try {
      // 首次使用时初始化默认数据
      await initDefaultApps()
      // 加载数据
      await loadApps()
    } catch (error) {
      console.error('初始化失败:', error)
    }
  }

  // 加载应用列表
  const loadApps = async () => {
    try {
      const data = await appGridService.getList()
      setApps(data)
    } catch (error) {
      console.error('加载应用列表失败:', error)
      showToast('error', '加载应用列表失败')
    }
  }

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = apps.findIndex((app) => app.id === active.id)
      const newIndex = apps.findIndex((app) => app.id === over.id)

      const newApps = arrayMove(apps, oldIndex, newIndex)
      setApps(newApps)

      // 保存新顺序
      try {
        await appGridService.updateOrder(newApps)
      } catch (error) {
        console.error('保存顺序失败:', error)
        showToast('error', '保存顺序失败')
      }
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

  // 删除应用(由图标或右键菜单触发)
  const handleDelete = async (id: string) => {
    console.log('待删除 id =', id)
    try {
      await appGridService.delete(id)
      setApps((prevApps) => {
        const next = prevApps.filter((app) => app.id !== id)
        console.log('删除后 apps 长度:', next.length)
        return next
      })
      showToast('success', '删除成功，应用已从首页移除')
    } catch (error) {
      console.error('删除失败:', error)
      showToast('error', '删除失败，请稍后重试')
    }
  }

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, appId: string) => {
    setContextMenuData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      appId
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
    const app = apps.find((a) => a.id === contextMenuData?.appId)
    if (app) {
      try {
        const normalizedUrl = normalizeUrl(app.url)
        if (!normalizedUrl) {
          showNotification('error', '无效的链接地址')
          closeContextMenu()
          return
        }
        // 使用 Chrome API 在当前标签页打开
        chrome.tabs.getCurrent((tab) => {
          if (tab?.id) {
            chrome.tabs.update(tab.id, { url: normalizedUrl })
          } else {
            // 如果获取不到当前标签页,降级使用 window.location
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
    console.log('新标签页打开链接')
    const app = apps.find((a) => a.id === contextMenuData?.appId)
    console.log('找到的应用:', app)

    // 先关闭菜单,避免后续操作
    closeContextMenu()

    if (app) {
      try {
        const normalizedUrl = normalizeUrl(app.url)
        console.log('规范化后的 URL:', normalizedUrl)
        if (!normalizedUrl) {
          showToast('error', '无效的链接地址')
          return
        }
        // 使用 Chrome API 创建新标签页
        console.log('准备调用 chrome.tabs.create, URL:', normalizedUrl)
        chrome.tabs.create(
          {
            url: normalizedUrl,
            active: true // 激活新标签页
          },
          (tab) => {
            console.log('标签页创建成功:', tab)
            if (chrome.runtime.lastError) {
              console.error('Chrome API 错误:', chrome.runtime.lastError)
              showToast('error', '打开失败')
            } else {
              showToast('success', `已在新标签页打开 ${app.name}`)
            }
          }
        )
      } catch (error) {
        console.error('打开失败:', error)
        showToast('error', '打开失败')
      }
    } else {
      console.log('未找到应用, contextMenuData:', contextMenuData)
    }
  }

  // 右键菜单 - 编辑
  const handleEdit = () => {
    const app = apps.find((a) => a.id === contextMenuData?.appId)
    if (app) {
      setEditingApp(app)
      setAddModalOpen(true)
    }
    closeContextMenu()
  }

  // 右键菜单 - 删除(复用同一删除逻辑, 不再使用 Modal 确认)
  const handleContextDelete = async () => {
    console.log('右键菜单删除点击, contextMenuData =', contextMenuData)

    const appId = contextMenuData?.appId
    console.log('准备弹出自定义 Confirm, appId =', appId)

    if (!appId) {
      console.warn('右键删除时未找到 appId')
      return
    }

    // 先关闭右键菜单,避免遮挡弹窗
    closeContextMenu()

    const ok = await confirm({
      title: '确认删除',
      content: '确定要删除这个应用吗?',
      okText: '删除',
      cancelText: '取消'
    })

    if (ok) {
      await handleDelete(appId)
    }
  }

  // 添加应用
  const handleAddApp = () => {
    setEditingApp(null)
    setAddModalOpen(true)
  }

  // Modal 成功回调
  const handleModalSuccess = () => {
    loadApps()
  }

  return (
    <div
      className={cn(styles.appGridContainer, {
        [styles.editModeContainer]: isEditMode
      })}
      onClick={handleContainerClick}
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={apps.map((app) => app.id)} strategy={rectSortingStrategy}>
          <div className={styles.appGrid}>
            {apps.map((app) => (
              <AppIcon
                key={app.id}
                id={app.id}
                name={app.name}
                icon={app.icon}
                url={app.url}
                isEditMode={isEditMode}
                onDelete={handleDelete}
                onContextMenu={handleContextMenu}
                onLongPress={handleLongPress}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 右键菜单 */}
      {contextMenuData && (
        <ContextMenu
          visible={contextMenuData.visible}
          x={contextMenuData.x}
          y={contextMenuData.y}
          onOpenCurrent={handleOpenCurrent}
          onOpenNew={handleOpenNew}
          onEdit={handleEdit}
          onDelete={handleContextDelete}
          onClose={closeContextMenu}
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
  )
}

export default AppGrid

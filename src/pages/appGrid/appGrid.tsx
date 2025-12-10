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
import { Button, Modal, message } from 'antd'
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

/**
 * 应用图标网格组件
 * 支持拖拽排序、编辑模式、右键菜单
 */
const AppGrid: React.FC = () => {
  const { apps, isEditMode, setApps, setIsEditMode } = useAppGridStore()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [contextMenuData, setContextMenuData] = useState<ContextMenuState | null>(null)

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
      message.error('加载失败')
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
        message.error('保存失败')
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

  // 删除应用
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个应用吗?',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await appGridService.delete(id)
          setApps(apps.filter((app) => app.id !== id))
          message.success('删除成功')
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      }
    })
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

  // 右键菜单 - 在当前标签页打开
  const handleOpenCurrent = () => {
    const app = apps.find((a) => a.id === contextMenuData?.appId)
    if (app) {
      window.location.href = app.url
    }
    closeContextMenu()
  }

  // 右键菜单 - 在新标签页打开
  const handleOpenNew = () => {
    const app = apps.find((a) => a.id === contextMenuData?.appId)
    if (app) {
      window.open(app.url, '_blank')
    }
    closeContextMenu()
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

  // 右键菜单 - 删除
  const handleContextDelete = () => {
    if (contextMenuData?.appId) {
      handleDelete(contextMenuData.appId)
    }
    closeContextMenu()
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

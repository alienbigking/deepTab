import React, { useState } from 'react'
import { Modal, Input, Button, message } from 'antd'
import { CloseOutlined, EditOutlined } from '@ant-design/icons'
import cn from 'classnames'
import styles from './appFolderPopover.module.less'
import type { AppNode, AppItem, AppFolder, IconSettings } from './types/appGrid'
import DraggableFolderIcon from './draggableFolderIcon'

interface AppFolderPopoverProps {
  folder: AppFolder
  iconSettings: IconSettings
  visible: boolean
  onClose: () => void
  onMoveOut: (itemId: string, folderId: string) => Promise<void>
  onDeleteItem: (itemId: string) => void
  onUpdateFolder: (id: string, params: { name?: string; icon?: string }) => Promise<void>
}

/**
 * 文件夹弹层组件
 */
const AppFolderPopover: React.FC<AppFolderPopoverProps> = ({
  folder,
  iconSettings,
  visible,
  onClose,
  onMoveOut,
  onDeleteItem,
  onUpdateFolder
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [folderName, setFolderName] = useState(folder.name)

  // 处理图标点击
  const handleItemClick = (item: AppItem) => {
    if (item.url) {
      const normalizedUrl = item.url.startsWith('http') ? item.url : `https://${item.url}`
      chrome.tabs.create({ url: normalizedUrl, active: true })
    }
  }

  // 保存文件夹名称
  const handleSaveName = async () => {
    if (!folderName.trim()) {
      message.error('请输入文件夹名称')
      return
    }
    try {
      await onUpdateFolder(folder.id, { name: folderName.trim() })
      message.success('文件夹名称已更新')
      setIsEditing(false)
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 渲染文件夹内容
  const renderContent = () => {
    if (folder.children.length === 0) {
      return (
        <div className={styles.emptyFolder}>
          <div className={styles.emptyIcon}>📁</div>
          <div className={styles.emptyText}>文件夹为空</div>
          <div className={styles.emptyHint}>拖拽图标到此处添加</div>
        </div>
      )
    }

    return (
      <div className={styles.folderContent}>
        <div className={styles.folderHeader}>
          {isEditing ? (
            <div className={styles.editName}>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onPressEnter={handleSaveName}
                onBlur={handleSaveName}
                size='small'
                style={{ width: 120 }}
              />
            </div>
          ) : (
            <div className={styles.folderName} onDoubleClick={() => setIsEditing(true)}>
              {folder.name}
            </div>
          )}
          <div className={styles.folderActions}>
            <Button
              type='text'
              size='small'
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
            />
          </div>
        </div>

        <div className={styles.iconGrid}>
          {folder.children.map((item) => (
            <div key={item.id} className={styles.iconWrapper}>
              <DraggableFolderIcon
                icon={item}
                iconSettings={iconSettings}
                onDelete={() => onDeleteItem(item.id)}
                onContextMenu={(e) => {
                  e.stopPropagation()
                  // 可以添加右键菜单逻辑
                }}
              />
              <Button
                type='text'
                size='small'
                className={styles.moveOutBtn}
                onClick={() => onMoveOut(item.id, folder.id)}
              >
                移出
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span className={styles.folderIcon}>{folder.icon}</span>
          <span>{folder.name}</span>
          <span className={styles.folderBadge}>{folder.children.length}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className={styles.folderModal}
    >
      {renderContent()}
    </Modal>
  )
}

export default AppFolderPopover

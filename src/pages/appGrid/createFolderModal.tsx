import React, { useState } from 'react'
import { Modal, Input, message } from 'antd'

interface CreateFolderModalProps {
  visible: boolean
  onClose: () => void
  onCreateFolder: (name: string) => void
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onClose,
  onCreateFolder
}) => {
  const [folderName, setFolderName] = useState('')

  const handleOk = () => {
    if (!folderName.trim()) {
      message.error('请输入文件夹名称')
      return
    }

    onCreateFolder(folderName.trim())
    setFolderName('')
    onClose()
  }

  const handleCancel = () => {
    setFolderName('')
    onClose()
  }

  return (
    <Modal
      title='创建文件夹'
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText='创建'
      cancelText='取消'
      centered
    >
      <Input
        placeholder='请输入文件夹名称'
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onPressEnter={handleOk}
      />
    </Modal>
  )
}

export default CreateFolderModal

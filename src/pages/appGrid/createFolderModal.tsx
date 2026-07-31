import React, { useState } from 'react'
import { Modal, Input, message } from 'antd'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './createFolderModal.module.less'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  const handleOk = () => {
    if (!folderName.trim()) {
      message.error(t('folder.nameRequired', { defaultValue: 'Enter a folder name' }))
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
      title={t('folder.create', { defaultValue: 'Create folder' })}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('common.add')}
      cancelText={t('common.cancel')}
      centered
      rootClassName={styles.createFolderModalRoot}
      className={styles.createFolderModal}
      transitionName=''
      maskTransitionName={modalMaskTransitionName}
      maskStyle={modalMaskStyle}
    >
      <Input
        placeholder={t('folder.namePlaceholder', { defaultValue: 'Enter a folder name' })}
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onPressEnter={handleOk}
      />
    </Modal>
  )
}

export default CreateFolderModal

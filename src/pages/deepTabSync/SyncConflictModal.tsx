import React, { useEffect, useState } from 'react'
import { App, Button, Modal, Space, Typography } from 'antd'
import deepTabSyncService from './services/deepTabSync'
import {
  DEEP_TAB_SYNC_CONFLICT_KEY,
  type DeepTabSyncConflictState
} from './services/syncProtocol'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './syncPresentation.module.less'
import { useTranslation } from 'react-i18next'

const SyncConflictModal: React.FC = () => {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const [conflict, setConflict] = useState<DeepTabSyncConflictState | null>(null)
  const [resolving, setResolving] = useState<'local' | 'merge' | 'cloud' | null>(null)

  const loadConflict = async () => {
    const storage = await chrome.storage.local.get([DEEP_TAB_SYNC_CONFLICT_KEY])
    setConflict(
      (storage[DEEP_TAB_SYNC_CONFLICT_KEY] as DeepTabSyncConflictState | undefined) || null
    )
  }

  useEffect(() => {
    void loadConflict()
    const handleConflict = () => void loadConflict()
    const handleApplied = () => window.location.reload()
    window.addEventListener('dt:autoSyncConflict', handleConflict)
    window.addEventListener('dt:autoSyncApplied', handleApplied)
    return () => {
      window.removeEventListener('dt:autoSyncConflict', handleConflict)
      window.removeEventListener('dt:autoSyncApplied', handleApplied)
    }
  }, [])

  const resolve = async (mode: 'local' | 'merge' | 'cloud') => {
    if (!conflict) return
    setResolving(mode)
    try {
      if (mode === 'local') {
        await deepTabSyncService.uploadLocalToCloud()
      } else if (mode === 'merge') {
        await deepTabSyncService.mergeWithCloud(conflict.cloud)
      } else {
        await deepTabSyncService.downloadCloudToLocal(conflict.cloud)
      }
      await chrome.storage.local.remove([DEEP_TAB_SYNC_CONFLICT_KEY])
      message.success(mode === 'merge' ? t('sync.merged') : t('sync.synced'))
      setConflict(null)
      if (mode !== 'local') window.location.reload()
    } catch (error) {
      console.error('处理同步冲突失败:', error)
      message.error(t('sync.failed'))
    } finally {
      setResolving(null)
    }
  }

  return (
    <Modal
      open={Boolean(conflict)}
      title={t('sync.conflictTitle')}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      centered
      width={520}
      rootClassName={styles.modalRoot}
      className={styles.modal}
      transitionName=''
      maskTransitionName={modalMaskTransitionName}
      maskStyle={modalMaskStyle}
    >
      <Typography.Paragraph type='secondary'>
        {t('sync.conflictDescription')}
      </Typography.Paragraph>
      <Space wrap size={10}>
        <Button
          type='primary'
          loading={resolving === 'local'}
          disabled={Boolean(resolving && resolving !== 'local')}
          onClick={() => void resolve('local')}
        >
          {t('sync.useLocal')}
        </Button>
        <Button
          loading={resolving === 'merge'}
          disabled={Boolean(resolving && resolving !== 'merge')}
          onClick={() => void resolve('merge')}
        >
          {t('sync.merge')}
        </Button>
        <Button
          loading={resolving === 'cloud'}
          disabled={Boolean(resolving && resolving !== 'cloud')}
          onClick={() => void resolve('cloud')}
        >
          {t('sync.useCloud')}
        </Button>
      </Space>
    </Modal>
  )
}

export default SyncConflictModal

import React from 'react'
import { ToastProvider, useToast } from '@/common/toast'
import { ConfirmProvider, useConfirm } from '@/common/confirm'
import { NotificationProvider, useNotification } from '@/common/notification'
import Popconfirm from '@/common/popconfirm'

interface AppUIProviderProps {
  children: React.ReactNode
}

/**
 * 应用层 UI Provider
 * 统一挂载所有自定义 UI 能力(Toast、自定义 Confirm 等)
 */
export const AppUIProvider: React.FC<AppUIProviderProps> = ({ children }) => {
  return (
    <ToastProvider>
      <NotificationProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </NotificationProvider>
    </ToastProvider>
  )
}

export { useToast, useConfirm, useNotification, Popconfirm }

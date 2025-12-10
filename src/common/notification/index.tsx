import React, { createContext, useCallback, useContext, useState } from 'react'
import cn from 'classnames'
import styles from './notification.module.less'

export type NotificationType = 'success' | 'error' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title?: string
  description?: string
}

interface NotificationContextValue {
  showNotification: (type: NotificationType, title: string, description?: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export const useNotification = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return ctx
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([])

  const removeById = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const showNotification = useCallback(
    (type: NotificationType, title: string, description?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setItems((prev) => [...prev, { id, type, title, description }])
      // 默认 15 秒自动消失
      setTimeout(() => {
        removeById(id)
      }, 15000)
    },
    [removeById]
  )

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className={styles.container}>
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(styles.notification, {
              [styles.success]: item.type === 'success',
              [styles.error]: item.type === 'error',
              [styles.info]: item.type === 'info'
            })}
          >
            <button
              className={styles.close}
              onClick={() => removeById(item.id)}
              aria-label='关闭通知'
            >
              ×
            </button>
            {item.title && <div className={styles.title}>{item.title}</div>}
            {item.description && <div className={styles.description}>{item.description}</div>}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

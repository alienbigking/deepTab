import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import cn from 'classnames'
import styles from './notification.module.less'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationItem {
  id: string
  type: NotificationType
  title?: string
  description?: string
  actionText?: string
  actionUrl?: string
  duration?: number
}

interface NotificationContextValue {
  showNotification: (
    type: NotificationType,
    title: string,
    description?: string,
    options?: Pick<NotificationItem, 'actionText' | 'actionUrl' | 'duration'>
  ) => void
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
  const [pausedIds, setPausedIds] = useState<Set<string>>(() => new Set())
  const timersRef = useRef<
    Map<string, { timer: number; startedAt: number; remaining: number }>
  >(new Map())

  const removeById = useCallback((id: string) => {
    const current = timersRef.current.get(id)
    if (current) {
      window.clearTimeout(current.timer)
      timersRef.current.delete(id)
    }
    setPausedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const startTimer = useCallback(
    (id: string, duration: number) => {
      const timer = window.setTimeout(() => {
        removeById(id)
      }, duration)
      timersRef.current.set(id, {
        timer,
        startedAt: Date.now(),
        remaining: duration
      })
    },
    [removeById]
  )

  const pauseTimer = useCallback((id: string) => {
    const current = timersRef.current.get(id)
    if (!current) return
    window.clearTimeout(current.timer)
    timersRef.current.set(id, {
      ...current,
      remaining: Math.max(0, current.remaining - (Date.now() - current.startedAt))
    })
    setPausedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const resumeTimer = useCallback(
    (id: string) => {
      const current = timersRef.current.get(id)
      if (!current) return
      setPausedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      startTimer(id, Math.max(1000, current.remaining))
    },
    [startTimer]
  )

  const showNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      description?: string,
      options?: Pick<NotificationItem, 'actionText' | 'actionUrl' | 'duration'>
    ) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const duration = options?.duration || 10000
      setItems((prev) => [...prev, { id, type, title, description, ...options, duration }])
      startTimer(id, duration)
    },
    [startTimer]
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
              [styles.warning]: item.type === 'warning',
              [styles.info]: item.type === 'info',
              [styles.paused]: pausedIds.has(item.id)
            })}
            onMouseEnter={() => pauseTimer(item.id)}
            onMouseLeave={() => resumeTimer(item.id)}
          >
            <div className={styles.header}>
              {item.title && <div className={styles.title}>{item.title}</div>}
              <button
                className={styles.close}
                onClick={() => removeById(item.id)}
                aria-label='关闭通知'
              >
                ×
              </button>
            </div>
            <div className={styles.body}>
              {item.description && <div className={styles.description}>{item.description}</div>}
              {item.actionText && item.actionUrl && (
                <button
                  type='button'
                  className={styles.action}
                  onClick={() => {
                    chrome.tabs.create({ url: item.actionUrl })
                    removeById(item.id)
                  }}
                >
                  {item.actionText}
                </button>
              )}
            </div>
            <div className={styles.progress}>
              <span
                className={styles.progressBar}
                style={{ animationDuration: `${item.duration || 10000}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

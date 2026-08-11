import React, { useEffect, useRef } from 'react'
import { useNotification } from '@/common/ui'
import deepTabNotificationService from './services/deepTabNotification'
import type { DeepTabRemoteNotification } from './services/deepTabNotification'

const pollInterval = 60 * 1000
const initialPollDelay = 3 * 1000

const clampDuration = (seconds?: number) => {
  const value = Number(seconds) || 10
  return Math.max(3, Math.min(value, 60)) * 1000
}

const RemoteNotificationBridge: React.FC = () => {
  const { showNotification } = useNotification()
  const showingRef = useRef(false)

  useEffect(() => {
    let disposed = false
    let firstTimer: number | undefined
    let timer: number | undefined

    const showList = async (list: DeepTabRemoteNotification[]) => {
      if (!list.length) return
      showingRef.current = true
      const displayedItems: DeepTabRemoteNotification[] = []

      list.forEach((item, index) => {
        window.setTimeout(() => {
          if (disposed) return
          showNotification(item.type || 'info', item.title, item.content, {
            actionText: item.actionText,
            actionUrl: item.actionUrl,
            duration: clampDuration(item.durationSeconds)
          })
          displayedItems.push(item)
          if (displayedItems.length === list.length) {
            void deepTabNotificationService.markSeen(displayedItems)
            showingRef.current = false
          }
        }, index * 350)
      })
    }

    const load = async () => {
      if (showingRef.current) return
      try {
        const list = await deepTabNotificationService.getUnseenNotifications()
        await showList(list)
      } catch (error) {
        console.warn('获取 DeepTab 后台通知失败:', error)
      }
    }

    firstTimer = window.setTimeout(() => {
      void load()
    }, initialPollDelay)
    timer = window.setInterval(load, pollInterval)

    return () => {
      disposed = true
      if (firstTimer) {
        window.clearTimeout(firstTimer)
      }
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [showNotification])

  return null
}

export default RemoteNotificationBridge

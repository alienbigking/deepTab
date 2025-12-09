import { handleAddTimer, handleRemoveTimer, Timer } from './timer'
import { getTimers, saveTimers, recordRefresh, addRefreshRecord } from './storage'
import { sendManualRefreshEmail } from './emailUtils'
import DayJS from 'dayjs'

interface NotificationSettings {
  enableBrowser: boolean
  enableEmail: boolean
  email: string
  ruleOnStartTimeEnabled: boolean
  ruleOnMaxRunsEnabled: boolean
  ruleOnManualOnceEnabled: boolean
}

const NOTIF_STORAGE_KEY = 'notificationSettings'

const getNotificationSettings = (): Promise<NotificationSettings> =>
  new Promise((resolve) => {
    chrome.storage.local.get([NOTIF_STORAGE_KEY], (res) => {
      const stored = res[NOTIF_STORAGE_KEY] || {}
      const settings: NotificationSettings = {
        enableBrowser: false,
        enableEmail: false,
        email: '',
        ruleOnStartTimeEnabled: false,
        ruleOnMaxRunsEnabled: false,
        ruleOnManualOnceEnabled: false,
        ...stored
      }
      resolve(settings)
    })
  })

const sendBrowserNotification = (title: string, message: string) => {
  console.log('🔧 尝试弹出浏览器通知...', { title, message })
  const iconUrl = chrome.runtime.getURL('src/assets/images/icon128.png')

  // 优先使用 chrome.notifications（如果可用）
  if (chrome.notifications && chrome.notifications.create) {
    try {
      console.log('👉 使用 chrome.notifications.create 弹出通知', { iconUrl })
      chrome.notifications.create('', {
        type: 'basic',
        iconUrl,
        title,
        message,
        priority: 2,
        requireInteraction: true
      })
      console.log('✅ chrome.notifications.create 已调用结束（同步）')
      return
    } catch (e) {
      console.error('❌ 调用 chrome.notifications.create 抛异常: ', e)
    }
  } else {
    console.warn('chrome.notifications 不可用，尝试使用 Service Worker showNotification')
  }

  // 退回到 Service Worker 的 Notification API
  try {
    const sw: any = self as any
    if (sw.registration && sw.registration.showNotification) {
      console.log('👉 使用 self.registration.showNotification 弹出通知', { iconUrl })
      sw.registration.showNotification(title, {
        body: message,
        icon: iconUrl
      })
      console.log('✅ showNotification 已调用结束（同步）')
    } else {
      console.warn('当前环境不支持 self.registration.showNotification')
    }
  } catch (e) {
    console.error('❌ 调用 showNotification 抛异常: ', e)
  }
}

/**
 * 统一处理来自 Popup 或 Content Script 的消息
 * @param message        收到的消息对象
 * @param sendResponse   回调函数，用于异步返回处理结果
 */
export const handleMessage = async (message: any, sendResponse: (res: any) => void) => {
  console.log('📩 收到消息:', message)

  switch (message.type) {
    case 'addTimer': {
      // 🕒 添加定时器
      const { timer } = message
      if (!timer) return sendResponse({ success: false, msg: '无效的定时器数据' })

      // 获取现有定时器列表，并移除相同 tabId 的旧定时器，避免复用旧状态
      const timers = (await getTimers()).filter((t) => t.tabId !== timer.tabId)
      // 将新的定时器添加到列表中
      timers.push(timer)
      // 保存更新后的定时器列表
      saveTimers(timers)
      // 更新 alarms
      handleAddTimer(timers)
      // 返回成功响应
      sendResponse({ success: true })
      break
    }

    // 🔄 立即刷新一次指定定时器
    case 'refreshOnce': {
      const { tabId } = message
      const timers = await getTimers()
      const target = timers.find((t) => t.tabId === tabId)

      if (!target) {
        sendResponse({ success: false, message: 'notFound' })
        break
      }

      // 如果已经达到最大次数，则不再执行
      if (typeof target.maxRuns === 'number' && (target.runCount || 0) >= target.maxRuns) {
        sendResponse({ success: false, message: 'maxRunsReached' })
        break
      }

      chrome.tabs.get(tabId, (tab) => {
        chrome.tabs.reload(tabId, {}, () => {
          if (chrome.runtime.lastError) {
            console.error(`❌ 手动刷新标签页 ${tabId} 失败: ${chrome.runtime.lastError.message}`)
            // 记录失败的手动刷新
            addRefreshRecord({
              taskId: tabId,
              taskTitle: tab?.title || '未知页面',
              taskUrl: tab?.url || '',
              type: 'manual',
              status: 'failed',
              errorMessage: chrome.runtime.lastError.message
            })
            sendResponse({ success: false })
            return
          }

          // 记录成功的手动刷新
          recordRefresh(tabId)
          addRefreshRecord({
            taskId: tabId,
            taskTitle: tab?.title || '未知页面',
            taskUrl: tab?.url || '',
            type: 'manual',
            status: 'success'
          })

          let stopped = false
        const updatedTimers = timers
          .map((t) => {
            if (t.tabId !== tabId) return t
            const runCount = (t.runCount || 0) + 1

            // 如果达到最大次数，则后续从列表中移除
            if (typeof t.maxRuns === 'number' && runCount >= t.maxRuns) {
              stopped = true
            }

            return { ...t, runCount }
          })
          .filter((t) => {
            if (t.tabId !== tabId) return true
            if (!stopped) return true

            // 达到最大次数时清除 alarm
            const alarmName = `timer-${t.tabId}`
            chrome.alarms.clear(alarmName)
            console.log(`⏹️ 手动刷新后已达到最大次数，清除定时器: ${alarmName}`)
            return false
          })

        saveTimers(updatedTimers)

        // 🔔 手动刷新成功后的通知
        getNotificationSettings().then((settings) => {
          if (settings.enableBrowser && settings.ruleOnManualOnceEnabled) {
            const title = 'AutoRefresh'
            const msg = target?.title
              ? `已手动刷新一次：${target.title}`
              : '已手动刷新一次当前页面'
            sendBrowserNotification(title, msg)
          }

          if (settings.enableEmail && settings.ruleOnManualOnceEnabled && settings.email) {
            // 发送手动刷新成功邮件
            sendManualRefreshEmail(
              settings.email,
              target?.title || '未知页面',
              tabId
            )
          }
        })

        sendResponse({ success: true, stopped })
        })
      })

      break
    }

    case 'removeTimer': {
      // 🗑️ 删除定时器
      const { tabId } = message
      // 获取定时器并过滤掉指定 tabId 的定时器
      const timers = (await getTimers()).filter((t) => t.tabId !== tabId)
      // 保存更新后的定时器列表
      saveTimers(timers)
      // 更新 alarms
      handleRemoveTimer(timers)
      // 返回成功响应
      sendResponse({ success: true })
      break
    }

    // ⏯️ 暂停 / 恢复 单个定时器
    case 'togglePauseTimer': {
      const { tabId } = message
      const timers = await getTimers()
      const now = DayJS().valueOf()

      const updatedTimers = timers.map((t) => {
        if (t.tabId !== tabId) return t

        const alarmName = `timer-${t.tabId}`

        // 如果是“暂停”操作
        if (!t.paused) {
          console.log(
            '当前暂停的定时器',
            t,
            '暂停时下次触发时间',
            DayJS(t.nextTriggerTime).format('YYYY-MM-DD HH:mm:ss'),
            '暂停时当前时间：',
            DayJS(now).format('YYYY-MM-DD HH:mm:ss')
          )
          console.log(t.nextTriggerTime, now, '结果：', t.nextTriggerTime - now)

          const remaining = Math.max(t.nextTriggerTime - now, 0)
          chrome.alarms.clear(alarmName)
          console.log(`⏸️ 暂停定时器: ${alarmName}, 剩余 ${Math.round(remaining / 1000)} 秒`)
          return { ...t, paused: true, remaining }
        }

        // 如果是“恢复”操作
        const delayInMinutes = (t.remaining || 0) / 1000 / 60
        chrome.alarms.create(alarmName, { delayInMinutes })
        console.log(`▶️ 恢复定时器: ${alarmName}, 将在 ${Math.round(delayInMinutes * 60)} 秒后触发`)

        return {
          ...t,
          paused: false,
          nextTriggerTime: now + (t.remaining || t.interval * 1000),
          remaining: 0
        }
      })

      console.log('🚀 手动暂停更新定时器列表:', updatedTimers)
      saveTimers(updatedTimers)
      sendResponse({
        success: true,
        paused: updatedTimers.find((t) => t.tabId === tabId)?.paused
      })
      break
    }
    // ⏸️ 暂停所有定时器
    case 'pauseAllTimers': {
      const timers = await getTimers()
      const now = DayJS().valueOf()
      const updatedTimers = timers.map((t) => {
        const remaining = Math.max(t.nextTriggerTime - now, 0)
        chrome.alarms.clear(`timer-${t.tabId}`)
        console.log(`⏸️ 暂停定时器: timer-${t.tabId}, 剩余 ${Math.round(remaining / 1000)} 秒`)
        return { ...t, paused: true, remaining }
      })
      saveTimers(updatedTimers)
      sendResponse({ success: true })
      break
    }

    // ▶️ 恢复所有定时器
    case 'resumeAllTimers': {
      const timers = await getTimers()
      const now = DayJS().valueOf()
      const updatedTimers = timers.map((t) => {
        const delayInMinutes = (t.remaining || 0) / 1000 / 60
        chrome.alarms.create(`timer-${t.tabId}`, { delayInMinutes })
        console.log(
          `▶️ 恢复定时器: timer-${t.tabId}, 将在 ${Math.round(delayInMinutes * 60)} 秒后触发`
        )
        return {
          ...t,
          paused: false,
          nextTriggerTime: now + (t.remaining || t.interval * 1000),
          remaining: 0
        }
      })
      saveTimers(updatedTimers)
      sendResponse({ success: true })
      break
    }

    default:
      // ⚠️ 未知消息类型
      console.warn('⚠️ 未知消息类型:', message.type)
      sendResponse({ success: false, msg: '未知消息类型' })
  }
}

import { getTimers, saveTimers, recordRefresh, addRefreshRecord } from './storage'
import DayJS from 'dayjs'
import { sendTimerStartEmail, sendMaxRunsReachedEmail } from './emailUtils'

/**
 * 定时器接口定义
 * 每个定时器对应一个 Tab 页面
 */
export interface Timer {
  tabId: number // 对应标签页的 ID
  interval: number // 刷新间隔（秒）
  title: string // 标签页标题
  icon: string // 标签页图标 URL
  paused?: boolean // <- 可选字段
  nextTriggerTime: number // 下次触发时间
  remaining: number // 剩余时间（秒）
  maxRuns?: number // 最多刷新次数
  runCount?: number // 已刷新次数
}

/** 内存中的定时器列表 */
let timers: Timer[] = []

interface NotificationSettings {
  enableBrowser: boolean
  enableEmail: boolean
  email: string
  emailRegion: 'cn' | 'global'
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
        emailRegion: 'cn',
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
 * 更新定时器列表
 * - 添加新定时器
 * - 移除已删除的定时器
 * @param newTimers 新的定时器数组
 */
export const handleAddTimer = (newTimers: Timer[]) => {
  console.log('🔧 新增定时器alarms...')
  // 为当前传入的所有定时器同步（包括覆盖已有的同名 alarm）
  const now = Date.now()

  newTimers.forEach(({ tabId, interval, nextTriggerTime }) => {
    const name = `timer-${tabId}`
    const periodInMinutes = interval / 60

    // 如果设置了未来的开始时间，则先延迟到该时间再进入周期刷新
    if (nextTriggerTime && nextTriggerTime > now) {
      const delayInMinutes = (nextTriggerTime - now) / 1000 / 60
      chrome.alarms.create(name, { delayInMinutes, periodInMinutes })
      console.log(
        `✅ 创建延迟定时器: ${name}, 将在 ${Math.round(
          delayInMinutes * 60
        )} 秒后开始，每 ${interval}s 刷新一次`
      )
      return
    }

    // 默认：立即进入周期刷新
    chrome.alarms.create(name, { periodInMinutes })
    console.log(`✅ 创建定时器: ${name}, 每 ${interval}s 刷新一次`)
  })

  // 更新内存中的定时器列表
  timers = [...newTimers]
}

export const handleRemoveTimer = (newTimers: Timer[]) => {
  console.log('🔧 删除定时器alarms...')
  // 找出需要移除的定时器（已被删除的 TabId）
  const removed = timers.filter((t) => !newTimers.find((x) => x.tabId === t.tabId))

  // 清除已移除的定时器对应的 Chrome Alarm
  removed.forEach(({ tabId }) => {
    chrome.alarms.clear(`timer-${tabId}`)
    console.log(`❌ 已清除定时器: timer-${tabId}`)
  })

  // 更新内存中的定时器列表
  timers = [...newTimers]
}

/**
 * 处理 Chrome Alarm 触发事件
 * @param alarm 被触发的 alarm 对象
 */
export const handleAlarm = async (alarm: chrome.alarms.Alarm) => {
  // 匹配 alarm 名称，获取 tabId
  const match = alarm.name.match(/^timer-(\d+)$/)
  if (!match) return

  const tabId = Number(match[1])

  // // 读取当前定时器列表
  const list: Timer[] = await getTimers() || []
  const target = list.find((t: any) => t.tabId === tabId)
  if (!target) {
    console.warn(`⚠️ 未找到 tabId=${tabId} 的定时器`)
    return
  }

  // 🧱 如果已暂停，就不执行也不重建 alarm
  if (target.paused) {
    console.log(`⏸️ 定时器 ${alarm.name} 已暂停，忽略触发`)
    return
  }

  const settings = await getNotificationSettings()

  // 🔢 达到最大刷新次数则自动停止
  if (typeof target.maxRuns === 'number' && (target.runCount || 0) >= target.maxRuns) {
    console.log(`⏹️ 定时器 ${alarm.name} 已达到最大刷新次数，停止`)
    chrome.alarms.clear(alarm.name)
    const remainingTimers = list.filter((t) => t.tabId !== tabId)
    chrome.storage.local.set({ timers: remainingTimers })

    if (settings.enableBrowser && settings.ruleOnMaxRunsEnabled) {
      const title = 'AutoRefresh'
      const msg = target.title
        ? `任务已完成并停止刷新：${target.title}`
        : '定时任务已完成并停止刷新'
      sendBrowserNotification(title, msg)
    }

    if (settings.enableEmail && settings.ruleOnMaxRunsEnabled && settings.email) {
      // 发送任务完成邮件
      sendMaxRunsReachedEmail(
        settings.email,
        target.title || '未知页面',
        tabId,
        target.maxRuns || 0,
        settings.emailRegion
      )
    }

    return
  }

  // 获取对应标签页信息
  chrome.tabs.get(tabId, (tab) => {
    // 标签页不存在或已关闭
    if (chrome.runtime.lastError || !tab) {
      console.warn(`⚠️ 标签页 ${tabId} 不存在，移除定时器`)
      const result = timers.filter((t) => t.tabId !== tabId)
      chrome.storage.local.set({ result }) // 同步存储
      return
    }

    // 刷新标签页
    chrome.tabs.reload(tabId, {}, () => {
      if (chrome.runtime.lastError) {
        console.error(`❌ 刷新标签页 ${tabId} 失败: ${chrome.runtime.lastError.message}`)
        // 记录失败的刷新
        addRefreshRecord({
          taskId: tabId,
          taskTitle: tab.title || '未知页面',
          taskUrl: tab.url || '',
          type: 'auto',
          status: 'failed',
          errorMessage: chrome.runtime.lastError.message
        })
      } else {
        // console.log(`🔄 标签页 ${tabId} 已刷新`)
        // 记录刷新统计
        recordRefresh(tabId)
        // 记录成功的刷新历史
        addRefreshRecord({
          taskId: tabId,
          taskTitle: tab.title || '未知页面',
          taskUrl: tab.url || '',
          type: 'auto',
          status: 'success'
        })
      }

      // 刷新计数 +1，并更新下次触发时间
      const now = Date.now()
      const updatedTimers = list.map((t) => {
        if (t.tabId !== tabId) return t
        const nextTriggerTime = now + t.interval * 1000
        const previousRunCount = t.runCount || 0
        const runCount = previousRunCount + 1

        // ⏰ 首次执行视为“开始时间已到达”
        if (previousRunCount === 0 && settings.enableBrowser && settings.ruleOnStartTimeEnabled) {
          const title = 'AutoRefresh'
          const msg = t.title ? `任务已开始：${t.title}` : '定时任务已开始执行'
          sendBrowserNotification(title, msg)
        }

        if (previousRunCount === 0 && settings.enableEmail && settings.ruleOnStartTimeEnabled && settings.email) {
          // 发送任务开始邮件
          sendTimerStartEmail(
            settings.email,
            t.title || '未知页面',
            tabId,
            settings.emailRegion
          )
        }

        return { ...t, nextTriggerTime, runCount }
      })
      chrome.storage.local.set({ timers: updatedTimers })

      // ✅ 刷新完后重新注册周期 alarm
      const periodInMinutes = target.interval / 60
      chrome.alarms.create(alarm.name, { periodInMinutes })
      console.log(`🔁 定时器 ${alarm.name} 已恢复周期刷新，每 ${target.interval}s 执行一次`)
    })
  })
}

/*
 * 处理倒计时
 * @param 添加的alarm对象
 * */
export const handleCountdown = (alarm: chrome.alarms.Alarm) => {
  // 匹配 alarm 名称，获取 tabId
  const match = alarm.name.match(/^timer-(\d+)$/)
  if (!match) return

  const tabId = Number(match[1])
}

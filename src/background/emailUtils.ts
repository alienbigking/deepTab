/**
 * 邮件发送工具函数
 */

import { EMAIL_API } from './config'

/**
 * 发送定时器启动通知邮件
 */
export async function sendTimerStartEmail(
  to: string,
  title: string,
  tabId: number,
  region: 'cn' | 'global' = 'cn'
) {
  try {
    console.log(`📧 准备发送任务开始邮件到 ${to} (region: ${region})`)
    
    const response = await fetch(EMAIL_API.TIMER_START, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        title,
        tabId,
        region
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ 任务开始邮件发送成功`)
    } else {
      console.error(`❌ 任务开始邮件发送失败:`, result.message)
    }

    return result
  } catch (error) {
    console.error(`❌ 调用邮件 API 失败:`, error)
    return { success: false, message: '网络错误或后端服务未启动' }
  }
}

/**
 * 发送任务完成（达到最大运行次数）通知邮件
 */
export async function sendMaxRunsReachedEmail(
  to: string,
  title: string,
  tabId: number,
  maxRuns: number,
  region: 'cn' | 'global' = 'cn'
) {
  try {
    console.log(`📧 准备发送任务完成邮件到 ${to} (region: ${region})`)
    
    const response = await fetch(EMAIL_API.MAX_RUNS_REACHED, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        title,
        tabId,
        maxRuns,
        region
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ 任务完成邮件发送成功`)
    } else {
      console.error(`❌ 任务完成邮件发送失败:`, result.message)
    }

    return result
  } catch (error) {
    console.error(`❌ 调用邮件 API 失败:`, error)
    return { success: false, message: '网络错误或后端服务未启动' }
  }
}

/**
 * 发送手动刷新成功通知邮件
 */
export async function sendManualRefreshEmail(
  to: string,
  title: string,
  tabId: number,
  region: 'cn' | 'global' = 'cn'
) {
  try {
    console.log(`📧 准备发送手动刷新邮件到 ${to} (region: ${region})`)
    
    const response = await fetch(EMAIL_API.MANUAL_REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        title,
        tabId,
        region
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ 手动刷新邮件发送成功`)
    } else {
      console.error(`❌ 手动刷新邮件发送失败:`, result.message)
    }

    return result
  } catch (error) {
    console.error(`❌ 调用邮件 API 失败:`, error)
    return { success: false, message: '网络错误或后端服务未启动' }
  }
}

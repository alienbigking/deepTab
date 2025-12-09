import { initTimersFromStorage } from './storage'
import { handleAlarm } from './timer'
import { handleMessage } from './message'

// 初始化定时器
initTimersFromStorage()

// 当某个由 chrome.alarms.create() 创建的定时器（alarm）触发时，Chrome 会自动调用这里注册的监听函数。
chrome.alarms.onAlarm.addListener((alarm) => {
  // console.log(`⏰ Alarm triggered: ${alarm.name}`)
  console.log(`⏰ addListener定时器 ${alarm.name} 已触发`)
  handleAlarm(alarm)
})

// 监听 popup 消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sendResponse)
  return true // 异步响应
})

// 监听扩展安装
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ deepTab 扩展已安装')
})

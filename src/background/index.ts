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

// 监听新标签页创建
chrome.tabs.onCreated.addListener((tab) => {
  // 检查是否是新标签页（没有 URL 或者是 chrome://newtab/）
  if (!tab.url || tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/') {
    // 重定向到扩展的新标签页
    if (tab.id) {
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('newtab.html'),
        // 激活标签页,确保获得焦点
        active: true
      })
    }
  }
})

// 监听标签页更新（处理地址栏直接输入 chrome://newtab/ 的情况）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url === 'chrome://newtab/') {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL('newtab.html')
    })
  }
})

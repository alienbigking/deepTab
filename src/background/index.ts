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

// 注意: 由于已经在 manifest.json 中配置了 chrome_url_overrides.newtab
// Chrome 会自动将新标签页重定向到 newtab.html
// 但是为了避免拦截指定了 URL 的新标签页,我们需要更精确的判断

// 监听新标签页创建
chrome.tabs.onCreated.addListener((tab) => {
  console.log('标签页创建:', tab)

  // 只拦截真正的空白新标签页
  // 如果 pendingUrl 存在且不是 chrome://newtab/,说明是指定了 URL 的标签页,不拦截
  if (tab.pendingUrl && tab.pendingUrl !== 'chrome://newtab/') {
    console.log('跳过拦截,这是指定了 URL 的标签页:', tab.pendingUrl)
    return
  }

  // 检查是否是新标签页（没有 URL 或者是 chrome://newtab/）
  if (!tab.url || tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/') {
    console.log('拦截空白新标签页,重定向到扩展页面')
    // 重定向到扩展的新标签页
    if (tab.id) {
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('newtab.html'),
        active: true
      })
    }
  }
})

// 监听标签页更新（处理地址栏直接输入 chrome://newtab/ 的情况）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url === 'chrome://newtab/') {
    console.log('拦截地址栏输入的 chrome://newtab/')
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL('newtab.html')
    })
  }
})

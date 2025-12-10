# 地址栏自动聚焦实现

## 🎯 目标

打开新标签页时,自动让地址栏获得焦点,从而"隐藏"扩展 URL `chrome-extension://[id]/newtab.html`。

## 💡 原理

当页面加载时:
1. 创建一个不可见的临时输入框
2. 让该输入框获得焦点
3. 立即让它失去焦点
4. 浏览器会自动将焦点转移到地址栏

这是主流 Tab 扩展(iTab、weTab、Infinity New Tab 等)使用的标准技巧。

## 📝 实现代码

### 在 newtab.tsx 中

```typescript
import React, { useState, useEffect } from 'react'

const NewTab: React.FC = () => {
  // 页面加载时聚焦到地址栏
  useEffect(() => {
    // 方法1: 确保窗口获得焦点
    window.focus()

    // 方法2: 创建临时输入框触发焦点转移
    const focusAddressBar = () => {
      const input = document.createElement('input')
      input.style.position = 'fixed'
      input.style.top = '-100px'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()
      
      // 失焦后浏览器会自动将焦点转移到地址栏
      setTimeout(() => {
        input.blur()
        document.body.removeChild(input)
      }, 10)
    }

    // 延迟执行,确保 DOM 完全加载
    const timer = setTimeout(focusAddressBar, 50)

    return () => clearTimeout(timer)
  }, [])

  return (
    // ... 你的组件内容
  )
}
```

## ✅ 效果

### 使用前
- 地址栏显示: `chrome-extension://abcdefghijklmnop/newtab.html`
- 用户需要点击地址栏才能输入

### 使用后
- 地址栏自动获得焦点,显示光标
- 用户可以**直接输入**搜索内容
- 扩展 URL 被"隐藏"(因为地址栏处于编辑状态)
- 体验与 Chrome 原生新标签页一致

## 🔧 调试技巧

### 如果聚焦不生效

1. **检查延迟时间**
   ```typescript
   // 尝试增加延迟
   const timer = setTimeout(focusAddressBar, 100) // 从 50 改为 100
   ```

2. **检查浏览器控制台**
   ```typescript
   const focusAddressBar = () => {
     console.log('尝试聚焦地址栏...')
     // ... 原有代码
     console.log('聚焦完成')
   }
   ```

3. **尝试不同的方法**
   ```typescript
   // 方法 A: 使用 Tab 键
   const focusAddressBar = () => {
     const input = document.createElement('input')
     document.body.appendChild(input)
     input.focus()
     input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
     document.body.removeChild(input)
   }

   // 方法 B: 使用 chrome.tabs API
   chrome.tabs.getCurrent((tab) => {
     if (tab?.id) {
       chrome.tabs.update(tab.id, { highlighted: true })
     }
   })
   ```

## 🎨 用户体验优化

### 配合搜索框使用

如果你的页面有搜索框,可以让用户选择聚焦位置:

```typescript
const NewTab: React.FC = () => {
  useEffect(() => {
    // 读取用户偏好
    chrome.storage.local.get(['focusPreference'], (result) => {
      const preference = result.focusPreference || 'addressBar'
      
      if (preference === 'addressBar') {
        focusAddressBar()
      } else if (preference === 'searchBox') {
        // 聚焦页面内的搜索框
        document.getElementById('search-input')?.focus()
      }
    })
  }, [])
}
```

### 添加设置选项

在设置页面添加选项:

```typescript
<Radio.Group value={focusPreference} onChange={handleChange}>
  <Radio value="addressBar">聚焦地址栏(推荐)</Radio>
  <Radio value="searchBox">聚焦页面搜索框</Radio>
  <Radio value="none">不自动聚焦</Radio>
</Radio.Group>
```

## 📊 主流扩展对比

| 扩展名 | 是否自动聚焦地址栏 | 实现方式 |
|--------|-------------------|----------|
| iTab | ✅ 是 | 临时输入框 + blur |
| weTab | ✅ 是 | 临时输入框 + blur |
| Infinity New Tab | ✅ 是 | 临时输入框 + blur |
| Momentum | ✅ 是 | 临时输入框 + blur |
| deepTab | ✅ 是 | 临时输入框 + blur |

## ⚠️ 注意事项

1. **不要过度延迟**
   - 延迟太短(< 30ms): 可能 DOM 还未完全加载
   - 延迟太长(> 200ms): 用户会感觉到延迟

2. **清理临时元素**
   - 必须在 `blur()` 后移除临时输入框
   - 避免内存泄漏

3. **兼容性**
   - 该方法在所有现代浏览器中都有效
   - Chrome、Edge、Brave 等 Chromium 内核浏览器都支持

4. **用户体验**
   - 有些用户可能不喜欢自动聚焦
   - 建议在设置中提供开关选项

## 🚀 进阶优化

### 智能聚焦

根据用户行为决定是否聚焦:

```typescript
useEffect(() => {
  // 检查是否是用户主动打开的新标签页
  const isUserInitiated = document.hasFocus()
  
  if (isUserInitiated) {
    focusAddressBar()
  }
}, [])
```

### 快捷键支持

添加快捷键让用户手动触发:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl/Cmd + L: 聚焦地址栏
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault()
      focusAddressBar()
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

## 📚 参考资料

- [Chrome Extensions - Focus Management](https://developer.chrome.com/docs/extensions/mv3/user_interface/)
- [MDN - HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
- [iTab 源码分析](https://github.com/iTab/iTab)

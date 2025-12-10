# 新标签页实现方式说明

## 🔄 实现方式变更

从 `chrome_url_overrides` 改为 `chrome.tabs` API 实现。

## ✅ 优点

1. **无 Chrome 页脚按钮** - 不会显示"自定义Chrome"按钮
2. **更灵活的控制** - 可以自定义重定向逻辑
3. **主流方案** - iTab、weTab 等主流扩展都使用这种方式

## ⚠️ 缺点

1. **地址栏显示扩展 URL** - 会显示 `chrome-extension://[id]/newtab.html`
2. **轻微闪烁** - 从 `chrome://newtab/` 重定向到扩展页面时可能有短暂闪烁
3. **需要额外权限** - 需要 `tabs` 权限

## 📝 实现原理

### 1. 移除 chrome_url_overrides

```json
// manifest.json - 移除这部分
"chrome_url_overrides": {
  "newtab": "newtab.html"
}
```

### 2. 监听标签页创建

```typescript
// background/index.ts
chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.url || tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/') {
    if (tab.id) {
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('newtab.html')
      })
    }
  }
})
```

### 3. 监听标签页更新

```typescript
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url === 'chrome://newtab/') {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL('newtab.html')
    })
  }
})
```

## 🎯 工作流程

1. 用户打开新标签页
2. Chrome 创建一个空白标签页（URL 为空或 `chrome://newtab/`）
3. `onCreated` 监听器触发
4. 检测到是新标签页,调用 `chrome.tabs.update` 重定向
5. 标签页加载扩展的 `newtab.html`

## 🔧 测试步骤

1. 重新加载扩展
2. 打开新标签页（Ctrl+T 或点击 + 按钮）
3. 应该自动跳转到 deepTab 页面
4. 地址栏显示 `chrome-extension://[id]/newtab.html`
5. **不会显示 Chrome 的页脚按钮**

## 📊 与 chrome_url_overrides 对比

| 特性 | chrome_url_overrides | chrome.tabs API |
|------|---------------------|-----------------|
| Chrome 页脚按钮 | ✅ 有 | ❌ 无 |
| 地址栏 URL | `chrome://newtab/` | `chrome-extension://[id]/newtab.html` |
| 加载速度 | 快 | 略慢（有重定向） |
| 实现复杂度 | 简单 | 中等 |
| 主流扩展使用 | 少 | 多 |

## 🎯 隐藏扩展 URL 的技巧

主流 Tab 插件通过**让地址栏自动获得焦点**来"隐藏"扩展 URL。

### 实现方法

在 `newtab.tsx` 中添加自动聚焦逻辑:

```typescript
useEffect(() => {
  // 确保窗口获得焦点
  window.focus()

  // 创建临时输入框触发焦点转移
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

  const timer = setTimeout(focusAddressBar, 50)
  return () => clearTimeout(timer)
}, [])
```

### 效果

- ✅ 地址栏自动获得焦点,显示光标
- ✅ 用户可以直接输入搜索内容
- ✅ 扩展 URL 被"隐藏"在地址栏中
- ✅ 与 iTab、weTab 等主流扩展体验一致

## 🚀 其他优化建议

### 减少闪烁

可以在 `newtab.html` 中添加预加载动画:

```html
<style>
  body {
    background: #1a1a1a; /* 与你的主题背景色一致 */
  }
  
  #loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>

<div id="loading">加载中...</div>
<div id="root"></div>

<script>
  // React 渲染完成后隐藏 loading
  window.addEventListener('load', () => {
    document.getElementById('loading').style.display = 'none';
  });
</script>
```

### 隐藏扩展 URL

虽然无法完全隐藏,但可以通过以下方式改善:

1. 使用短的扩展名称
2. 在页面标题中显示有意义的信息
3. 添加自定义 favicon

## 🔄 如何切换回 chrome_url_overrides

如果需要切换回原来的方式:

1. 在 `manifest.json` 中恢复:
```json
"chrome_url_overrides": {
  "newtab": "newtab.html"
}
```

2. 在 `background/index.ts` 中移除:
```typescript
// 删除 onCreated 和 onUpdated 监听器
```

3. 重新构建: `npm run build`

## 📚 参考资料

- [Chrome Extensions - Override Pages](https://developer.chrome.com/docs/extensions/mv3/override/)
- [Chrome Extensions - Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)
- [iTab 实现方式分析](https://github.com/iTab/iTab)

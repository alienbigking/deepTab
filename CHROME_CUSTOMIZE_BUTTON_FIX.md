# 移除"自定义Chrome"按钮的解决方案

## 问题描述
Chrome 浏览器在新标签页右下角显示"自定义Chrome"按钮，影响用户体验。

## 已实施的解决方案

### 1. CSS 隐藏（newtab.html）
- 使用 `display: none !important` 隐藏所有可能的按钮元素
- 强制隐藏所有非 root 元素

### 2. JavaScript 动态移除（newtab.html）
- 页面加载时立即执行移除脚本
- 使用 MutationObserver 持续监听 DOM 变化
- 每 100ms 定期检查并移除
- 尝试访问 Shadow DOM 并移除内部元素

### 3. Background Script 注入（background/index.ts）
- 监听新标签页创建事件
- 动态注入脚本移除按钮

## Chrome 浏览器设置检查

### 方法 1: 检查实验性功能
1. 在地址栏输入：`chrome://flags`
2. 搜索以下关键词并**禁用**：
   - `Customize Chrome`
   - `Side Panel`
   - `New Tab Page`
   - `NTP`
3. 重启浏览器

### 方法 2: 检查 Chrome 版本
1. 在地址栏输入：`chrome://version`
2. 查看版本号
3. 如果是 Chrome 114+ 版本，这个按钮可能是强制显示的

### 方法 3: 重置 Chrome 设置
1. 打开设置：`chrome://settings`
2. 点击"重置设置" → "将设置还原为原始默认设置"
3. 重启浏览器

## 为什么 iTab/weTab 没有这个问题？

### 可能的原因：

1. **它们使用了不同的实现方式**
   - 可能使用了 `chrome.tabs` API 而不是 `chrome_url_overrides`
   - 可能通过 content script 重定向而不是直接覆盖

2. **它们可能有特殊的 Chrome Web Store 权限**
   - 商店发布的扩展可能有额外的权限
   - Google 可能对知名扩展有特殊处理

3. **它们可能使用了更高级的技术**
   - 可能使用了未公开的 API
   - 可能通过某种方式绕过了 Chrome 的限制

## 终极解决方案（如果上述方法都无效）

### 方案 A: 接受并优化布局
- 将我们的设置按钮放在左下角（已实现）
- 确保不与 Chrome 的按钮重叠
- 在 UI 设计上与之区分

### 方案 B: 改用 Redirect 方式
不使用 `chrome_url_overrides`，而是：
1. 监听 `chrome.tabs.onCreated`
2. 检测到新标签页时重定向到扩展页面
3. 使用 `chrome-extension://[id]/newtab.html`

```javascript
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.pendingUrl === 'chrome://newtab/' || !tab.url) {
    chrome.tabs.update(tab.id, {
      url: chrome.runtime.getURL('newtab.html')
    });
  }
});
```

### 方案 C: 使用 Content Script
1. 在 manifest.json 中添加 content_scripts
2. 匹配 `chrome://newtab/`
3. 注入自定义内容

## 测试步骤

1. 重新加载扩展
2. 打开新标签页
3. 按 F12 打开开发者工具
4. 在 Console 中输入：
   ```javascript
   document.querySelectorAll('*')
   ```
5. 查看是否有可疑的元素
6. 检查元素的 Shadow DOM

## 调试命令

在新标签页的控制台中运行：

```javascript
// 查找所有可能的按钮
console.log('All buttons:', document.querySelectorAll('button'));

// 查找所有 aria-label 包含 "自定义" 或 "Customize" 的元素
console.log('Customize elements:', 
  document.querySelectorAll('[aria-label*="自定义"], [aria-label*="Customize"]')
);

// 查找所有有 Shadow DOM 的元素
const elementsWithShadow = [];
document.querySelectorAll('*').forEach(el => {
  if (el.shadowRoot) {
    elementsWithShadow.push(el);
  }
});
console.log('Elements with Shadow DOM:', elementsWithShadow);
```

## 联系方式

如果问题仍然存在，请提供：
1. Chrome 版本号
2. 操作系统版本
3. 按钮的截图
4. 控制台的输出

# 🚀 autoRefresh 浏览器插件项目

> **EN**: autoRefresh is a lightweight browser extension that automatically refreshes web pages on a schedule. It supports quick interval presets, scheduled start time, pause / resume all timers, per-tab control, i18n, and now also max refresh count limits.
>
> **中文**：autoRefresh 是一款轻量级浏览器自动刷新插件，支持快捷时间间隔、指定开始时间、一键暂停 / 恢复、按标签页独立控制、多语言，以及单个任务的最大刷新次数限制等功能。

## 🧩 环境要求
- **推荐 Node.js 版本：** Node 18

---

## 🌐 项目简介
浏览器自动刷新插件（autoRefresh）是一款支持定时刷新、智能暂停与恢复的网页刷新工具。

---

## 📦 依赖包说明

| 依赖包 | 说明 |
| :-- | :-- |
| `eslint` | ESLint 的核心包 |
| `prettier` | 代码格式化工具 |
| `eslint-config-prettier` | 关闭不必要的规则，使 Prettier 能正常工作 |
| `eslint-plugin-prettier` | 将 Prettier 作为 ESLint 规则运行 |
| `eslint-plugin-react` | 提供 React 相关的 ESLint 规则 |
| `eslint-plugin-react-hooks` | 提供 React hooks 相关的 ESLint 规则 |

---

## ⚙️ 打包插件

```bash
cd dist
zip -r ../autoRefresh.zip *
```

---

## 🧾 manifest.json 配置说明

### 📁 web_accessible_resources
允许扩展中的资源被网页访问，用于在网页中嵌入或引用扩展的资源。
如果你的扩展需要与网页进行更复杂的交互，或将一些扩展资源应用到网页上，就需要使用这个配置。

```json
"web_accessible_resources": [
  {
    "resources": ["extension/page-script/index.js", "version-*.txt"],
    "matches": ["<all_urls>"]
  }
]
```

> ⚙️ **extension**：这是打包后 dist 里的目录。

---

### 🌐 国际化 (i18n)
已经完成 i18n 翻译，因此 manifest.json 中无需配置：

```json
"default_locale": "zh"
```

---

### 🔐 权限配置（permissions）

#### downloads
用于文件下载权限。

#### scripting
如果插件需要往网页中插入代码、修改 DOM、监听网页事件或改变网页内容，需要使用 `scripting` 权限。

**示例：**
```js
chrome.scripting.executeScript({
  target: { tabId },
  func: () => {
    document.body.style.backgroundColor = 'red';
  }
});
```

---

### 🛡️ 内容安全策略 (CSP)
用于开发环境下支持 LiveReload 自动刷新。

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' http://localhost:35729; object-src 'self'"
}
```

---

### 📜 content_scripts
Chrome 扩展中用于注入网页的脚本配置项。  
它让 JS 文件在用户打开的网页中执行，从而可以读写页面内容、监听事件或与扩展后台通信。

```json
"content_scripts": [
  {
    "js": ["extension/content-script/index.js"],
    "run_at": "document_start",
    "matches": ["<all_urls>"]
  }
]
```

**字段说明：**
- `matches`：定义在哪些页面执行脚本。
- `run_at`：控制执行时机，`document_start` 表示页面加载开始时立即注入。

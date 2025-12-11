import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './src/pages/main'
import './src/i18n'
import './global.less'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { AppUIProvider } from './src/common/ui'
import { setPortalRoot } from './src/common/ui/portalRoot'

let shadowPortalRoot: HTMLElement | null = null

const App: React.FC = () => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'zh' ? zhCN : enUS

  return (
    <AppUIProvider>
      <ConfigProvider
        locale={locale}
        // 确保 antd 的弹层类组件在 Shadow DOM 内渲染
        getPopupContainer={() => shadowPortalRoot || document.body}
      >
        <Main />
      </ConfigProvider>
    </AppUIProvider>
  )
}
// 获取 Shadow DOM 宿主
const host = document.getElementById('root') as HTMLElement

// 创建影子根
const shadowRoot = host.attachShadow({ mode: 'open' })

// 在 Shadow DOM 内创建应用挂载点和弹层挂载点
const appHost = document.createElement('div')
appHost.id = 'app-root'

shadowPortalRoot = document.createElement('div')
shadowPortalRoot.id = 'portal-root'

shadowRoot.appendChild(appHost)
shadowRoot.appendChild(shadowPortalRoot)

// 将弹层容器暴露给其他模块使用（例如自定义 Popconfirm 等自定义弹层）
if (shadowPortalRoot) {
  setPortalRoot(shadowPortalRoot)
}

// 同步现有样式到 Shadow DOM
const syncStyleElement = (el: HTMLStyleElement | HTMLLinkElement) => {
  try {
    const clone = el.cloneNode(true) as HTMLElement
    shadowRoot.appendChild(clone)
  } catch (e) {
    // ignore
  }
}

// 初次同步 document 中已有的样式
document
  .querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]')
  .forEach((el) => syncStyleElement(el))

// 监听后续新增的样式节点（例如 antd CSS-in-JS 动态注入）
const styleObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (
          el.tagName === 'STYLE' ||
          (el.tagName === 'LINK' && (el as HTMLLinkElement).rel === 'stylesheet')
        ) {
          syncStyleElement(el as HTMLStyleElement | HTMLLinkElement)
        }
      }
    })
  }
})

styleObserver.observe(document.head, { childList: true })

// 在 Shadow DOM 内挂载 React 应用
const root = createRoot(appHost)
root.render(<App />)

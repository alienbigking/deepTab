import React, { useState, useEffect } from 'react'
import cn from 'classnames'
import styles from './main.module.less'
import SearchBar from './searchBar/searchBar'
import WidgetsContainer from './widgetsContainer/widgetsContainer'
import AppGrid from './appGrid/appGrid'
import SettingsSidebar from './settingsSidebar/settingsSidebar'
import { SettingOutlined } from '@ant-design/icons'
import WallpaperBackground from './wallpaper/WallpaperBackground'

/**
 * 新标签页主组件
 * 实现类似 macOS 风格的标签页界面
 */
const Main: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 页面加载时清空地址栏并聚焦
  useEffect(() => {
    // 使用 history.replaceState 清空地址栏显示
    window.history.replaceState({}, document.title, '/')

    // 确保窗口获得焦点
    window.focus()

    // 创建临时输入框触发地址栏聚焦
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

  const onOpenSet = () => {
    console.log('触发了')
    setSettingsOpen(true)
  }

  return (
    <div className={cn(styles.container)}>
      <WallpaperBackground />
      <div className={cn(styles.content)}>
        {/* 设置按钮 */}
        <div className={cn(styles.settingsButton)} onClick={() => onOpenSet()}>
          <SettingOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>

        {/* 搜索框 */}
        <SearchBar />

        {/* 小部件区域 */}
        <WidgetsContainer />

        {/* 应用图标网格 */}
        <AppGrid />

        {/* 设置侧边栏 */}
        <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  )
}

export default Main

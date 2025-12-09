import React, { useState } from 'react'
import styles from './newtab.module.less'
import SearchBar from './searchBar/searchBar'
import WidgetsContainer from './widgetsContainer/widgetsContainer'
import AppGrid from './appGrid/appGrid'
import SettingsSidebar from './settingsSidebar/settingsSidebar'
import { SettingOutlined } from '@ant-design/icons'

/**
 * 新标签页主组件
 * 实现类似 macOS 风格的标签页界面
 */
const NewTab: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className={styles.container}>
      {/* 设置按钮 */}
      <div className={styles.settingsButton} onClick={() => setSettingsOpen(!settingsOpen)}>
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
  )
}

export default NewTab

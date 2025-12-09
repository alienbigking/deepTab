import React from 'react'
import styles from './appGrid.module.less'
import AppIcon from './appIcon'

/**
 * 应用图标网格组件
 * 显示常用应用的图标网格
 */
const AppGrid: React.FC = () => {
  // 模拟应用数据，后续从 storage 读取
  const mockApps = [
    { id: '1', name: '微博', icon: '🔴', url: 'https://weibo.com' },
    { id: '2', name: '哔哩哔哩', icon: '🔵', url: 'https://bilibili.com' },
    { id: '3', name: '知乎', icon: '🔵', url: 'https://zhihu.com' },
    { id: '4', name: '淘宝', icon: '🟠', url: 'https://taobao.com' },
    { id: '5', name: 'GitHub', icon: '⚫', url: 'https://github.com' },
    { id: '6', name: 'ChatGPT', icon: '🟢', url: 'https://chat.openai.com' },
    { id: '7', name: 'YouTube', icon: '🔴', url: 'https://youtube.com' },
    { id: '8', name: 'Twitter', icon: '🔵', url: 'https://twitter.com' },
    { id: '9', name: 'Instagram', icon: '🟣', url: 'https://instagram.com' },
    { id: '10', name: 'Facebook', icon: '🔵', url: 'https://facebook.com' },
    { id: '11', name: 'LinkedIn', icon: '🔵', url: 'https://linkedin.com' },
    { id: '12', name: 'Reddit', icon: '🟠', url: 'https://reddit.com' },
    { id: '13', name: 'Netflix', icon: '🔴', url: 'https://netflix.com' },
    { id: '14', name: 'Amazon', icon: '🟡', url: 'https://amazon.com' },
    { id: '15', name: 'Apple', icon: '⚫', url: 'https://apple.com' },
    { id: '16', name: 'Microsoft', icon: '🔵', url: 'https://microsoft.com' },
    { id: '17', name: 'Google', icon: '🔴', url: 'https://google.com' },
    { id: '18', name: 'Spotify', icon: '🟢', url: 'https://spotify.com' }
  ]

  return (
    <div className={styles.appGridContainer}>
      <div className={styles.appGrid}>
        {mockApps.map((app) => (
          <AppIcon key={app.id} name={app.name} icon={app.icon} url={app.url} />
        ))}
      </div>
    </div>
  )
}

export default AppGrid

import React from 'react'
import styles from './appGrid.module.less'

interface AppIconProps {
  name: string
  icon: string
  url: string
}

/**
 * 单个应用图标组件
 */
const AppIcon: React.FC<AppIconProps> = ({ name, icon, url }) => {
  const handleClick = () => {
    window.open(url, '_blank')
  }

  return (
    <div className={styles.appIcon} onClick={handleClick}>
      <div className={styles.iconWrapper}>
        <span className={styles.iconEmoji}>{icon}</span>
      </div>
      <div className={styles.appName}>{name}</div>
    </div>
  )
}

export default AppIcon

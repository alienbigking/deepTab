import React from 'react'
import cn from 'classnames'
import styles from './addAppModalSidebar.module.less'

export type AddAppModalSidebarMode = 'widgets' | 'nav' | 'custom'

interface AddAppModalSidebarProps {
  active: AddAppModalSidebarMode
  onChange: (mode: AddAppModalSidebarMode) => void
}

const AddAppModalSidebar: React.FC<AddAppModalSidebarProps> = ({ active, onChange }) => {
  return (
    <div className={styles.sidebar}>
      <div
        className={cn(styles.item, active === 'widgets' && styles.active)}
        onClick={() => onChange('widgets')}
      >
        小组件
      </div>
      <div
        className={cn(styles.item, active === 'nav' && styles.active)}
        onClick={() => onChange('nav')}
      >
        网址导航
      </div>
      <div
        className={cn(styles.item, active === 'custom' && styles.active)}
        onClick={() => onChange('custom')}
      >
        自定义图标
      </div>
    </div>
  )
}

export default AddAppModalSidebar

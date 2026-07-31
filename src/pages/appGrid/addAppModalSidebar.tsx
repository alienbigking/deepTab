import React from 'react'
import cn from 'classnames'
import styles from './addAppModalSidebar.module.less'
import { useTranslation } from 'react-i18next'

export type AddAppModalSidebarMode = 'widgets' | 'nav' | 'custom'

interface AddAppModalSidebarProps {
  active: AddAppModalSidebarMode
  onChange: (mode: AddAppModalSidebarMode) => void
}

const AddAppModalSidebar: React.FC<AddAppModalSidebarProps> = ({ active, onChange }) => {
  const { t } = useTranslation()
  return (
    <div className={styles.sidebar}>
      <div
        className={cn(styles.item, active === 'widgets' && styles.active)}
        onClick={() => onChange('widgets')}
      >
        {t('addApp.widgets', { defaultValue: 'Widgets' })}
      </div>
      <div
        className={cn(styles.item, active === 'nav' && styles.active)}
        onClick={() => onChange('nav')}
      >
        {t('addApp.navigation', { defaultValue: 'Web shortcuts' })}
      </div>
      <div
        className={cn(styles.item, active === 'custom' && styles.active)}
        onClick={() => onChange('custom')}
      >
        {t('addApp.custom', { defaultValue: 'Custom icon' })}
      </div>
    </div>
  )
}

export default AddAppModalSidebar

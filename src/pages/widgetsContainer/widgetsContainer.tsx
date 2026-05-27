import React from 'react'
import styles from './widgetsContainer.module.less'
import CalendarWidget from './calendarWidget'
import WeatherWidget from './weatherWidget'
import TodoWidget from './todoWidget'
import HotSearchWidget from './hotSearchWidget'

/**
 * 小部件容器组件
 * 包含日历、天气、待办事项三个小部件
 */
const WidgetsContainer: React.FC = () => {
  return (
    <div className={styles.widgetsContainer} data-deeptab-widgets>
      <CalendarWidget />
      <WeatherWidget />
      <TodoWidget />
      <HotSearchWidget />
    </div>
  )
}

export default WidgetsContainer

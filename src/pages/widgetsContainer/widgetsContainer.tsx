import React from 'react'
import styles from './widgetsContainer.module.less'
import CalendarWidget from './calendarWidget'
import WeatherWidget from './weatherWidget'
import TodoWidget from './todoWidget'

/**
 * 小部件容器组件
 * 包含日历、天气、待办事项三个小部件
 */
const WidgetsContainer: React.FC = () => {
  return (
    <div className={styles.widgetsContainer}>
      <CalendarWidget />
      <WeatherWidget />
      <TodoWidget />
    </div>
  )
}

export default WidgetsContainer

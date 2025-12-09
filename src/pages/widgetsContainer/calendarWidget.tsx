import React from 'react'
import { Card } from 'antd'
import styles from './widgets.module.less'
import DayJS from 'dayjs'
import 'dayjs/locale/zh-cn'

/**
 * 日历小部件
 * 显示当前日期、星期
 */
const CalendarWidget: React.FC = () => {
  const today = DayJS()
  const dayOfMonth = today.date()
  const weekday = today.locale('zh-cn').format('dddd')
  const monthYear = today.format('YYYY年M月')

  return (
    <Card className={styles.widgetCard} bordered={false}>
      <div className={styles.calendarWidget}>
        <div className={styles.calendarHeader}>
          <span className={styles.monthYear}>{monthYear}</span>
        </div>
        <div className={styles.calendarDay}>
          <span className={styles.dayNumber}>{dayOfMonth}</span>
        </div>
        <div className={styles.calendarWeekday}>
          <span>{weekday}</span>
        </div>
      </div>
    </Card>
  )
}

export default CalendarWidget

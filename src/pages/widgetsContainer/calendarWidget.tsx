import React, { useMemo, useState } from 'react'
import { Button, Card, Modal, Select, Tooltip } from 'antd'
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './widgets.module.less'
import DayJS from 'dayjs'
import 'dayjs/locale/zh-cn'

interface ICalendarDay {
  key: string
  day: number
  muted: boolean
  today: boolean
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const getWeekOfYear = (date: DayJS.Dayjs) => {
  const firstDay = date.startOf('year')
  const passedDays = date.diff(firstDay, 'day')
  return Math.ceil((passedDays + ((firstDay.day() + 6) % 7) + 1) / 7)
}

const CalendarWidget: React.FC = () => {
  const [open, setOpen] = useState(false)
  const today = DayJS().locale('zh-cn')
  const [viewMonth, setViewMonth] = useState(() => today.startOf('month'))

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 21 }, (_, index) => {
        const year = today.year() - 10 + index
        return { label: `${year}年`, value: year }
      }),
    [today.year()]
  )

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        label: `${index + 1}月`,
        value: index
      })),
    []
  )

  const monthDays = useMemo<ICalendarDay[]>(() => {
    const startOfMonth = viewMonth.startOf('month')
    const leadingCount = (startOfMonth.day() + 6) % 7
    const totalCells = Math.ceil((leadingCount + viewMonth.daysInMonth()) / 7) * 7
    const startDate = startOfMonth.subtract(leadingCount, 'day')

    return Array.from({ length: totalCells }, (_, index) => {
      const date = startDate.add(index, 'day')
      return {
        key: date.format('YYYY-MM-DD'),
        day: date.date(),
        muted: date.month() !== viewMonth.month(),
        today: date.isSame(today, 'day')
      }
    })
  }, [today.format('YYYY-MM-DD'), viewMonth.format('YYYY-MM')])

  const dayOfYear = today.diff(today.startOf('year'), 'day') + 1
  const daysInYear = today.endOf('year').diff(today.startOf('year'), 'day') + 1
  const daysLeft = daysInYear - dayOfYear
  const weekOfYear = getWeekOfYear(today)
  const isCurrentMonth = viewMonth.isSame(today, 'month')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setViewMonth(today.startOf('month'))
    }
  }

  return (
    <>
      <Card className={styles.widgetCard} variant='borderless' onClick={() => handleOpenChange(true)}>
        <div className={styles.calendarWidget}>
          <div className={styles.calendarCompactTop}>
            <span>{today.format('YYYY年M月')}</span>
            <b>{today.format('dddd')}</b>
          </div>
          <div className={styles.calendarCompactMain}>
            <strong>{today.date()}</strong>
            <div>
              <span>今天</span>
              <em>第 {dayOfYear} 天</em>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title='日期'
        open={open}
        onCancel={() => handleOpenChange(false)}
        rootClassName={`${addAppModalStyles.addAppModalRoot} ${styles.widgetModalRoot}`}
        className={styles.widgetModal}
        centered
        width={1000}
        transitionName=''
        maskTransitionName={modalMaskTransitionName}
        maskStyle={modalMaskStyle}
        styles={{ body: { overflow: 'hidden' } }}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.widgetModalBody}>
          <div className={styles.calendarModalHero}>
            <div>
              <span>今天</span>
              <strong>{today.format('YYYY年M月D日')}</strong>
              <em>{today.format('dddd')}</em>
            </div>
            <b>{today.date()}</b>
          </div>

          <div className={styles.calendarModalContent}>
            <section className={styles.calendarMonthPanel}>
              <div className={styles.calendarMonthToolbar}>
                <div className={styles.calendarMonthTitle}>{viewMonth.format('YYYY年M月')}</div>
                <div className={styles.calendarMonthActions}>
                  <Tooltip title='上个月'>
                    <Button
                      size='small'
                      shape='circle'
                      icon={<LeftOutlined />}
                      onClick={() => setViewMonth((value) => value.subtract(1, 'month'))}
                    />
                  </Tooltip>
                  <Select
                    size='small'
                    value={viewMonth.year()}
                    className={styles.calendarYearSelect}
                    options={yearOptions}
                    onChange={(year) => setViewMonth((value) => value.year(year))}
                  />
                  <Select
                    size='small'
                    value={viewMonth.month()}
                    className={styles.calendarMonthSelect}
                    options={monthOptions}
                    onChange={(month) => setViewMonth((value) => value.month(month))}
                  />
                  <Tooltip title='回到今天'>
                    <Button
                      size='small'
                      shape='circle'
                      icon={<ReloadOutlined />}
                      disabled={isCurrentMonth}
                      onClick={() => setViewMonth(today.startOf('month'))}
                    />
                  </Tooltip>
                  <Tooltip title='下个月'>
                    <Button
                      size='small'
                      shape='circle'
                      icon={<RightOutlined />}
                      onClick={() => setViewMonth((value) => value.add(1, 'month'))}
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={styles.calendarWeekdays}>
                {WEEKDAYS.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>
              <div className={styles.calendarGrid}>
                {monthDays.map((item) => (
                  <span
                    key={item.key}
                    className={`${styles.calendarDayCell} ${item.muted ? styles.muted : ''} ${
                      item.today ? styles.today : ''
                    }`}
                  >
                    {item.day}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.calendarInfoPanel}>
              <div className={styles.calendarStats}>
                <div>
                  <span>今年第</span>
                  <strong>{dayOfYear} 天</strong>
                </div>
                <div>
                  <span>本年第</span>
                  <strong>{weekOfYear} 周</strong>
                </div>
                <div>
                  <span>剩余</span>
                  <strong>{daysLeft} 天</strong>
                </div>
              </div>

              <div className={styles.calendarYearProgress}>
                <div>
                  <span>今年进度</span>
                  <strong>{Math.round((dayOfYear / daysInYear) * 100)}%</strong>
                </div>
                <i style={{ width: `${(dayOfYear / daysInYear) * 100}%` }} />
              </div>
            </section>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default CalendarWidget

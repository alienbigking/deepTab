import React, { useMemo, useState } from 'react'
import { Button, Card, Modal, Select, Tooltip } from 'antd'
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import SimpleBar from 'simplebar-react'
import cn from 'classnames'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './widgets.module.less'
import DayJS from 'dayjs'
import 'dayjs/locale/zh-cn'

interface ICalendarDay {
  key: string
  day: number
  date: DayJS.Dayjs
  muted: boolean
  today: boolean
  weekend: boolean
  festival?: string
  solarTerm?: string
  lunarDay?: string
  lunarMonth?: string
  lunarFestival?: string
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const FESTIVALS: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '03-12': '植树节',
  '04-01': '愚人节',
  '05-01': '劳动节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '07-01': '建党节',
  '08-01': '建军节',
  '09-10': '教师节',
  '10-01': '国庆节',
  '10-31': '万圣夜',
  '12-24': '平安夜',
  '12-25': '圣诞节'
}

const SOLAR_TERMS: Record<string, string> = {
  '01-05': '小寒',
  '01-20': '大寒',
  '02-04': '立春',
  '02-19': '雨水',
  '03-05': '惊蛰',
  '03-20': '春分',
  '04-04': '清明',
  '04-20': '谷雨',
  '05-05': '立夏',
  '05-21': '小满',
  '06-05': '芒种',
  '06-21': '夏至',
  '07-07': '小暑',
  '07-22': '大暑',
  '08-07': '立秋',
  '08-23': '处暑',
  '09-07': '白露',
  '09-23': '秋分',
  '10-08': '寒露',
  '10-23': '霜降',
  '11-07': '立冬',
  '11-22': '小雪',
  '12-07': '大雪',
  '12-21': '冬至'
}

const LUNAR_FESTIVALS: Record<string, string> = {
  '正月-1': '春节',
  '正月-15': '元宵',
  '五月-5': '端午',
  '七月-7': '七夕',
  '八月-15': '中秋',
  '九月-9': '重阳',
  '腊月-8': '腊八',
  '腊月-23': '小年'
}

const LUNAR_DAY_TEXT = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十'
]

const getLunarInfo = (date: DayJS.Dayjs) => {
  try {
    const text = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    }).format(date.toDate())
    const match = text.match(/(.+月)(\d+)日/)
    if (!match) return {}
    const lunarMonth = match[1].replace(/^闰/, '')
    const lunarDayNumber = Number(match[2])
    const lunarDay = LUNAR_DAY_TEXT[lunarDayNumber] || `${lunarDayNumber}日`
    return {
      lunarMonth,
      lunarDay,
      lunarFestival: LUNAR_FESTIVALS[`${lunarMonth}-${lunarDayNumber}`]
    }
  } catch {
    return {}
  }
}

const getDayLabel = (date: DayJS.Dayjs) => {
  const key = date.format('MM-DD')
  return getLunarInfo(date).lunarFestival || FESTIVALS[key] || SOLAR_TERMS[key] || ''
}

const getWeekOfYear = (date: DayJS.Dayjs) => {
  const firstDay = date.startOf('year')
  const passedDays = date.diff(firstDay, 'day')
  return Math.ceil((passedDays + ((firstDay.day() + 6) % 7) + 1) / 7)
}

const getFestivalInfo = (date: DayJS.Dayjs) => {
  const todayKey = date.format('MM-DD')
  const todayFestival = getLunarInfo(date).lunarFestival || FESTIVALS[todayKey] || SOLAR_TERMS[todayKey]
  if (todayFestival) {
    return {
      label: `今天是${todayFestival}`,
      detail: '愿今天有一点值得记住'
    }
  }

  const next = Array.from({ length: 370 }, (_, index) => {
    const candidate = date.add(index + 1, 'day')
    const candidateKey = candidate.format('MM-DD')
    const name = getLunarInfo(candidate).lunarFestival || FESTIVALS[candidateKey] || SOLAR_TERMS[candidateKey]
    return name ? { name, days: index + 1 } : null
  }).find(Boolean)

  return {
    label: next ? `下个节日 · ${next.name}` : '近期暂无节日',
    detail: next ? `${next.days} 天后` : '保持好心情'
  }
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
      const lunarInfo = getLunarInfo(date)
      return {
        key: date.format('YYYY-MM-DD'),
        day: date.date(),
        date,
        muted: date.month() !== viewMonth.month(),
        today: date.isSame(today, 'day'),
        weekend: [0, 6].includes(date.day()),
        festival: FESTIVALS[date.format('MM-DD')],
        solarTerm: SOLAR_TERMS[date.format('MM-DD')],
        ...lunarInfo
      }
    })
  }, [today.format('YYYY-MM-DD'), viewMonth.format('YYYY-MM')])

  const currentMonthDays = monthDays.filter((item) => !item.muted)
  const monthWeekendCount = currentMonthDays.filter((item) => item.weekend).length
  const monthMarkedDays = currentMonthDays.filter((item) => item.festival || item.solarTerm || item.lunarFestival)
  const todayLabel = getDayLabel(today)
  const todayLunarInfo = getLunarInfo(today)

  const dayOfYear = today.diff(today.startOf('year'), 'day') + 1
  const daysInYear = today.endOf('year').diff(today.startOf('year'), 'day') + 1
  const daysLeft = daysInYear - dayOfYear
  const weekOfYear = getWeekOfYear(today)
  const isCurrentMonth = viewMonth.isSame(today, 'month')
  const festivalInfo = getFestivalInfo(today)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setViewMonth(today.startOf('month'))
    }
  }

  return (
    <>
      <Card
        className={cn(styles.widgetCard, styles.calendarCard)}
        variant='borderless'
        onClick={() => handleOpenChange(true)}
      >
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
              <div className={styles.calendarCompactMeta}>
                <i>{todayLunarInfo.lunarMonth}{todayLunarInfo.lunarDay}</i>
                {todayLabel && <i>{todayLabel}</i>}
              </div>
            </div>
          </div>
          <div className={styles.calendarFestival}>
            <span>{festivalInfo.label}</span>
            <em>{festivalInfo.detail}</em>
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
              <div className={styles.calendarHeroMeta}>
                <i>{todayLunarInfo.lunarMonth}{todayLunarInfo.lunarDay}</i>
                {(todayLabel || festivalInfo.label) && <i>{todayLabel || festivalInfo.label}</i>}
              </div>
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
                    className={cn(styles.calendarDayCell, {
                      [styles.muted]: item.muted,
                      [styles.today]: item.today,
                      [styles.weekend]: item.weekend && !item.today,
                      [styles.markedDay]: !!(item.festival || item.solarTerm || item.lunarFestival) && !item.today
                    })}
                  >
                    {(item.lunarFestival || item.festival || item.solarTerm) && (
                      <em className={styles.calendarDayTopLabel}>
                        {item.lunarFestival || item.festival || item.solarTerm}
                      </em>
                    )}
                    <b>{item.day}</b>
                    <em>{item.lunarDay || item.lunarMonth}</em>
                  </span>
                ))}
              </div>
            </section>

            <aside className={styles.calendarInfoPanel}>
              <SimpleBar className={`${styles.calendarInfoScroller} dtPrettyScrollbar`} autoHide>
                <section className={styles.calendarInfoPanelInner}>
                  <div className={styles.calendarTodayCard}>
                    <span>今日提示</span>
                    <strong>{todayLabel || (today.day() === 0 || today.day() === 6 ? '周末' : '工作日')}</strong>
                    <em>
                      {festivalInfo.label} · {festivalInfo.detail}
                    </em>
                  </div>

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

                  <div className={styles.calendarMonthSummary}>
                    <div>
                      <span>本月周末</span>
                      <strong>{monthWeekendCount} 天</strong>
                    </div>
                    <div>
                      <span>本月节日/节气</span>
                      <strong>{monthMarkedDays.length} 个</strong>
                    </div>
                  </div>

                  <div className={styles.calendarFestivalList}>
                    <span>本月标记</span>
                    {monthMarkedDays.length ? (
                      monthMarkedDays.map((item) => (
                        <em key={item.key}>
                          {item.date.format('M月D日')} · {item.lunarFestival || item.festival || item.solarTerm}
                        </em>
                      ))
                    ) : (
                      <em>本月暂无节日或节气</em>
                    )}
                  </div>
                </section>
              </SimpleBar>
            </aside>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default CalendarWidget

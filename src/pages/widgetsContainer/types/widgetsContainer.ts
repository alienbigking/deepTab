/**
 * widgetsContainer 模块类型定义
 */

// 天气数据
interface IWeatherData {
  temperature: number
  condition: string
  icon: string
  forecast: IForecastItem[]
}

interface IForecastItem {
  day: string
  icon: string
  temperature: number
}

// 待办事项
interface ITodoItem {
  id: string
  text: string
  time: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
}

// 日历事件
interface ICalendarEvent {
  id: string
  title: string
  date: string
  time: string
  description?: string
}

// 小部件配置
interface IWidgetConfig {
  showCalendar: boolean
  showWeather: boolean
  showTodo: boolean
  weatherCity?: string
}

export { IWeatherData, IForecastItem, ITodoItem, ICalendarEvent, IWidgetConfig }

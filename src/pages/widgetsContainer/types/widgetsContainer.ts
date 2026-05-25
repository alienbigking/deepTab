/**
 * widgetsContainer 模块类型定义
 */

// 天气数据
interface IWeatherData {
  temperature: number
  apparentTemperature?: number
  condition: string
  icon: string
  city?: string
  updatedAt?: string
  humidity?: number
  windSpeed?: number
  windDirection?: number
  pressure?: number
  precipitation?: number
  precipitationProbability?: number
  cloudCover?: number
  uvIndex?: number
  sunrise?: string
  sunset?: string
  hourly?: IHourlyWeatherItem[]
  forecast: IForecastItem[]
}

interface IForecastItem {
  day: string
  icon: string
  condition?: string
  temperature: number
  minTemperature?: number
  precipitationProbability?: number
}

interface IHourlyWeatherItem {
  time: string
  icon: string
  temperature: number
  precipitationProbability?: number
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
  showHotSearch?: boolean
  weatherCity?: string
}

interface IWeatherCity {
  key: string
  name: string
  latitude: number
  longitude: number
}

interface IHotSearchPlatform {
  key: string
  name: string
  shortName: string
  icon: string
  color: string
  path: string
}

interface IHotSearchItem {
  id: string
  title: string
  hot: string
  url?: string
}

interface IHotSearchData {
  platform: IHotSearchPlatform
  updatedAt: string
  items: IHotSearchItem[]
}

export {
  IWeatherData,
  IForecastItem,
  IHourlyWeatherItem,
  ITodoItem,
  ICalendarEvent,
  IWidgetConfig,
  IWeatherCity,
  IHotSearchPlatform,
  IHotSearchItem,
  IHotSearchData
}

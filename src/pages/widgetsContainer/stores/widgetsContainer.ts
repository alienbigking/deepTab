import { atom } from 'recoil'
import { IWeatherData, ITodoItem, IWidgetConfig } from '../types/widgetsContainer'

// 天气数据
const weatherDataStore = atom<IWeatherData | null>({
  key: 'weatherDataStore',
  default: null
})

// 待办事项列表
const todoListStore = atom<ITodoItem[]>({
  key: 'todoListStore',
  default: []
})

// 小部件配置
const widgetConfigStore = atom<IWidgetConfig>({
  key: 'widgetConfigStore',
  default: {
    showCalendar: true,
    showWeather: true,
    showTodo: true,
    weatherCity: '北京'
  }
})

export default { weatherDataStore, todoListStore, widgetConfigStore }

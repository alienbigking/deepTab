import { create } from 'zustand'
import { IWeatherData, ITodoItem, IWidgetConfig } from '../types/widgetsContainer'

interface WidgetsContainerStore {
  weatherData: IWeatherData | null
  todoList: ITodoItem[]
  widgetConfig: IWidgetConfig
  setWeatherData: (data: IWeatherData | null) => void
  setTodoList: (list: ITodoItem[]) => void
  setWidgetConfig: (config: IWidgetConfig) => void
}

export const useWidgetsContainerStore = create<WidgetsContainerStore>((set) => ({
  weatherData: null,
  todoList: [],
  widgetConfig: {
    showCalendar: true,
    showWeather: true,
    showTodo: true,
    weatherCity: '北京'
  },
  setWeatherData: (weatherData) => set({ weatherData }),
  setTodoList: (todoList) => set({ todoList }),
  setWidgetConfig: (widgetConfig) => set({ widgetConfig })
}))

export default useWidgetsContainerStore

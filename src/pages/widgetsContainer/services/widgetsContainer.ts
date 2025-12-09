import { http } from '@/utils'
import { env } from '@/config/env'
import { IWeatherData, ITodoItem, IWidgetConfig } from '../types/widgetsContainer'

/**
 * widgetsContainer 服务层
 */
export default {
  // 获取天气数据
  async getWeather(city: string): Promise<IWeatherData> {
    try {
      const response = await http(`${env.HOST_API_URL}weather`, {
        params: { city }
      })
      return response.data
    } catch (error) {
      console.error('获取天气数据失败:', error)
      // 返回模拟数据
      return {
        temperature: 20,
        condition: '晴天',
        icon: '☀️',
        forecast: [
          { day: '周一', icon: '☀️', temperature: 22 },
          { day: '周二', icon: '🌤️', temperature: 21 },
          { day: '周三', icon: '🌧️', temperature: 18 }
        ]
      }
    }
  },

  // 获取待办事项列表
  async getTodoList(): Promise<ITodoItem[]> {
    try {
      const result = await chrome.storage.local.get(['todoList'])
      return result.todoList || []
    } catch (error) {
      console.error('获取待办事项失败:', error)
      return []
    }
  },

  // 保存待办事项
  async saveTodoItem(item: ITodoItem): Promise<void> {
    try {
      const list = await this.getTodoList()
      const newList = [...list, item]
      await chrome.storage.local.set({ todoList: newList })
    } catch (error) {
      console.error('保存待办事项失败:', error)
    }
  },

  // 更新待办事项
  async updateTodoItem(id: string, updates: Partial<ITodoItem>): Promise<void> {
    try {
      const list = await this.getTodoList()
      const newList = list.map((item) => (item.id === id ? { ...item, ...updates } : item))
      await chrome.storage.local.set({ todoList: newList })
    } catch (error) {
      console.error('更新待办事项失败:', error)
    }
  },

  // 删除待办事项
  async deleteTodoItem(id: string): Promise<void> {
    try {
      const list = await this.getTodoList()
      const newList = list.filter((item) => item.id !== id)
      await chrome.storage.local.set({ todoList: newList })
    } catch (error) {
      console.error('删除待办事项失败:', error)
    }
  },

  // 获取小部件配置
  async getWidgetConfig(): Promise<IWidgetConfig> {
    try {
      const result = await chrome.storage.local.get(['widgetConfig'])
      return (
        result.widgetConfig || {
          showCalendar: true,
          showWeather: true,
          showTodo: true,
          weatherCity: '北京'
        }
      )
    } catch (error) {
      console.error('获取小部件配置失败:', error)
      return {
        showCalendar: true,
        showWeather: true,
        showTodo: true,
        weatherCity: '北京'
      }
    }
  },

  // 保存小部件配置
  async saveWidgetConfig(config: IWidgetConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ widgetConfig: config })
    } catch (error) {
      console.error('保存小部件配置失败:', error)
    }
  }
}

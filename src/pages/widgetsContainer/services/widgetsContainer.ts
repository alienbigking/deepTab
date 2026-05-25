import {
  IHotSearchData,
  IHotSearchItem,
  IHotSearchPlatform,
  IWeatherCity,
  IWeatherData,
  ITodoItem,
  IWidgetConfig
} from '../types/widgetsContainer'

const HOT_SEARCH_API =
  process.env.HOT_SEARCH_API_URL || 'https://api.zxki.cn/api/jhrs?type={platform}'
const HOT_SEARCH_FALLBACK_APIS = [
  'https://dailyhotapi.3yu3.top/{platform}',
  'https://dailyhot.aizhi.ink/{platform}',
  'https://api-hot.imsyy.top/{platform}'
]

const hotSearchPlatforms: IHotSearchPlatform[] = [
  { key: 'baidu', name: '百度·热搜', shortName: '百度热搜', icon: 'du', color: '#4b6bff', path: '/baidu' },
  { key: 'weibo', name: '微博·热搜榜', shortName: '微博', icon: 'wb', color: '#ff5a2f', path: '/weibo' },
  { key: 'zhihu', name: '知乎·热榜', shortName: '知乎', icon: '知', color: '#1677ff', path: '/zhihu' },
  { key: 'weixin', name: '微信·24小时热文榜', shortName: '微信', icon: '微', color: '#20d466', path: '/weixin' },
  { key: 'bilibili', name: '哔哩哔哩·热门', shortName: 'B站', icon: 'bi', color: '#13a8ff', path: '/bilibili' },
  { key: 'thepaper', name: '澎湃·热榜', shortName: '澎湃', icon: 'π', color: '#e91b23', path: '/thepaper' },
  { key: 'douyin', name: '抖音·视频榜', shortName: '抖音', icon: '♪', color: '#111111', path: '/douyin' },
  { key: 'toutiao', name: '今日头条·热文榜', shortName: '头条', icon: '头', color: '#ff3b30', path: '/toutiao' },
  { key: 'sspai', name: '少数派·热门文章', shortName: '少数派', icon: 'π', color: '#e51c23', path: '/sspai' },
  { key: 'csdn', name: 'CSDN·今日热点', shortName: 'CSDN', icon: 'cs', color: '#e2231a', path: '/csdn' }
]

const weatherCities: IWeatherCity[] = [
  { key: 'beijing', name: '北京', latitude: 39.9042, longitude: 116.4074 },
  { key: 'shanghai', name: '上海', latitude: 31.2304, longitude: 121.4737 },
  { key: 'guangzhou', name: '广州', latitude: 23.1291, longitude: 113.2644 },
  { key: 'shenzhen', name: '深圳', latitude: 22.5431, longitude: 114.0579 },
  { key: 'hangzhou', name: '杭州', latitude: 30.2741, longitude: 120.1551 },
  { key: 'chengdu', name: '成都', latitude: 30.5728, longitude: 104.0668 },
  { key: 'wuhan', name: '武汉', latitude: 30.5928, longitude: 114.3055 },
  { key: 'xian', name: '西安', latitude: 34.3416, longitude: 108.9398 },
  { key: 'nanjing', name: '南京', latitude: 32.0603, longitude: 118.7969 },
  { key: 'chongqing', name: '重庆', latitude: 29.563, longitude: 106.5516 }
]

const weatherText = (code: number) => {
  if ([0].includes(code)) return { condition: '晴', icon: '☀️' }
  if ([1, 2].includes(code)) return { condition: '少云', icon: '🌤️' }
  if ([3].includes(code)) return { condition: '阴', icon: '☁️' }
  if ([45, 48].includes(code)) return { condition: '雾', icon: '🌫️' }
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: '毛毛雨', icon: '🌦️' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: '雨', icon: '🌧️' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: '雪', icon: '❄️' }
  if ([95, 96, 99].includes(code)) return { condition: '雷雨', icon: '⛈️' }
  return { condition: '多云', icon: '🌤️' }
}

const cityAliases: Record<string, string> = {
  北京: 'beijing',
  上海: 'shanghai',
  广州: 'guangzhou',
  深圳: 'shenzhen',
  杭州: 'hangzhou',
  成都: 'chengdu',
  武汉: 'wuhan',
  西安: 'xian',
  南京: 'nanjing',
  重庆: 'chongqing'
}

const pickCity = (city: string) => {
  const key = cityAliases[city] || city
  return weatherCities.find((item) => item.key === key || item.name === city) || weatherCities[0]
}

const shortWeekday = (dateText: string, index: number) => {
  if (index === 0) return '今天'
  if (index === 1) return '明天'
  const date = new Date(dateText)
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
}

const formatHour = (time: string) => {
  const date = new Date(time)
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

const fallbackWeather = (city: string): IWeatherData => ({
  temperature: 20,
  apparentTemperature: 21,
  condition: '晴',
  icon: '☀️',
  city,
  updatedAt: new Date().toISOString(),
  humidity: 48,
  windSpeed: 8,
  windDirection: 90,
  pressure: 1012,
  precipitation: 0,
  precipitationProbability: 10,
  cloudCover: 20,
  uvIndex: 4,
  sunrise: '06:12',
  sunset: '18:42',
  hourly: [
    { time: '现在', icon: '☀️', temperature: 20, precipitationProbability: 10 },
    { time: '+1h', icon: '🌤️', temperature: 21, precipitationProbability: 12 },
    { time: '+2h', icon: '🌤️', temperature: 22, precipitationProbability: 8 },
    { time: '+3h', icon: '☁️', temperature: 21, precipitationProbability: 15 },
    { time: '+4h', icon: '☁️', temperature: 20, precipitationProbability: 18 },
    { time: '+5h', icon: '🌧️', temperature: 19, precipitationProbability: 36 }
  ],
  forecast: [
    { day: '今天', icon: '☀️', condition: '晴', temperature: 24, minTemperature: 16, precipitationProbability: 10 },
    { day: '明天', icon: '🌤️', condition: '少云', temperature: 25, minTemperature: 17, precipitationProbability: 12 },
    { day: '周三', icon: '🌧️', condition: '雨', temperature: 21, minTemperature: 15, precipitationProbability: 62 },
    { day: '周四', icon: '☁️', condition: '阴', temperature: 22, minTemperature: 14, precipitationProbability: 30 },
    { day: '周五', icon: '☀️', condition: '晴', temperature: 26, minTemperature: 17, precipitationProbability: 8 }
  ]
})

const fallbackHotSearchTitles: Record<string, string[]> = {
  baidu: [
    '习近平同塞尔维亚总统举行会谈',
    '中方强烈谴责巴基斯坦恐怖袭击事件',
    '1瓶康师傅水蜜桃仅含0.01克水蜜桃汁',
    '多地迎来强降雨 自驾出行需谨慎',
    '印度已经热到近50°C了'
  ],
  weibo: [
    '电影节红毯造型出圈',
    '高考前最后一周如何调整状态',
    '端午假期出游订单增长',
    '新剧开播热度破万',
    '网友晒夏日第一杯冰饮'
  ],
  zhihu: [
    '如何评价今年旗舰手机影像表现',
    '长期坚持运动的人有哪些变化',
    '职场新人如何建立边界感',
    '为什么雨后空气闻起来很清新',
    '有哪些效率工具值得推荐'
  ],
  weixin: [
    '这份防汛避险指南请收好',
    '夏季饮食这些误区要避开',
    '一文看懂医保新变化',
    '孩子近视防控怎么做',
    '夜间开车安全提醒'
  ],
  bilibili: [
    '年度动画名场面盘点',
    '这台复古电脑还能开机吗',
    '三分钟看懂最新发布会',
    '独立游戏试玩体验',
    '城市夜景延时摄影'
  ],
  thepaper: [
    '多地发布强对流天气预警',
    '博物馆夜场预约火热',
    '新一轮消费券即将发放',
    '高校毕业季活动开启',
    '城市更新项目有新进展'
  ],
  douyin: [
    '夏日穿搭挑战',
    '毕业季合照模板',
    '一分钟学会凉面做法',
    '旅行转场视频火了',
    '萌宠听到名字的反应'
  ],
  toutiao: [
    '全国多地气温继续攀升',
    '端午假期铁路客流预测发布',
    '新能源车补能体验升级',
    '社区食堂受到年轻人欢迎',
    '这些防晒误区你中招了吗'
  ],
  sspai: [
    '我的桌面效率改造清单',
    '适合夏天的轻量装备',
    '如何搭建个人知识库',
    '近期值得尝试的独立应用',
    '一周高效工作流分享'
  ],
  csdn: [
    '前端工程化最佳实践总结',
    '大模型应用开发踩坑记录',
    'TypeScript 类型体操入门',
    '数据库索引优化案例',
    '云原生部署清单'
  ]
}

const fallbackHotSearchMore = [
  '多地发布最新出行提醒',
  '年轻人开始重新爱上夜校',
  '这个夏天哪些城市最受欢迎',
  'AI 工具正在改变内容创作',
  '专家提醒高温天注意补水',
  '毕业生租房避坑指南',
  '新能源充电桩覆盖持续提升',
  '周末短途游热度上升',
  '国产游戏新作口碑走高',
  '办公室久坐如何缓解疲劳',
  '社区便民服务有了新变化',
  '多所高校开放暑期预约参观',
  '运动手表健康功能怎么选',
  '家庭收纳改造经验分享',
  '城市骑行路线受到关注'
]

const platformFallbackMore: Record<string, string[]> = {
  baidu: fallbackHotSearchMore,
  weibo: fallbackHotSearchMore.map((title) => `微博热议：${title}`),
  zhihu: fallbackHotSearchMore.map((title) => `如何看待${title}`),
  weixin: fallbackHotSearchMore.map((title) => `公众号热文：${title}`),
  bilibili: fallbackHotSearchMore.map((title) => `B站热门：${title}`),
  thepaper: fallbackHotSearchMore.map((title) => `澎湃关注：${title}`),
  douyin: fallbackHotSearchMore.map((title) => `抖音热榜：${title}`),
  toutiao: fallbackHotSearchMore.map((title) => `头条热议：${title}`),
  sspai: fallbackHotSearchMore.map((title) => `少数派精选：${title}`),
  csdn: fallbackHotSearchMore.map((title) => `开发者热议：${title}`)
}

const hotSearchFallbackTitles = (platform: IHotSearchPlatform) =>
  [
    ...(fallbackHotSearchTitles[platform.key] || fallbackHotSearchTitles.baidu),
    ...(platformFallbackMore[platform.key] || fallbackHotSearchMore)
  ]
    .slice(0, 15)

const hotSearchUrl = (title: string) => `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`

const fallbackHotSearch = (platform: IHotSearchPlatform): IHotSearchData => ({
  platform,
  updatedAt: new Date().toISOString(),
  items: hotSearchFallbackTitles(platform).slice(0, 5).map((title, index) => ({
    id: `${platform.key}_fallback_${index}`,
    title,
    hot: `${(790.49 - index * 9.31).toFixed(2)}万`,
    url: hotSearchUrl(title)
  }))
})

const emptyHotSearch = (platform: IHotSearchPlatform): IHotSearchData => ({
  platform,
  updatedAt: new Date().toISOString(),
  items: []
})

const formatHotValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--'
  if (typeof value === 'number') {
    if (value >= 10000) return `${(value / 10000).toFixed(2)}万`
    return String(value)
  }
  return String(value)
}

const hotSearchApiUrl = (template: string, platform: IHotSearchPlatform) => {
  if (template.includes('{platform}')) {
    return template.replaceAll('{platform}', encodeURIComponent(platform.key))
  }
  return `${template.replace(/\/$/, '')}${platform.path}`
}

const normalizeHotSearchItems = (payload: unknown, platform: IHotSearchPlatform): IHotSearchData => {
  const data = payload as {
    data?: unknown
    list?: unknown
    updateTime?: string
    updatedAt?: string
    time?: string
    update_time?: string
  }
  const rawList = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(payload)
        ? payload
        : []

  const items = rawList
    .reduce<IHotSearchItem[]>((result, raw, index) => {
      const item = raw as Record<string, unknown>
      const title = String(item.title || item.name || item.word || item.keyword || '').trim()
      if (!title || result.some((value) => value.title === title)) return result
      result.push({
        id: `${platform.key}_${String(item.id || item.index || index)}`,
        title,
        hot: formatHotValue(item.hot || item.hotValue || item.desc || item.follow || item.views),
        url: typeof item.url === 'string' ? item.url : hotSearchUrl(title)
      })
      return result
    }, [])

  return {
    platform,
    updatedAt: data?.updateTime || data?.updatedAt || data?.update_time || data?.time || new Date().toISOString(),
    items
  }
}

const fetchWeatherByCity = async (picked: IWeatherCity): Promise<IWeatherData> => {
  const params = new URLSearchParams({
    latitude: String(picked.latitude),
    longitude: String(picked.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
    forecast_days: '5',
    timezone: 'auto'
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!response.ok) throw new Error('weather request failed')
  const data = await response.json()
  const current = weatherText(Number(data?.current?.weather_code || 0))
  const dailyCodes = Array.isArray(data?.daily?.weather_code) ? data.daily.weather_code : []
  const dailyMax = Array.isArray(data?.daily?.temperature_2m_max) ? data.daily.temperature_2m_max : []
  const dailyMin = Array.isArray(data?.daily?.temperature_2m_min) ? data.daily.temperature_2m_min : []
  const dailyPop = Array.isArray(data?.daily?.precipitation_probability_max)
    ? data.daily.precipitation_probability_max
    : []
  const dailyTimes = Array.isArray(data?.daily?.time) ? data.daily.time : []
  const hourlyTimes = Array.isArray(data?.hourly?.time) ? data.hourly.time : []
  const hourlyTemps = Array.isArray(data?.hourly?.temperature_2m) ? data.hourly.temperature_2m : []
  const hourlyCodes = Array.isArray(data?.hourly?.weather_code) ? data.hourly.weather_code : []
  const hourlyPop = Array.isArray(data?.hourly?.precipitation_probability)
    ? data.hourly.precipitation_probability
    : []
  const nowIndex = Math.max(
    0,
    hourlyTimes.findIndex((time: string) => new Date(time).getTime() >= Date.now())
  )

  return {
    temperature: Math.round(Number(data?.current?.temperature_2m || 0)),
    apparentTemperature: Math.round(Number(data?.current?.apparent_temperature || 0)),
    condition: current.condition,
    icon: current.icon,
    city: picked.name,
    updatedAt: data?.current?.time || new Date().toISOString(),
    humidity: Math.round(Number(data?.current?.relative_humidity_2m || 0)),
    windSpeed: Math.round(Number(data?.current?.wind_speed_10m || 0)),
    windDirection: Math.round(Number(data?.current?.wind_direction_10m || 0)),
    pressure: Math.round(Number(data?.current?.pressure_msl || 0)),
    precipitation: Number(data?.current?.precipitation || 0),
    precipitationProbability: Math.round(Number(dailyPop[0] || 0)),
    cloudCover: Math.round(Number(data?.current?.cloud_cover || 0)),
    uvIndex: Math.round(Number(data?.daily?.uv_index_max?.[0] || 0)),
    sunrise: data?.daily?.sunrise?.[0]?.slice(11, 16),
    sunset: data?.daily?.sunset?.[0]?.slice(11, 16),
    hourly: hourlyTimes.slice(nowIndex, nowIndex + 8).map((time: string, offset: number) => {
      const idx = nowIndex + offset
      const info = weatherText(Number(hourlyCodes[idx] || 0))
      return {
        time: offset === 0 ? '现在' : formatHour(time),
        icon: info.icon,
        temperature: Math.round(Number(hourlyTemps[idx] || 0)),
        precipitationProbability: Math.round(Number(hourlyPop[idx] || 0))
      }
    }),
    forecast: dailyCodes.slice(0, 5).map((code: number, index: number) => {
      const info = weatherText(Number(code))
      return {
        day: shortWeekday(dailyTimes[index], index),
        icon: info.icon,
        condition: info.condition,
        temperature: Math.round(Number(dailyMax[index] || 0)),
        minTemperature: Math.round(Number(dailyMin[index] || 0)),
        precipitationProbability: Math.round(Number(dailyPop[index] || 0))
      }
    })
  }
}

export default {
  getWeatherCities(): IWeatherCity[] {
    return weatherCities
  },

  getHotSearchPlatforms(): IHotSearchPlatform[] {
    return hotSearchPlatforms
  },

  async getHotSearch(platformKey = 'baidu'): Promise<IHotSearchData> {
    const platform =
      hotSearchPlatforms.find((item) => item.key === platformKey) || hotSearchPlatforms[0]

    for (const apiTemplate of [HOT_SEARCH_API, ...HOT_SEARCH_FALLBACK_APIS]) {
      try {
        const response = await fetch(hotSearchApiUrl(apiTemplate, platform))
        if (!response.ok) throw new Error('hot search request failed')
        const payload = await response.json()
        const data = normalizeHotSearchItems(payload, platform)
        if (data.items.length > 0) return data
      } catch (error) {
        console.warn(`获取${platform.name}数据失败:`, error)
      }
    }

    return emptyHotSearch(platform)
  },

  async getWeather(city: string): Promise<IWeatherData> {
    try {
      const picked = pickCity(city)
      return await fetchWeatherByCity(picked)
    } catch (error) {
      console.error('获取天气数据失败:', error)
      return fallbackWeather(pickCity(city).name)
    }
  },

  async getWeatherByCoords(latitude: number, longitude: number, name = '当前位置'): Promise<IWeatherData> {
    try {
      return await fetchWeatherByCity({
        key: 'current-location',
        name,
        latitude,
        longitude
      })
    } catch (error) {
      console.error('获取定位天气失败:', error)
      return fallbackWeather(name)
    }
  },

  async getTodoList(): Promise<ITodoItem[]> {
    try {
      const result = await chrome.storage.local.get(['todoList'])
      return result.todoList || []
    } catch (error) {
      console.error('获取待办事项失败:', error)
      return []
    }
  },

  async saveTodoItem(item: ITodoItem): Promise<void> {
    try {
      const list = await this.getTodoList()
      await chrome.storage.local.set({ todoList: [...list, item] })
    } catch (error) {
      console.error('保存待办事项失败:', error)
    }
  },

  async updateTodoItem(id: string, updates: Partial<ITodoItem>): Promise<void> {
    try {
      const list = await this.getTodoList()
      const newList = list.map((item) => (item.id === id ? { ...item, ...updates } : item))
      await chrome.storage.local.set({ todoList: newList })
    } catch (error) {
      console.error('更新待办事项失败:', error)
    }
  },

  async deleteTodoItem(id: string): Promise<void> {
    try {
      const list = await this.getTodoList()
      await chrome.storage.local.set({ todoList: list.filter((item) => item.id !== id) })
    } catch (error) {
      console.error('删除待办事项失败:', error)
    }
  },

  async getWidgetConfig(): Promise<IWidgetConfig> {
    try {
      const result = await chrome.storage.local.get(['widgetConfig'])
      return (
        result.widgetConfig || {
          showCalendar: true,
          showWeather: true,
          showTodo: true,
          weatherCity: 'beijing'
        }
      )
    } catch (error) {
      console.error('获取小组件配置失败:', error)
      return {
        showCalendar: true,
        showWeather: true,
        showTodo: true,
        weatherCity: 'beijing'
      }
    }
  },

  async saveWidgetConfig(config: IWidgetConfig): Promise<void> {
    try {
      await chrome.storage.local.set({ widgetConfig: config })
    } catch (error) {
      console.error('保存小组件配置失败:', error)
    }
  }
}

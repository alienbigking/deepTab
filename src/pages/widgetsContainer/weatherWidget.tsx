import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, Select, Spin, Tooltip } from 'antd'
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons'
import SimpleBar from 'simplebar-react'
import cn from 'classnames'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './widgets.module.less'
import widgetsContainerService from './services/widgetsContainer'
import type { IWeatherData } from './types/widgetsContainer'

const weatherWidgetCache: {
  city: string
  data: IWeatherData | null
  initialized: boolean
  initialPromise: Promise<{ city: string; data: IWeatherData | null }> | null
} = {
  city: 'current-location',
  data: null,
  initialized: false,
  initialPromise: null
}

const windDirectionText = (degree?: number) => {
  if (degree === undefined) return '--'
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return dirs[Math.round(degree / 45) % 8]
}

const getWeatherTheme = (weather?: IWeatherData | null) => {
  const condition = `${weather?.condition || ''}${weather?.icon || ''}`
  if (/雷|⛈/.test(condition)) return 'storm'
  if (/雪|❄/.test(condition)) return 'snow'
  if (/雨|🌧|🌦/.test(condition)) return 'rain'
  if (/雾|霾|🌫/.test(condition)) return 'fog'
  if (/阴|云|☁/.test(condition)) return 'cloudy'
  return 'sunny'
}

const WeatherWidget: React.FC = () => {
  const cities = useMemo(() => widgetsContainerService.getWeatherCities(), [])
  const [data, setData] = useState<IWeatherData | null>(weatherWidgetCache.data)
  const [city, setCity] = useState(weatherWidgetCache.city)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [open, setOpen] = useState(false)

  const loadWeather = async (nextCity = city) => {
    setLoading(true)
    try {
      const weather = await widgetsContainerService.getWeather(nextCity)
      weatherWidgetCache.city = nextCity
      weatherWidgetCache.data = weather
      weatherWidgetCache.initialized = true
      setData(weather)
      setCity(nextCity)
      return weather
    } finally {
      setLoading(false)
    }
  }

  const locateWeather = async (save = true) => {
    if (!navigator.geolocation) {
      await loadWeather('beijing')
      return
    }

    setLocating(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000
        })
      })
      const weather = await widgetsContainerService.getWeatherByCoords(
        position.coords.latitude,
        position.coords.longitude
      )
      weatherWidgetCache.city = 'current-location'
      weatherWidgetCache.data = weather
      weatherWidgetCache.initialized = true
      setData(weather)
      setCity('current-location')
      if (save) {
        const config = await widgetsContainerService.getWidgetConfig()
        await widgetsContainerService.saveWidgetConfig({
          ...config,
          weatherCity: 'current-location',
          weatherCoords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: weather.city
          }
        })
      }
    } catch {
      await loadWeather('beijing')
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      if (weatherWidgetCache.initialized) {
        setCity(weatherWidgetCache.city)
        setData(weatherWidgetCache.data)
        return
      }

      if (weatherWidgetCache.initialPromise) {
        const cached = await weatherWidgetCache.initialPromise
        setCity(cached.city)
        setData(cached.data)
        return
      }

      weatherWidgetCache.initialPromise = (async () => {
        const config = await widgetsContainerService.getWidgetConfig()
        const nextCity = config.weatherCity || 'current-location'
        setCity(nextCity)
        if (nextCity === 'current-location' && !config.weatherCoords) {
          await locateWeather(true)
          return { city: weatherWidgetCache.city, data: weatherWidgetCache.data }
        }
        const weather = await loadWeather(nextCity)
        return { city: nextCity, data: weather }
      })()

      try {
        const cached = await weatherWidgetCache.initialPromise
        setCity(cached.city)
        setData(cached.data)
      } finally {
        weatherWidgetCache.initialPromise = null
      }
    }
    void load()
  }, [])

  const handleCityChange = async (nextCity: string) => {
    setCity(nextCity)
    const config = await widgetsContainerService.getWidgetConfig()
    await widgetsContainerService.saveWidgetConfig({
      ...config,
      weatherCity: nextCity,
      weatherCoords: nextCity === 'current-location' ? config.weatherCoords : undefined
    })
    await loadWeather(nextCity)
  }

  const locate = async () => {
    await locateWeather(true)
  }

  return (
    <>
      <Card
        className={cn(styles.widgetCard, styles.weatherCard, styles[`weatherTheme_${getWeatherTheme(data)}`])}
        variant='borderless'
        onClick={() => setOpen(true)}
      >
        <Spin spinning={loading && !data}>
          <div className={styles.weatherWidget}>
            <div className={styles.weatherCompact}>
              <div className={styles.weatherCompactMain}>
                <span className={styles.weatherCompactIcon}>{data?.icon || '☀️'}</span>
                <div>
                  <div className={styles.weatherCompactCity}>{data?.city || '天气'}</div>
                  <div className={styles.weatherCompactDesc}>{data?.condition || '加载中'}</div>
                </div>
              </div>
              <div className={styles.weatherCompactTemp}>
                <span>{data?.temperature ?? '--'}</span>°
              </div>
            </div>

            <div className={styles.weatherCompactMetrics}>
              <div>
                <strong>{data?.humidity ?? '--'}%</strong>
                <span>湿度</span>
              </div>
              <div>
                <strong>{windDirectionText(data?.windDirection)}</strong>
                <span>风向</span>
              </div>
              <div>
                <strong>{data?.windSpeed ?? '--'}km/h</strong>
                <span>风速</span>
              </div>
              <div>
                <strong>{data?.pressure ?? '--'}</strong>
                <span>百帕</span>
              </div>
            </div>

            <div className={styles.weatherCompactForecast}>
              {(data?.forecast || []).slice(0, 3).map((item) => (
                <div key={item.day}>
                  <span>{item.day}</span>
                  <strong>
                    {item.temperature}°/{item.minTemperature ?? '--'}°
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Spin>
      </Card>

      <Modal
        title='天气'
        open={open}
        onCancel={() => setOpen(false)}
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
          <div className={styles.weatherDetailPanel}>
            <div className={styles.weatherTopbar}>
              <Select
                size='small'
                value={city}
                className={styles.weatherCitySelect}
                options={[
                  ...(city === 'current-location'
                    ? [{ label: data?.city || '当前城市', value: 'current-location' }]
                    : []),
                  ...cities.map((item) => ({ label: item.name, value: item.key }))
                ]}
                onChange={(value) => void handleCityChange(value)}
              />
              <div className={styles.weatherActions}>
                <Tooltip title='定位'>
                  <Button
                    size='small'
                    shape='circle'
                    icon={<EnvironmentOutlined />}
                    loading={locating}
                    onClick={() => void locate()}
                  />
                </Tooltip>
                <Tooltip title='刷新'>
                  <Button
                    size='small'
                    shape='circle'
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={() => void loadWeather()}
                  />
                </Tooltip>
              </div>
            </div>

            <div className={styles.weatherHero}>
              <div>
                <div className={styles.weatherCity}>{data?.city || '加载中'}</div>
                <div className={styles.weatherDesc}>
                  {data?.condition || '--'} · 体感 {data?.apparentTemperature ?? '--'}°
                </div>
                <div className={styles.weatherUpdated}>
                  {data?.updatedAt
                    ? `更新 ${new Date(data.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : ''}
                </div>
              </div>
              <div className={styles.weatherTemp}>
                <span className={styles.weatherIcon}>{data?.icon || '☀️'}</span>
                <span className={styles.tempNumber}>{data?.temperature ?? '--'}</span>
                <span className={styles.tempUnit}>°</span>
              </div>
            </div>

            <div className={styles.weatherMetrics}>
              <div>
                <span>湿度</span>
                <strong>{data?.humidity ?? '--'}%</strong>
              </div>
              <div>
                <span>风</span>
                <strong>
                  {windDirectionText(data?.windDirection)} {data?.windSpeed ?? '--'}km/h
                </strong>
              </div>
              <div>
                <span>降水</span>
                <strong>{data?.precipitationProbability ?? '--'}%</strong>
              </div>
              <div>
                <span>气压</span>
                <strong>{data?.pressure ?? '--'}hPa</strong>
              </div>
              <div>
                <span>云量</span>
                <strong>{data?.cloudCover ?? '--'}%</strong>
              </div>
              <div>
                <span>UV</span>
                <strong>{data?.uvIndex ?? '--'}</strong>
              </div>
            </div>

            <div className={styles.weatherSun}>
              <span>日出 {data?.sunrise || '--'}</span>
              <span>日落 {data?.sunset || '--'}</span>
            </div>

            <SimpleBar className={`${styles.hourlyForecast} dtPrettyScrollbar`} autoHide>
              <div className={styles.hourlyForecastInner}>
                {(data?.hourly || []).map((item) => (
                  <div key={item.time} className={styles.hourlyItem}>
                    <span>{item.time}</span>
                    <b>{item.icon}</b>
                    <strong>{item.temperature}°</strong>
                    <em>{item.precipitationProbability ?? 0}%</em>
                  </div>
                ))}
              </div>
            </SimpleBar>

            <SimpleBar className={`${styles.weatherForecast} dtPrettyScrollbar`} autoHide>
              <div className={styles.weatherForecastInner}>
                {(data?.forecast || []).map((item) => (
                  <div key={item.day} className={styles.forecastItem}>
                    <span>
                      <b>{item.day}</b>
                      <small>{item.date}</small>
                    </span>
                    <span>{item.icon}</span>
                    <strong>{item.temperature}°</strong>
                    <em>{item.minTemperature ?? '--'}°</em>
                    <small>{item.precipitationProbability ?? 0}%</small>
                  </div>
                ))}
              </div>
            </SimpleBar>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WeatherWidget

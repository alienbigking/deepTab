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
import { useTranslation } from 'react-i18next'
import useWidgetsContainerStore from './stores/widgetsContainer'

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
  const dirs = [
    'north',
    'northEast',
    'east',
    'southEast',
    'south',
    'southWest',
    'west',
    'northWest'
  ]
  return dirs[Math.round(degree / 45) % 8]
}

const getWeatherTheme = (weather?: IWeatherData | null) => {
  const condition = `${weather?.condition || ''}${weather?.icon || ''}`
  if (/thunderstorm|⛈/.test(condition)) return 'storm'
  if (/snow|❄/.test(condition)) return 'snow'
  if (/rain|drizzle|🌧|🌦/.test(condition)) return 'rain'
  if (/fog|🌫/.test(condition)) return 'fog'
  if (/cloudy|overcast|☁/.test(condition)) return 'cloudy'
  return 'sunny'
}

const WeatherWidget: React.FC = () => {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage || i18n.language || 'en'
  const conditionText = (condition?: string) =>
    condition ? t(`weather.conditions.${condition}`, { defaultValue: condition }) : '--'
  const directionText = (degree?: number) => {
    const direction = windDirectionText(degree)
    return direction === '--'
      ? direction
      : t(`weather.directions.${direction}`, { defaultValue: direction.toUpperCase() })
  }
  const forecastDayText = (dateText: string, index: number) => {
    if (index === 0) return t('weather.today', { defaultValue: 'Today' })
    if (index === 1) return t('weather.tomorrow', { defaultValue: 'Tomorrow' })
    const date = new Date(dateText)
    return Number.isNaN(date.getTime())
      ? dateText
      : new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
  }
  const forecastDateText = (dateText?: string) => {
    if (!dateText) return ''
    const date = new Date(dateText)
    return Number.isNaN(date.getTime())
      ? dateText
      : new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date)
  }
  const cities = useMemo(() => widgetsContainerService.getWeatherCities(), [])
  const [data, setData] = useState<IWeatherData | null>(weatherWidgetCache.data)
  const [city, setCity] = useState(weatherWidgetCache.city)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [open, setOpen] = useState(false)
  const setWeatherData = useWidgetsContainerStore((state) => state.setWeatherData)

  const loadWeather = async (nextCity = city) => {
    setLoading(true)
    try {
      const weather = await widgetsContainerService.getWeather(nextCity)
      weatherWidgetCache.city = nextCity
      weatherWidgetCache.data = weather
      weatherWidgetCache.initialized = true
      setData(weather)
      setWeatherData(weather)
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
      setWeatherData(weather)
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
        setWeatherData(weatherWidgetCache.data)
        return
      }

      if (weatherWidgetCache.initialPromise) {
        const cached = await weatherWidgetCache.initialPromise
        setCity(cached.city)
        setData(cached.data)
        setWeatherData(cached.data)
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
        setWeatherData(cached.data)
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
        className={cn(
          styles.widgetCard,
          styles.weatherCard,
          styles[`weatherTheme_${getWeatherTheme(data)}`]
        )}
        variant='borderless'
        onClick={() => setOpen(true)}
      >
        <Spin spinning={loading && !data}>
          <div className={styles.weatherWidget}>
            <div className={styles.weatherCompact}>
              <div className={styles.weatherCompactMain}>
                <div>
                  <div className={styles.weatherCompactCity}>
                    {data?.city || t('weather.title', { defaultValue: 'Weather' })}
                  </div>
                  <div className={styles.weatherCompactDesc}>
                    {data ? conditionText(data.condition) : t('common.loading')}
                  </div>
                </div>
              </div>
              <div className={styles.weatherCompactCurrent}>
                <div className={styles.weatherCompactTemp}>
                  <span>{data?.temperature ?? '--'}</span>°
                </div>
                <span className={styles.weatherCompactIcon}>{data?.icon || '☀️'}</span>
              </div>
            </div>

            <div className={styles.weatherCompactMetrics}>
              <div>
                <strong>{data?.humidity ?? '--'}%</strong>
                <span>{t('weather.humidity', { defaultValue: 'Humidity' })}</span>
              </div>
              <div>
                <strong>{directionText(data?.windDirection)}</strong>
                <span>{t('weather.windDirection', { defaultValue: 'Wind' })}</span>
              </div>
              <div>
                <strong>{data?.windSpeed ?? '--'}km/h</strong>
                <span>{t('weather.windSpeed', { defaultValue: 'Wind speed' })}</span>
              </div>
              <div>
                <strong>{data?.pressure ?? '--'}</strong>
                <span>{t('weather.pressure', { defaultValue: 'Pressure' })}</span>
              </div>
            </div>

            <div className={styles.weatherCompactForecast}>
              {(data?.forecast || []).slice(0, 3).map((item, index) => (
                <div key={item.day}>
                  <span>{forecastDayText(item.day, index)}</span>
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
        title={t('weather.title', { defaultValue: 'Weather' })}
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
                    ? [
                        {
                          label:
                            data?.city ||
                            t('weather.currentCity', { defaultValue: 'Current location' }),
                          value: 'current-location'
                        }
                      ]
                    : []),
                  ...cities.map((item) => ({ label: item.name, value: item.key }))
                ]}
                onChange={(value) => void handleCityChange(value)}
              />
              <div className={styles.weatherActions}>
                <Tooltip title={t('weather.locate', { defaultValue: 'Locate' })}>
                  <Button
                    size='small'
                    shape='circle'
                    icon={<EnvironmentOutlined />}
                    loading={locating}
                    onClick={() => void locate()}
                  />
                </Tooltip>
                <Tooltip title={t('common.refresh', { defaultValue: 'Refresh' })}>
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
                <div className={styles.weatherCity}>{data?.city || t('common.loading')}</div>
                <div className={styles.weatherDesc}>
                  {conditionText(data?.condition)} ·{' '}
                  {t('weather.feelsLike', { defaultValue: 'Feels like' })}{' '}
                  {data?.apparentTemperature ?? '--'}°
                </div>
                <div className={styles.weatherUpdated}>
                  {data?.updatedAt
                    ? `${t('weather.updated', { defaultValue: 'Updated' })} ${new Date(
                        data.updatedAt
                      ).toLocaleTimeString(locale, {
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
                <span>{t('weather.humidity', { defaultValue: 'Humidity' })}</span>
                <strong>{data?.humidity ?? '--'}%</strong>
              </div>
              <div>
                <span>{t('weather.wind', { defaultValue: 'Wind' })}</span>
                <strong>
                  {directionText(data?.windDirection)} {data?.windSpeed ?? '--'}km/h
                </strong>
              </div>
              <div>
                <span>{t('weather.precipitation', { defaultValue: 'Precipitation' })}</span>
                <strong>{data?.precipitationProbability ?? '--'}%</strong>
              </div>
              <div>
                <span>{t('weather.pressure', { defaultValue: 'Pressure' })}</span>
                <strong>{data?.pressure ?? '--'}hPa</strong>
              </div>
              <div>
                <span>{t('weather.cloudCover', { defaultValue: 'Cloud cover' })}</span>
                <strong>{data?.cloudCover ?? '--'}%</strong>
              </div>
              <div>
                <span>UV</span>
                <strong>{data?.uvIndex ?? '--'}</strong>
              </div>
            </div>

            <div className={styles.weatherSun}>
              <span>
                {t('weather.sunrise', { defaultValue: 'Sunrise' })} {data?.sunrise || '--'}
              </span>
              <span>
                {t('weather.sunset', { defaultValue: 'Sunset' })} {data?.sunset || '--'}
              </span>
            </div>

            <SimpleBar className={`${styles.hourlyForecast} dtPrettyScrollbar`} autoHide>
              <div className={styles.hourlyForecastInner}>
                {(data?.hourly || []).map((item) => (
                  <div key={item.time} className={styles.hourlyItem}>
                    <span>
                      {item.time === 'now' ? t('weather.now', { defaultValue: 'Now' }) : item.time}
                    </span>
                    <b>{item.icon}</b>
                    <strong>{item.temperature}°</strong>
                    <em>{item.precipitationProbability ?? 0}%</em>
                  </div>
                ))}
              </div>
            </SimpleBar>

            <SimpleBar className={`${styles.weatherForecast} dtPrettyScrollbar`} autoHide>
              <div className={styles.weatherForecastInner}>
                {(data?.forecast || []).map((item, index) => (
                  <div key={item.day} className={styles.forecastItem}>
                    <span>
                      <b>{forecastDayText(item.day, index)}</b>
                      <small>{forecastDateText(item.date)}</small>
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

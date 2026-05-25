import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, Select, Spin, Tooltip } from 'antd'
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import styles from './widgets.module.less'
import widgetsContainerService from './services/widgetsContainer'
import type { IWeatherData } from './types/widgetsContainer'

const windDirectionText = (degree?: number) => {
  if (degree === undefined) return '--'
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return dirs[Math.round(degree / 45) % 8]
}

const WeatherWidget: React.FC = () => {
  const cities = useMemo(() => widgetsContainerService.getWeatherCities(), [])
  const [data, setData] = useState<IWeatherData | null>(null)
  const [city, setCity] = useState('beijing')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [open, setOpen] = useState(false)

  const loadWeather = async (nextCity = city) => {
    setLoading(true)
    try {
      const weather = await widgetsContainerService.getWeather(nextCity)
      setData(weather)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      const config = await widgetsContainerService.getWidgetConfig()
      const nextCity = config.weatherCity || 'beijing'
      setCity(nextCity)
      await loadWeather(nextCity)
    }
    void load()
  }, [])

  const handleCityChange = async (nextCity: string) => {
    setCity(nextCity)
    const config = await widgetsContainerService.getWidgetConfig()
    await widgetsContainerService.saveWidgetConfig({ ...config, weatherCity: nextCity })
    await loadWeather(nextCity)
  }

  const locate = async () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const weather = await widgetsContainerService.getWeatherByCoords(
          position.coords.latitude,
          position.coords.longitude,
          '当前位置'
        )
        setData(weather)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  return (
    <>
      <Card className={styles.widgetCard} variant='borderless' onClick={() => setOpen(true)}>
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
        rootClassName={addAppModalStyles.addAppModalRoot}
        className={styles.widgetModal}
        centered
        width={1000}
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
                options={cities.map((item) => ({ label: item.name, value: item.key }))}
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

            <div className={styles.hourlyForecast}>
              {(data?.hourly || []).map((item) => (
                <div key={item.time} className={styles.hourlyItem}>
                  <span>{item.time}</span>
                  <b>{item.icon}</b>
                  <strong>{item.temperature}°</strong>
                  <em>{item.precipitationProbability ?? 0}%</em>
                </div>
              ))}
            </div>

            <div className={styles.weatherForecast}>
              {(data?.forecast || []).map((item) => (
                <div key={item.day} className={styles.forecastItem}>
                  <span>{item.day}</span>
                  <span>{item.icon}</span>
                  <strong>{item.temperature}°</strong>
                  <em>{item.minTemperature ?? '--'}°</em>
                  <small>{item.precipitationProbability ?? 0}%</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WeatherWidget

import React from 'react'
import { Card } from 'antd'
import styles from './widgets.module.less'

/**
 * 天气小部件
 * 显示当前温度和天气预报（占位）
 */
const WeatherWidget: React.FC = () => {
  return (
    <Card className={styles.widgetCard} bordered={false}>
      <div className={styles.weatherWidget}>
        <div className={styles.weatherTemp}>
          <span className={styles.tempNumber}>20</span>
          <span className={styles.tempUnit}>°</span>
        </div>
        <div className={styles.weatherDesc}>晴天</div>
        <div className={styles.weatherForecast}>
          <div className={styles.forecastItem}>
            <span>周一</span>
            <span>☀️</span>
            <span>22°</span>
          </div>
          <div className={styles.forecastItem}>
            <span>周二</span>
            <span>🌤️</span>
            <span>21°</span>
          </div>
          <div className={styles.forecastItem}>
            <span>周三</span>
            <span>🌧️</span>
            <span>18°</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default WeatherWidget

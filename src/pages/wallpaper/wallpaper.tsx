import React, { useState, useEffect } from 'react'
import { Tabs, Slider } from 'antd'
import styles from './wallpaper.module.less'
import { wallpaperService } from './services'

/**
 * 壁纸选择组件
 */
const Wallpaper: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gradient')
  const [selectedColor, setSelectedColor] = useState('all')
  const [angle, setAngle] = useState(135)
  const [brightness, setBrightness] = useState(100)
  const [gradients, setGradients] = useState<string[]>([])

  useEffect(() => {
    loadGradients()
  }, [])

  const loadGradients = async () => {
    const data = await wallpaperService.getGradientWallpapers()
    setGradients(data.map((item) => item.gradient))
  }

  // 颜色过滤器
  const colors = [
    { key: 'all', color: '#000', label: 'All' },
    { key: 'red', color: '#f44336', label: '红' },
    { key: 'orange', color: '#ff9800', label: '橙' },
    { key: 'yellow', color: '#ffeb3b', label: '黄' },
    { key: 'green', color: '#4caf50', label: '绿' },
    { key: 'cyan', color: '#00bcd4', label: '青' },
    { key: 'blue', color: '#2196f3', label: '蓝' },
    { key: 'purple', color: '#9c27b0', label: '紫' },
    { key: 'gray', color: '#9e9e9e', label: '灰' },
    { key: 'brown', color: '#795548', label: '棕' }
  ]

  return (
    <div className={styles.wallpaperContent}>
      {/* 顶部标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'featured', label: '精选图片' },
          { key: 'dynamic', label: '动态壁纸' },
          { key: 'gradient', label: '渐变背景' }
        ]}
        className={styles.wallpaperTabs}
      />

      {/* 颜色过滤器 */}
      <div className={styles.colorFilters}>
        {colors.map((color) => (
          <div
            key={color.key}
            className={`${styles.colorFilter} ${selectedColor === color.key ? styles.active : ''}`}
            onClick={() => setSelectedColor(color.key)}
          >
            {color.key === 'all' ? (
              <span className={styles.allText}>All</span>
            ) : (
              <div className={styles.colorDot} style={{ background: color.color }} />
            )}
          </div>
        ))}
      </div>

      {/* 渐变色网格 */}
      <div className={styles.gradientGrid}>
        {gradients.map((gradient, index) => (
          <div
            key={index}
            className={styles.gradientCard}
            style={{ background: gradient }}
            onClick={() => {
              console.log('选择渐变:', gradient)
            }}
          />
        ))}
      </div>

      {/* 底部控制器 */}
      <div className={styles.controls}>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>色彩</span>
          <Slider className={styles.slider} defaultValue={50} />
        </div>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>角度</span>
          <div className={styles.angleControl}>
            <span className={styles.angleValue}>{angle}°</span>
          </div>
        </div>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>亮度</span>
          <Slider
            className={styles.slider}
            value={brightness}
            onChange={setBrightness}
            min={0}
            max={200}
          />
        </div>
      </div>
    </div>
  )
}

export default Wallpaper

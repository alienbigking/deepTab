import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Tabs, Slider, Empty, Switch } from 'antd'
import styles from './wallpaper.module.less'
import { wallpaperService } from './services'
import useWallpaperStore from './stores/wallpaper'
import type {
  IGradientWallpaper,
  IImageWallpaper,
  IDynamicWallpaper,
  IWallpaperConfig
} from './types/wallpaper'

/**
 * 壁纸选择组件
 */
const Wallpaper: React.FC = () => {
  const [angle, setAngle] = useState(135)
  const angleValueRef = useRef(angle)
  const [brightness, setBrightness] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [dynamicMuted, setDynamicMuted] = useState(true)
  const [dynamicPaused, setDynamicPaused] = useState(false)
  const [gradients, setGradients] = useState<IGradientWallpaper[]>([])
  const [featuredWallpapers, setFeaturedWallpapers] = useState<IImageWallpaper[]>([])
  const [dynamicWallpapers, setDynamicWallpapers] = useState<IDynamicWallpaper[]>([])
  const {
    config,
    setConfig,
    activeTab,
    setActiveTab,
    selectedColor,
    setSelectedColor,
    featuredCategory,
    setFeaturedCategory
  } = useWallpaperStore()

  useEffect(() => {
    angleValueRef.current = angle
  }, [angle])

  useEffect(() => {
    loadConfig()
    loadGradients()
    loadFeaturedWallpapers()
    loadDynamicWallpapers()
  }, [])

  const loadConfig = async () => {
    const data = await wallpaperService.getWallpaperConfig()
    if (!data) return

    setConfig(data)
    if (typeof data.brightness === 'number') setBrightness(data.brightness)
    if (typeof data.saturation === 'number') setSaturation(data.saturation)
    if (typeof data.blur === 'number') setBlur(data.blur)
    if (typeof data.dynamicMuted === 'boolean') setDynamicMuted(data.dynamicMuted)
    if (typeof data.dynamicPaused === 'boolean') setDynamicPaused(data.dynamicPaused)
    if (typeof data.gradientAngle === 'number') setAngle(data.gradientAngle)
    if (data.featuredCategory) setFeaturedCategory(data.featuredCategory)

    const type = data.currentWallpaper?.type
    if (type === 'image') setActiveTab('featured')
    else if (type === 'dynamic') setActiveTab('dynamic')
    else setActiveTab('gradient')
  }

  const loadGradients = async () => {
    const data = await wallpaperService.getGradientWallpapers()
    setGradients(data)
  }

  const loadFeaturedWallpapers = async () => {
    const data = await wallpaperService.getImageWallpapers()
    setFeaturedWallpapers(data)
  }

  const loadDynamicWallpapers = async () => {
    const data = await wallpaperService.getDynamicWallpapers()
    setDynamicWallpapers(data)
  }

  const featuredCategories = useMemo(() => {
    const base = ['全部', '动物', '植物', '动漫', '街头', '自然', '其他']
    const dynamic = Array.from(new Set(featuredWallpapers.map((w) => w.category))).filter(Boolean)
    const merged = Array.from(new Set([...base, ...dynamic]))
    return merged
  }, [featuredWallpapers])

  const filteredFeaturedWallpapers = useMemo(() => {
    if (featuredCategory === '全部') return featuredWallpapers
    return featuredWallpapers.filter((w) => w.category === featuredCategory)
  }, [featuredCategory, featuredWallpapers])

  const handleCategoryChange = async (category: string) => {
    setFeaturedCategory(category)
    if (!config) return
    const next: IWallpaperConfig = { ...config, featuredCategory: category }
    setConfig(next)
    await wallpaperService.saveWallpaperConfig(next)
  }

  const saveConfig = async (next: IWallpaperConfig) => {
    setConfig(next)
    await wallpaperService.saveWallpaperConfig(next)
  }

  const applyAngleToGradient = (gradient: string, nextAngle: number) => {
    if (!gradient) return gradient
    if (gradient.includes('linear-gradient(')) {
      if (/linear-gradient\(\s*\d+deg/.test(gradient)) {
        return gradient.replace(/linear-gradient\(\s*\d+deg/, `linear-gradient(${nextAngle}deg`)
      }
      return gradient.replace('linear-gradient(', `linear-gradient(${nextAngle}deg, `)
    }
    return gradient
  }

  const hexToRgb = (hex: string) => {
    const raw = hex.replace('#', '').trim()
    if (![3, 6].includes(raw.length)) return null
    const expanded =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    const r = parseInt(expanded.slice(0, 2), 16)
    const g = parseInt(expanded.slice(2, 4), 16)
    const b = parseInt(expanded.slice(4, 6), 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return { r, g, b }
  }

  const rgbToHsl = (rgb: { r: number; g: number; b: number }) => {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1))
      switch (max) {
        case r:
          h = ((g - b) / delta) % 6
          break
        case g:
          h = (b - r) / delta + 2
          break
        case b:
          h = (r - g) / delta + 4
          break
      }
      h = Math.round(h * 60)
      if (h < 0) h += 360
    }

    return { h, s, l }
  }

  const isHueInRange = (h: number, min: number, max: number) => {
    if (min <= max) return h >= min && h <= max
    return h >= min || h <= max
  }

  const matchColorKey = (hex: string, key: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return false
    const hsl = rgbToHsl(rgb)

    if (key === 'gray') return hsl.s < 0.12
    if (key === 'brown') return isHueInRange(hsl.h, 15, 45) && hsl.l < 0.55 && hsl.s > 0.1
    if (key === 'red') return isHueInRange(hsl.h, 330, 20)
    if (key === 'orange') return isHueInRange(hsl.h, 20, 45)
    if (key === 'yellow') return isHueInRange(hsl.h, 45, 70)
    if (key === 'green') return isHueInRange(hsl.h, 70, 170)
    if (key === 'cyan') return isHueInRange(hsl.h, 170, 200)
    if (key === 'blue') return isHueInRange(hsl.h, 200, 260)
    if (key === 'purple') return isHueInRange(hsl.h, 260, 330)
    return false
  }

  const filteredGradients = useMemo(() => {
    if (selectedColor === 'all') return gradients
    return gradients.filter((g) => (g.colors || []).some((c) => matchColorKey(c, selectedColor)))
  }, [gradients, selectedColor])

  const handleSelectGradient = async (wallpaper: IGradientWallpaper) => {
    const next: IWallpaperConfig = {
      currentWallpaper: {
        ...wallpaper,
        gradient: applyAngleToGradient(wallpaper.gradient, angle),
        angle
      },
      brightness,
      blur,
      featuredCategory,
      gradientAngle: angle,
      saturation
    }
    await saveConfig(next)
  }

  const updateAngleFromPointer = (clientX: number, clientY: number, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    const raw = (Math.atan2(dy, dx) * 180) / Math.PI
    const next = (raw + 90 + 360) % 360
    const rounded = Math.round(next)
    angleValueRef.current = rounded
    setAngle(rounded)
  }

  const angleDialRef = useRef<HTMLDivElement | null>(null)
  const isDialDraggingRef = useRef(false)

  const startDialDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTab !== 'gradient') return
    const el = angleDialRef.current
    if (!el) return

    isDialDraggingRef.current = true
    updateAngleFromPointer(e.clientX, e.clientY, el)

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDialDraggingRef.current) return
      if (!angleDialRef.current) return
      updateAngleFromPointer(ev.clientX, ev.clientY, angleDialRef.current)
    }

    const onPointerUp = () => {
      isDialDraggingRef.current = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      handleAngleAfterChange(angleValueRef.current)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handleSelectFeaturedWallpaper = async (wallpaper: IImageWallpaper) => {
    const next: IWallpaperConfig = {
      currentWallpaper: wallpaper,
      brightness,
      blur,
      featuredCategory: featuredCategory || wallpaper.category
    }
    await saveConfig(next)
  }

  const handleSelectDynamicWallpaper = async (wallpaper: IDynamicWallpaper) => {
    const next: IWallpaperConfig = {
      currentWallpaper: wallpaper,
      brightness: config?.brightness ?? brightness,
      blur,
      featuredCategory,
      dynamicMuted,
      dynamicPaused
    }
    await saveConfig(next)
  }

  const handleAngleAfterChange = async (value: number) => {
    if (!config) return
    if (activeTab !== 'gradient') return

    const current = config.currentWallpaper
    const nextCurrent =
      current?.type === 'gradient'
        ? {
            ...(current as IGradientWallpaper),
            angle: value,
            gradient: applyAngleToGradient((current as IGradientWallpaper).gradient, value)
          }
        : current

    const next: IWallpaperConfig = {
      ...config,
      currentWallpaper: nextCurrent as IWallpaperConfig['currentWallpaper'],
      gradientAngle: value,
      saturation
    }
    await saveConfig(next)
  }

  const handleSaturationAfterChange = async (value: number) => {
    if (!config) return
    if (activeTab !== 'gradient') return
    const next: IWallpaperConfig = {
      ...config,
      saturation: value,
      gradientAngle: angle
    }
    await saveConfig(next)
  }

  const handleBrightnessAfterChange = async (value: number) => {
    if (!config) return
    if (activeTab !== 'gradient') return
    const next: IWallpaperConfig = {
      ...config,
      brightness: value,
      gradientAngle: angle,
      saturation
    }
    await saveConfig(next)
  }

  const handleBlurAfterChange = async (value: number) => {
    if (!config) return
    const next: IWallpaperConfig = {
      ...config,
      blur: value
    }
    await saveConfig(next)
  }

  const handleDynamicMutedChange = async (value: boolean) => {
    setDynamicMuted(value)
    if (!config) return
    const next: IWallpaperConfig = {
      ...config,
      dynamicMuted: value
    }
    await saveConfig(next)
  }

  const handleDynamicPausedChange = async (value: boolean) => {
    setDynamicPaused(value)
    if (!config) return
    const next: IWallpaperConfig = {
      ...config,
      dynamicPaused: value
    }
    await saveConfig(next)
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

      {activeTab === 'featured' && (
        <>
          <div className={styles.categoryFilters}>
            {featuredCategories.map((category) => (
              <div
                key={category}
                className={`${styles.categoryPill} ${featuredCategory === category ? styles.active : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </div>
            ))}
          </div>

          <div className={styles.imageGrid}>
            {filteredFeaturedWallpapers.length === 0 ? (
              <div className={styles.emptyWrap}>
                <Empty description='暂无壁纸' />
              </div>
            ) : (
              filteredFeaturedWallpapers.map((wallpaper) => {
                const selected =
                  config?.currentWallpaper?.type === 'image' &&
                  (config.currentWallpaper as IImageWallpaper).id === wallpaper.id

                return (
                  <div
                    key={wallpaper.id}
                    className={`${styles.imageCard} ${selected ? styles.selected : ''}`}
                    onClick={() => handleSelectFeaturedWallpaper(wallpaper)}
                  >
                    <img
                      className={styles.imageThumb}
                      src={wallpaper.thumbnail || wallpaper.url}
                      alt=''
                    />
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'gradient' && (
        <>
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

          <div className={styles.gradientGrid}>
            {filteredGradients.map((wallpaper) => {
              const selected =
                config?.currentWallpaper?.type === 'gradient' &&
                (config.currentWallpaper as IGradientWallpaper).id === wallpaper.id

              return (
                <div
                  key={wallpaper.id}
                  className={`${styles.gradientCard} ${selected ? styles.selected : ''}`}
                  style={{
                    background: applyAngleToGradient(wallpaper.gradient, angle),
                    filter: `brightness(${brightness}%) saturate(${saturation}%)`
                  }}
                  onClick={() => handleSelectGradient(wallpaper)}
                />
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'dynamic' && (
        <div className={styles.dynamicGrid}>
          {dynamicWallpapers.length === 0 ? (
            <div className={styles.emptyWrap}>
              <Empty description='暂无动态壁纸' />
            </div>
          ) : (
            dynamicWallpapers.map((wallpaper) => {
              const selected =
                config?.currentWallpaper?.type === 'dynamic' &&
                (config.currentWallpaper as IDynamicWallpaper).id === wallpaper.id

              return (
                <div
                  key={wallpaper.id}
                  className={`${styles.dynamicCard} ${selected ? styles.selected : ''}`}
                  onClick={() => handleSelectDynamicWallpaper(wallpaper)}
                >
                  <img className={styles.imageThumb} src={wallpaper.thumbnail} alt='' />
                  <div className={styles.playBadge} />
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'gradient' && (
        <div className={styles.controls}>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>色彩</span>
            <Slider
              className={styles.slider}
              value={saturation}
              onChange={setSaturation}
              onAfterChange={(value) => handleSaturationAfterChange(value as number)}
              min={0}
              max={200}
            />
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>角度</span>
            <div ref={angleDialRef} className={styles.angleDial} onPointerDown={startDialDrag}>
              <div className={styles.angleDialValue}>{angle}°</div>
              <div
                className={styles.angleKnob}
                style={{ transform: `rotate(${angle}deg) translateY(-44px) rotate(-${angle}deg)` }}
              />
            </div>
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>亮度</span>
            <Slider
              className={styles.slider}
              value={brightness}
              onChange={setBrightness}
              onAfterChange={(value) => handleBrightnessAfterChange(value as number)}
              min={0}
              max={200}
            />
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>模糊</span>
            <Slider
              className={styles.slider}
              value={blur}
              onChange={setBlur}
              onAfterChange={(value) => handleBlurAfterChange(value as number)}
              min={0}
              max={30}
              disabled={!config}
            />
          </div>
        </div>
      )}

      {activeTab !== 'gradient' && (
        <div className={styles.controls}>
          {activeTab === 'dynamic' && (
            <>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>静音</span>
                <Switch
                  checked={dynamicMuted}
                  onChange={handleDynamicMutedChange}
                  disabled={!config}
                />
              </div>
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>暂停</span>
                <Switch
                  checked={dynamicPaused}
                  onChange={handleDynamicPausedChange}
                  disabled={!config}
                />
              </div>
            </>
          )}
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>模糊</span>
            <Slider
              className={styles.slider}
              value={blur}
              onChange={setBlur}
              onAfterChange={(value) => handleBlurAfterChange(value as number)}
              min={0}
              max={30}
              disabled={!config}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallpaper

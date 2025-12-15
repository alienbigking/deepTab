import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './wallpaperBackground.module.less'
import type {
  IWallpaperConfig,
  IDynamicWallpaper,
  IGradientWallpaper,
  IImageWallpaper
} from './types/wallpaper'

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'

const WallpaperBackground: React.FC = () => {
  const [config, setConfig] = useState<IWallpaperConfig | null>(null)
  const [displayConfig, setDisplayConfig] = useState<IWallpaperConfig | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const displayKeyRef = useRef('')
  const switchSeqRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await chrome.storage.local.get(['wallpaperConfig'])
        setConfig(result.wallpaperConfig || null)
      } catch (error) {
        console.error('读取 wallpaperConfig 失败:', error)
      }
    }

    load()

    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return
      if (!changes.wallpaperConfig) return
      setConfig((changes.wallpaperConfig.newValue as IWallpaperConfig) || null)
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  useEffect(() => {
    const onPointerDown = () => setUserInteracted(true)
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const current = displayConfig?.currentWallpaper
  const blur = typeof displayConfig?.blur === 'number' ? displayConfig.blur : 0
  const dynamicMuted =
    typeof displayConfig?.dynamicMuted === 'boolean' ? displayConfig.dynamicMuted : true
  const dynamicPaused =
    typeof displayConfig?.dynamicPaused === 'boolean' ? displayConfig.dynamicPaused : false

  const preloadImage = (url: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
      img.src = url
    })
  }

  useEffect(() => {
    if (!config) {
      setDisplayConfig(null)
      return
    }

    const nextWallpaper = config.currentWallpaper
    const nextKey =
      nextWallpaper.type === 'gradient'
        ? `gradient:${(nextWallpaper as IGradientWallpaper).id}`
        : nextWallpaper.type === 'image'
          ? `image:${(nextWallpaper as IImageWallpaper).id}`
          : `dynamic:${(nextWallpaper as IDynamicWallpaper).id}`

    const seq = ++switchSeqRef.current

    const apply = async () => {
      try {
        if (displayKeyRef.current === '') {
          displayKeyRef.current = nextKey
          setVideoReady(false)
          setVideoError(false)
          setAutoplayBlocked(false)
          setDisplayConfig(config)
          return
        }

        if (displayKeyRef.current === nextKey) {
          setDisplayConfig(config)
          return
        }

        if (nextWallpaper.type === 'image') {
          const img = nextWallpaper as IImageWallpaper
          await preloadImage(img.url)
        } else if (nextWallpaper.type === 'dynamic') {
          const d = nextWallpaper as IDynamicWallpaper
          await preloadImage(d.thumbnail)
        }

        if (seq !== switchSeqRef.current) return
        setVideoReady(false)
        setVideoError(false)
        setAutoplayBlocked(false)
        displayKeyRef.current = nextKey
        setDisplayConfig(config)
      } catch {
        if (seq !== switchSeqRef.current) return
        setVideoReady(false)
        setVideoError(false)
        setAutoplayBlocked(false)
        displayKeyRef.current = nextKey
        setDisplayConfig(config)
      }
    }

    apply()
  }, [config])

  useEffect(() => {
    if (current?.type !== 'dynamic') return
    if (videoError) return
    const video = videoRef.current
    if (!video) return

    if (dynamicPaused) {
      video.pause()
      setAutoplayBlocked(false)
      return
    }

    const tryPlay = async () => {
      try {
        await video.play()
        setAutoplayBlocked(false)
      } catch (error) {
        console.warn('dynamic wallpaper play blocked:', error)
        setAutoplayBlocked(true)
      }
    }

    if (dynamicMuted) {
      tryPlay()
      return
    }

    if (userInteracted) {
      tryPlay()
    } else {
      setAutoplayBlocked(true)
    }
  }, [current, dynamicMuted, dynamicPaused, userInteracted, videoError])

  const gradientStyle = useMemo<React.CSSProperties>(() => {
    const brightness =
      typeof displayConfig?.brightness === 'number' ? displayConfig.brightness : 100
    const saturation =
      typeof displayConfig?.saturation === 'number' ? displayConfig.saturation : 100

    if (current?.type !== 'gradient') {
      return {
        background: DEFAULT_GRADIENT,
        filter: `blur(${blur}px)`
      }
    }

    const g = current as IGradientWallpaper
    return {
      background: g.gradient || DEFAULT_GRADIENT,
      filter: `blur(${blur}px) brightness(${brightness}%) saturate(${saturation}%)`
    }
  }, [blur, displayConfig?.brightness, displayConfig?.saturation, current])

  if (current?.type === 'dynamic') {
    const d = current as IDynamicWallpaper
    return (
      <div className={styles.root}>
        <div
          className={styles.media}
          style={{
            backgroundImage: `url(${d.thumbnail})`,
            filter: `blur(${blur}px)`
          }}
        />
        {!videoError && (
          <video
            ref={videoRef}
            className={styles.video}
            src={d.videoUrl}
            poster={d.thumbnail}
            autoPlay
            loop
            muted={dynamicMuted}
            playsInline
            style={{
              opacity: videoReady ? 1 : 0,
              filter: `blur(${blur}px)`
            }}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => {
              setVideoError(true)
              setVideoReady(false)
            }}
          />
        )}
        {videoError && (
          <div className={styles.tip}>
            <div className={styles.tipTitle}>动态壁纸加载失败</div>
            <div className={styles.tipDesc}>
              已为你保留缩略图背景。你可以稍后重试或更换其他动态壁纸。
            </div>
          </div>
        )}
        {!videoError && autoplayBlocked && !dynamicPaused && (
          <div className={styles.tip}>
            <div className={styles.tipTitle}>无法自动播放声音</div>
            <div className={styles.tipDesc}>
              浏览器通常会限制自动播放带声音的视频。请先点击页面任意位置，再关闭静音。
            </div>
          </div>
        )}
        <div className={styles.overlay} />
      </div>
    )
  }

  if (current?.type === 'image') {
    const img = current as IImageWallpaper
    return (
      <div className={styles.root}>
        <div
          className={styles.media}
          style={{
            backgroundImage: `url(${img.url})`,
            filter: `blur(${blur}px)`
          }}
        />
        <div className={styles.overlay} />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.media}
        style={{
          ...gradientStyle
        }}
      />
      <div className={styles.overlay} />
    </div>
  )
}

export default WallpaperBackground

import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import petImage from '@/assets/images/pet/capybara-lulu.png'
import desktopPetService, {
  DESKTOP_PET_STORAGE_KEY,
  defaultDesktopPetConfig
} from './services/desktopPet'
import type { DesktopPetConfig, DesktopPetPosition } from './types/desktopPet'
import styles from './desktopPet.module.less'
import usePetCompanion from './hooks/usePetCompanion'

const PET_CANVAS_WIDTH = 560
const PET_VISIBLE_WIDTH = 391
const PET_VISIBLE_HEIGHT = 541

const getPetBounds = (size: number) => ({
  width: (size * PET_VISIBLE_WIDTH) / PET_CANVAS_WIDTH,
  height: (size * PET_VISIBLE_HEIGHT) / PET_CANVAS_WIDTH
})

const clampPosition = (position: DesktopPetPosition, size: number): DesktopPetPosition => {
  const bounds = getPetBounds(size)
  const halfWidth = bounds.width / 2
  const halfHeight = bounds.height / 2
  const minX = halfWidth / Math.max(window.innerWidth, 1)
  const maxX = 1 - minX
  const minY = halfHeight / Math.max(window.innerHeight, 1)
  const maxY = 1 - minY
  return {
    x: Math.min(maxX, Math.max(minX, position.x)),
    y: Math.min(maxY, Math.max(minY, position.y))
  }
}

const DesktopPet: React.FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<DesktopPetConfig>(defaultDesktopPetConfig)
  const [ready, setReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [reactionTick, setReactionTick] = useState(0)
  const clickTimerRef = useRef<number | null>(null)
  const companion = usePetCompanion(config)
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    moved: boolean
    position: DesktopPetPosition | null
  }>({ pointerId: -1, offsetX: 0, offsetY: 0, moved: false, position: null })

  useEffect(() => {
    void desktopPetService.getConfig().then((next) => {
      setConfig({ ...next, position: clampPosition(next.position, next.size) })
      setReady(true)
    })

    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local' || !changes[DESKTOP_PET_STORAGE_KEY]) return
      void desktopPetService.getConfig().then(setConfig)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  useEffect(() => {
    const onResize = () => {
      setConfig((current) => ({
        ...current,
        position: clampPosition(current.position, current.size)
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!ready || !config.enabled) return null

  const petBounds = getPetBounds(config.size)

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const centerX = config.position.x * window.innerWidth
    const centerY = config.position.y * window.innerHeight
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY,
      moved: false,
      position: config.position
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || dragRef.current.pointerId !== event.pointerId) return
    const next = clampPosition(
      {
        x: (event.clientX - dragRef.current.offsetX) / window.innerWidth,
        y: (event.clientY - dragRef.current.offsetY) / window.innerHeight
      },
      config.size
    )
    if (
      Math.abs(next.x - config.position.x) * window.innerWidth > 3 ||
      Math.abs(next.y - config.position.y) * window.innerHeight > 3
    ) {
      dragRef.current.moved = true
    }
    dragRef.current.position = next
    setConfig((current) => ({ ...current, position: next }))
  }

  const finishPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (dragRef.current.moved) {
      void desktopPetService.saveConfig({
        ...config,
        position: dragRef.current.position || config.position
      })
      companion.dragged()
    } else {
      setReactionTick((tick) => tick + 1)
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
      clickTimerRef.current = window.setTimeout(companion.greet, 220)
    }
    dragRef.current.pointerId = -1
    dragRef.current.position = null
  }

  const cancelPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    dragRef.current.pointerId = -1
    dragRef.current.position = null
  }

  return (
    <button
      type='button'
      className={cn(styles.pet, {
        [styles.dragging]: dragging,
        [styles.animationDisabled]: !config.animationEnabled,
        [styles.happy]: companion.mood === 'happy',
        [styles.sleepy]: companion.mood === 'sleepy',
        [styles.focus]: companion.mood === 'focus'
      })}
      style={{
        width: petBounds.width,
        height: petBounds.height,
        left: `${config.position.x * 100}%`,
        top: `${config.position.y * 100}%`
      }}
      aria-label={t('pet.title', { defaultValue: 'Desktop pet' })}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={cancelPointer}
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
        companion.play()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <span
        key={companion.message?.id || reactionTick}
        className={cn(
          styles.reaction,
          companion.message && styles.reactionActive,
          config.position.x <= 0.28 && styles.reactionAlignLeft,
          config.position.x >= 0.72 && styles.reactionAlignRight
        )}
      >
        <i>♥</i>
        <b>{companion.message?.content || t('pet.greeting', { defaultValue: 'Hello!' })}</b>
      </span>
      <span className={styles.character}>
        <img src={petImage} alt='' draggable={false} />
        <span className={cn(styles.eyelid, styles.eyelidLeft)} />
        <span className={cn(styles.eyelid, styles.eyelidRight)} />
      </span>
    </button>
  )
}

export default DesktopPet

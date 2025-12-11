import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import cn from 'classnames'
import styles from './popconfirm.module.less'
import { getPortalRoot } from '@/common/ui/portalRoot'

export interface PopconfirmProps {
  title: React.ReactNode
  description?: React.ReactNode
  okText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

/**
 * 自定义 Popconfirm 组件
 * 包裹任意子元素，点击后在其附近弹出确认气泡
 */
const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  description,
  okText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  placement = 'top',
  children
}) => {
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const wrapperEl = wrapperRef.current
      const popupEl = popupRef.current

      // 点击在触发元素或气泡内部都不关闭
      if (wrapperEl && wrapperEl.contains(target)) return
      if (popupEl && popupEl.contains(target)) return

      setVisible(false)
      onCancel?.()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onCancel])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wrapperEl = wrapperRef.current
    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect()

      // 计算全局位置 (fixed 坐标系)
      let top = rect.top
      let left = rect.left

      switch (placement) {
        case 'bottom':
          top = rect.bottom + 8
          left = rect.left + rect.width / 2
          break
        case 'top':
          top = rect.top - 8
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 8
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 8
          break
        default:
          top = rect.bottom + 8
          left = rect.left + rect.width / 2
      }

      setPosition({ top, left })
    }

    setVisible((prev) => !prev)
  }

  const handleConfirm = () => {
    setVisible(false)
    onConfirm?.()
  }

  const handleCancel = () => {
    setVisible(false)
    onCancel?.()
  }

  // 只允许单个子元素，类似 antd
  const child = React.Children.only(children) as React.ReactElement<any>

  const wrappedChild = React.cloneElement(child, {
    ...child.props,
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e)
      handleTriggerClick(e)
    }
  })

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      {wrappedChild}
      {visible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            className={cn(styles.popconfirm, styles[placement])}
            style={{ top: position.top, left: position.left }}
          >
            <div className={styles.content}>
              <div className={styles.title}>{title}</div>
              {description && <div className={styles.description}>{description}</div>}
            </div>
            <div className={styles.footer}>
              <button className={cn(styles.btn, styles.cancel)} onClick={handleCancel}>
                {cancelText}
              </button>
              <button className={cn(styles.btn, styles.ok)} onClick={handleConfirm}>
                {okText}
              </button>
            </div>
          </div>,
          // 优先挂载到 Shadow DOM 内共享的 portalRoot, 回退到 document.body
          getPortalRoot() || document.body
        )}
    </div>
  )
}

export default Popconfirm

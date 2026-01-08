import React, { useEffect, useState } from 'react'
import { Modal, Slider } from 'antd'
import cn from 'classnames'
import styles from './searchStyleModal.module.less'

interface SearchStyleModalProps {
  open: boolean
  widthPercent: number
  opacityPercent: number
  onBack: () => void
  onPreview?: (next: { widthPercent: number; opacityPercent: number }) => void
  onDone: (next: { widthPercent: number; opacityPercent: number }) => void
}

const SearchStyleModal: React.FC<SearchStyleModalProps> = (props) => {
  const { open, widthPercent, opacityPercent, onBack, onDone, onPreview } = props

  const [draftWidth, setDraftWidth] = useState(widthPercent)
  const [draftOpacity, setDraftOpacity] = useState(opacityPercent)

  useEffect(() => {
    if (!open) return
    setDraftWidth(widthPercent)
    setDraftOpacity(opacityPercent)
  }, [open, widthPercent, opacityPercent])

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={720}
      rootClassName={cn(styles.searchStyleModalRoot)}
      getContainer={false}
      maskClosable={false}
    >
      <div className={cn(styles.searchStyleModal)}>
        <div className={cn(styles.header)}>搜索框样式</div>

        <div className={cn(styles.body)}>
          <div className={cn(styles.row)}>
            <div className={cn(styles.label)}>宽度</div>
            <div className={cn(styles.control)}>
              <Slider
                min={20}
                max={100}
                value={draftWidth}
                onChange={(v) => {
                  const nextWidth = Number(v)
                  setDraftWidth(nextWidth)
                  onPreview?.({ widthPercent: nextWidth, opacityPercent: draftOpacity })
                }}
                tooltip={{ open: false }}
              />
            </div>
            <div className={cn(styles.value)}>{draftWidth}%</div>
          </div>

          <div className={cn(styles.row)}>
            <div className={cn(styles.label)}>透明度</div>
            <div className={cn(styles.control)}>
              <Slider
                min={20}
                max={100}
                value={draftOpacity}
                onChange={(v) => {
                  const nextOpacity = Number(v)
                  setDraftOpacity(nextOpacity)
                  onPreview?.({ widthPercent: draftWidth, opacityPercent: nextOpacity })
                }}
                tooltip={{ open: false }}
              />
            </div>
            <div className={cn(styles.value)}>{draftOpacity}%</div>
          </div>
        </div>

        <div className={cn(styles.footer)}>
          <div className={cn(styles.footerBtn)} onClick={onBack} role='button' tabIndex={0}>
            « 返回
          </div>
          <div
            className={cn(styles.footerBtn, styles.footerBtnPrimary)}
            onClick={() => onDone({ widthPercent: draftWidth, opacityPercent: draftOpacity })}
            role='button'
            tabIndex={0}
          >
            完成 »
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SearchStyleModal

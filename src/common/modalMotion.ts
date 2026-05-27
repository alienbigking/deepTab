import type React from 'react'

export const modalMaskTransitionName = 'deeptab-mask-fade'

export const modalMaskStyle: React.CSSProperties = {
  animation: 'deeptabMaskFadeIn 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
  background: 'rgba(0, 0, 0, 0.25)',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  willChange: 'opacity'
}

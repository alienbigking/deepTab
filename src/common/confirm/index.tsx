import React, { createContext, useCallback, useContext, useState } from 'react'
import styles from './confirm.module.less'

interface ConfirmOptions {
  title?: string
  content?: React.ReactNode
  okText?: string
  cancelText?: string
}

interface InternalConfirmState extends Required<ConfirmOptions> {
  visible: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const defaultState: InternalConfirmState = {
  visible: false,
  title: '确认操作',
  content: '',
  okText: '确定',
  cancelText: '取消'
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}

interface ConfirmProviderProps {
  children: React.ReactNode
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [state, setState] = useState<InternalConfirmState>(defaultState)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
    setResolver(null)
  }, [])

  const handleResult = useCallback(
    (result: boolean) => {
      if (resolver) {
        resolver(result)
      }
      close()
    },
    [resolver, close]
  )

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
      setState({
        visible: true,
        title: options.title || defaultState.title,
        content: options.content ?? defaultState.content,
        okText: options.okText || defaultState.okText,
        cancelText: options.cancelText || defaultState.cancelText
      })
    })
  }, [])

  const { visible, title, content, okText, cancelText } = state

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {visible && (
        <div className={styles.mask}>
          <div className={styles.modal}>
            <div className={styles.header}>{title}</div>
            <div className={styles.body}>{content}</div>
            <div className={styles.footer}>
              <button className={styles.btn} onClick={() => handleResult(false)}>
                {cancelText}
              </button>
              <button
                className={`${styles.btn} ${styles.danger}`}
                onClick={() => handleResult(true)}
              >
                {okText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

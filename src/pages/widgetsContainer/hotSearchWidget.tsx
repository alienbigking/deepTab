import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Modal, Spin, Tooltip } from 'antd'
import { LeftOutlined, ReloadOutlined, RightOutlined, SettingFilled } from '@ant-design/icons'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import styles from './widgets.module.less'
import widgetsContainerService from './services/widgetsContainer'
import type { IHotSearchData } from './types/widgetsContainer'

const HotSearchWidget: React.FC = () => {
  const platforms = useMemo(() => widgetsContainerService.getHotSearchPlatforms(), [])
  const [platformKey, setPlatformKey] = useState('baidu')
  const [data, setData] = useState<IHotSearchData | null>(null)
  const [modalPlatformKey, setModalPlatformKey] = useState('baidu')
  const [modalData, setModalData] = useState<IHotSearchData | null>(null)
  const [cache, setCache] = useState<Record<string, IHotSearchData>>({})
  const [loading, setLoading] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const requestIdRef = useRef(0)
  const modalRequestIdRef = useRef(0)

  const platformIndex = Math.max(
    0,
    platforms.findIndex((item) => item.key === platformKey)
  )
  const activePlatform = platforms[platformIndex] || platforms[0]
  const modalPlatformIndex = Math.max(
    0,
    platforms.findIndex((item) => item.key === modalPlatformKey)
  )
  const activeModalPlatform = platforms[modalPlatformIndex] || platforms[0]

  const loadHotSearch = async (nextPlatformKey = platformKey) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    try {
      const result = await widgetsContainerService.getHotSearch(nextPlatformKey)
      if (requestIdRef.current === requestId) {
        setCache((value) => ({ ...value, [nextPlatformKey]: result }))
        setData(result)
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  const loadModalHotSearch = async (nextPlatformKey = modalPlatformKey) => {
    if (cache[nextPlatformKey]) {
      setModalData(cache[nextPlatformKey])
    }

    const requestId = modalRequestIdRef.current + 1
    modalRequestIdRef.current = requestId
    setModalLoading(true)
    try {
      const result = await widgetsContainerService.getHotSearch(nextPlatformKey)
      if (modalRequestIdRef.current === requestId) {
        setCache((value) => ({ ...value, [nextPlatformKey]: result }))
        setModalData(result)
      }
    } finally {
      if (modalRequestIdRef.current === requestId) {
        setModalLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadHotSearch('baidu')
  }, [])

  const switchPlatform = (nextIndex: number) => {
    const nextPlatform = platforms[(nextIndex + platforms.length) % platforms.length]
    setPlatformKey(nextPlatform.key)
    if (cache[nextPlatform.key]) {
      setData(cache[nextPlatform.key])
    } else {
      setData(null)
    }
    void loadHotSearch(nextPlatform.key)
  }

  const handlePlatformClick = (key: string) => {
    setModalPlatformKey(key)
    if (cache[key]) {
      setModalData(cache[key])
    } else {
      setModalData(null)
    }
    void loadModalHotSearch(key)
  }

  const handleOpenModal = () => {
    setModalPlatformKey(platformKey)
    setModalData(data)
    setOpen(true)
  }

  const openItem = (url?: string) => {
    if (!url) return
    if (chrome?.tabs?.create) {
      void chrome.tabs.create({ url })
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const toLocalPlatformIconUrls = (platformKey: string) => {
    try {
      const getURL = chrome?.runtime?.getURL
      if (!getURL) return []
      return ['svg', 'png', 'ico'].map((ext) => getURL(`src/assets/images/hotSearch/${platformKey}.${ext}`))
    } catch {
      return []
    }
  }

  const PlatformIcon: React.FC<{ platform: typeof activePlatform }> = ({ platform }) => {
    const [tryIndex, setTryIndex] = useState(0)
    const iconUrls = useMemo(() => toLocalPlatformIconUrls(platform.key), [platform.key])
    const activeIcon = iconUrls[tryIndex]

    useEffect(() => {
      setTryIndex(0)
    }, [platform.key])

    if (activeIcon) {
      return (
        <img
          className={styles.hotSearchPlatformIcon}
          src={activeIcon}
          alt={platform.name}
          onError={() => setTryIndex((value) => value + 1)}
        />
      )
    }

    return <span className={styles.hotSearchPlatformFallback}>{platform.icon}</span>
  }

  const displayItems = data?.platform.key === activePlatform.key ? data.items : []
  const modalDisplayItems =
    modalData?.platform.key === activeModalPlatform.key ? modalData.items : []
  const updatedAt = data?.platform.key === activePlatform.key && data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  const modalUpdatedAt =
    modalData?.platform.key === activeModalPlatform.key && modalData?.updatedAt
      ? new Date(modalData.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '--:--'
  const compactItems = displayItems.slice(0, 5)

  return (
    <>
      <Card className={styles.hotSearchCard} variant='borderless' onClick={handleOpenModal}>
        <Spin spinning={loading && !data}>
          <div className={styles.hotSearchCompact}>
            <div className={styles.hotSearchCompactHeader}>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation()
                  switchPlatform(platformIndex - 1)
                }}
              >
                <LeftOutlined />
              </button>
              <strong>{activePlatform.shortName}</strong>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation()
                  switchPlatform(platformIndex + 1)
                }}
              >
                <RightOutlined />
              </button>
            </div>
            <div className={styles.hotSearchCompactList}>
              {compactItems.map((item, index) => (
                <div key={`${activePlatform.key}_${item.id}`} className={styles.hotSearchCompactItem}>
                  <span>{index + 1}</span>
                  <strong>{item.title}</strong>
                  <em>{item.hot}</em>
                </div>
              ))}
            </div>
          </div>
        </Spin>
      </Card>

      <Modal
        title={<span className={styles.hotSearchTitle}>热搜榜</span>}
        open={open}
        onCancel={() => setOpen(false)}
        rootClassName={`${addAppModalStyles.addAppModalRoot} ${styles.widgetModalRoot}`}
        className={styles.widgetModal}
        centered
        width={1000}
        transitionName=''
        maskTransitionName=''
        styles={{ body: { overflow: 'hidden' } }}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.hotSearchModal}>
          <aside className={styles.hotSearchSidebar}>
            {platforms.map((platform) => (
              <button
                key={platform.key}
                type='button'
                className={platform.key === activeModalPlatform.key ? styles.active : ''}
                onClick={() => handlePlatformClick(platform.key)}
              >
                <PlatformIcon platform={platform} />
                <em>{platform.name}</em>
              </button>
            ))}
          </aside>

          <section className={styles.hotSearchMain}>
            <div className={styles.hotSearchModalToolbar}>
              <span>上次更新：{modalUpdatedAt}</span>
              <div>
                <Tooltip title='刷新'>
                  <button type='button' onClick={() => void loadModalHotSearch()}>
                    <ReloadOutlined />
                  </button>
                </Tooltip>
                <Tooltip title='设置'>
                  <button type='button'>
                    <SettingFilled />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className={styles.hotSearchModalList}>
              {modalDisplayItems.length ? (
                modalDisplayItems.map((item, index) => (
                  <button key={`${activeModalPlatform.key}_${item.id}`} type='button' onClick={() => openItem(item.url)}>
                    <span className={styles[`rank${Math.min(index + 1, 4)}`]}>{index + 1}</span>
                    <strong>{item.title}</strong>
                    <em>{item.hot}</em>
                  </button>
                ))
              ) : (
                <div className={styles.hotSearchEmpty}>
                  {modalLoading ? '正在获取热搜...' : '当前平台暂时没有获取到热搜，稍后刷新试试'}
                </div>
              )}
            </div>
          </section>
        </div>
      </Modal>
    </>
  )
}

export default HotSearchWidget

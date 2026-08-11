import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Checkbox, Modal, Spin, Tooltip, message } from 'antd'
import {
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SettingFilled,
  StepBackwardFilled,
  StepForwardFilled
} from '@ant-design/icons'
import SimpleBar from 'simplebar-react'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import styles from './widgets.module.less'
import widgetsContainerService from './services/widgetsContainer'
import type { IHotSearchData } from './types/widgetsContainer'
import { useTranslation } from 'react-i18next'

const hotSearchWidgetCache: {
  platformKey: string
  modalPlatformKey: string
  data: IHotSearchData | null
  modalData: IHotSearchData | null
  cache: Record<string, IHotSearchData>
  hiddenPlatformKeys: string[]
  configLoaded: boolean
  initialLoaded: boolean
  initialPromise: Promise<void> | null
} = {
  platformKey: 'baidu',
  modalPlatformKey: 'baidu',
  data: null,
  modalData: null,
  cache: {},
  hiddenPlatformKeys: [],
  configLoaded: false,
  initialLoaded: false,
  initialPromise: null
}

const HotSearchWidget: React.FC = () => {
  const { t } = useTranslation()
  const platforms = useMemo(() => widgetsContainerService.getHotSearchPlatforms(), [])
  const [platformKey, setPlatformKey] = useState(hotSearchWidgetCache.platformKey)
  const [data, setData] = useState<IHotSearchData | null>(hotSearchWidgetCache.data)
  const [modalPlatformKey, setModalPlatformKey] = useState(hotSearchWidgetCache.modalPlatformKey)
  const [modalData, setModalData] = useState<IHotSearchData | null>(hotSearchWidgetCache.modalData)
  const [cache, setCache] = useState<Record<string, IHotSearchData>>(hotSearchWidgetCache.cache)
  const [loading, setLoading] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [compactPage, setCompactPage] = useState(0)
  const [hiddenPlatformKeys, setHiddenPlatformKeys] = useState<string[]>(
    hotSearchWidgetCache.hiddenPlatformKeys
  )
  const requestIdRef = useRef(0)
  const modalRequestIdRef = useRef(0)
  const settingsPanelRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const visiblePlatforms = useMemo(() => {
    const list = platforms.filter((item) => !hiddenPlatformKeys.includes(item.key))
    return list.length ? list : platforms.slice(0, 1)
  }, [hiddenPlatformKeys, platforms])

  const platformIndex = Math.max(
    0,
    visiblePlatforms.findIndex((item) => item.key === platformKey)
  )
  const activePlatform = visiblePlatforms[platformIndex] || visiblePlatforms[0]
  const modalPlatformIndex = Math.max(
    0,
    visiblePlatforms.findIndex((item) => item.key === modalPlatformKey)
  )
  const activeModalPlatform = visiblePlatforms[modalPlatformIndex] || visiblePlatforms[0]

  const loadWidgetConfig = async () => {
    if (hotSearchWidgetCache.configLoaded) {
      setHiddenPlatformKeys(hotSearchWidgetCache.hiddenPlatformKeys)
      return
    }
    const config = await widgetsContainerService.getWidgetConfig()
    const nextHiddenPlatformKeys = config.hotSearchHiddenPlatforms || []
    hotSearchWidgetCache.hiddenPlatformKeys = nextHiddenPlatformKeys
    hotSearchWidgetCache.configLoaded = true
    setHiddenPlatformKeys(nextHiddenPlatformKeys)
  }

  const setCachedHotSearch = (nextPlatformKey: string, result: IHotSearchData) => {
    hotSearchWidgetCache.cache = { ...hotSearchWidgetCache.cache, [nextPlatformKey]: result }
    hotSearchWidgetCache.data = result
    hotSearchWidgetCache.platformKey = nextPlatformKey
    hotSearchWidgetCache.initialLoaded = true
    setCache(hotSearchWidgetCache.cache)
    setData(result)
  }

  const loadHotSearch = async (nextPlatformKey = platformKey, force = false) => {
    if (!force && hotSearchWidgetCache.cache[nextPlatformKey]) {
      hotSearchWidgetCache.platformKey = nextPlatformKey
      hotSearchWidgetCache.data = hotSearchWidgetCache.cache[nextPlatformKey]
      hotSearchWidgetCache.initialLoaded = true
      setCache(hotSearchWidgetCache.cache)
      setData(hotSearchWidgetCache.cache[nextPlatformKey])
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    try {
      const result = await widgetsContainerService.getHotSearch(nextPlatformKey)
      if (requestIdRef.current === requestId) {
        setCachedHotSearch(nextPlatformKey, result)
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  const loadModalHotSearch = async (nextPlatformKey = modalPlatformKey, force = false) => {
    if (!force && hotSearchWidgetCache.cache[nextPlatformKey]) {
      hotSearchWidgetCache.modalPlatformKey = nextPlatformKey
      hotSearchWidgetCache.modalData = hotSearchWidgetCache.cache[nextPlatformKey]
      setCache(hotSearchWidgetCache.cache)
      setModalData(hotSearchWidgetCache.cache[nextPlatformKey])
      return
    }

    if (hotSearchWidgetCache.cache[nextPlatformKey]) {
      setModalData(hotSearchWidgetCache.cache[nextPlatformKey])
    }

    const requestId = modalRequestIdRef.current + 1
    modalRequestIdRef.current = requestId
    setModalLoading(true)
    try {
      const result = await widgetsContainerService.getHotSearch(nextPlatformKey)
      if (modalRequestIdRef.current === requestId) {
        hotSearchWidgetCache.cache = { ...hotSearchWidgetCache.cache, [nextPlatformKey]: result }
        hotSearchWidgetCache.modalPlatformKey = nextPlatformKey
        hotSearchWidgetCache.modalData = result
        if (nextPlatformKey === hotSearchWidgetCache.platformKey) {
          hotSearchWidgetCache.data = result
          hotSearchWidgetCache.initialLoaded = true
          setData(result)
        }
        setCache(hotSearchWidgetCache.cache)
        setModalData(result)
      }
    } finally {
      if (modalRequestIdRef.current === requestId) {
        setModalLoading(false)
      }
    }
  }

  useEffect(() => {
    if (hotSearchWidgetCache.initialLoaded) {
      setPlatformKey(hotSearchWidgetCache.platformKey)
      setData(hotSearchWidgetCache.data)
      setModalPlatformKey(hotSearchWidgetCache.modalPlatformKey)
      setModalData(hotSearchWidgetCache.modalData)
      setCache(hotSearchWidgetCache.cache)
      setHiddenPlatformKeys(hotSearchWidgetCache.hiddenPlatformKeys)
      return
    }

    if (!hotSearchWidgetCache.initialPromise) {
      hotSearchWidgetCache.initialPromise = (async () => {
        await loadWidgetConfig()
        await loadHotSearch('baidu')
      })().finally(() => {
        hotSearchWidgetCache.initialPromise = null
      })
    }

    void hotSearchWidgetCache.initialPromise.then(() => {
      setPlatformKey(hotSearchWidgetCache.platformKey)
      setData(hotSearchWidgetCache.data)
      setModalPlatformKey(hotSearchWidgetCache.modalPlatformKey)
      setModalData(hotSearchWidgetCache.modalData)
      setCache(hotSearchWidgetCache.cache)
      setHiddenPlatformKeys(hotSearchWidgetCache.hiddenPlatformKeys)
    })
  }, [])

  useEffect(() => {
    if (!settingsOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (settingsPanelRef.current?.contains(target)) return
      if (settingsButtonRef.current?.contains(target)) return
      setSettingsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!activePlatform?.key) return
    if (platformKey === activePlatform.key) return
    setPlatformKey(activePlatform.key)
    hotSearchWidgetCache.platformKey = activePlatform.key
    setData(hotSearchWidgetCache.cache[activePlatform.key] || null)
    void loadHotSearch(activePlatform.key)
  }, [activePlatform?.key])

  useEffect(() => {
    if (!activeModalPlatform?.key) return
    if (modalPlatformKey === activeModalPlatform.key) return
    setModalPlatformKey(activeModalPlatform.key)
    hotSearchWidgetCache.modalPlatformKey = activeModalPlatform.key
    setModalData(hotSearchWidgetCache.cache[activeModalPlatform.key] || null)
    void loadModalHotSearch(activeModalPlatform.key)
  }, [activeModalPlatform?.key])

  const switchPlatform = (nextIndex: number) => {
    const nextPlatform = visiblePlatforms[(nextIndex + visiblePlatforms.length) % visiblePlatforms.length]
    setCompactPage(0)
    setPlatformKey(nextPlatform.key)
    hotSearchWidgetCache.platformKey = nextPlatform.key
    if (hotSearchWidgetCache.cache[nextPlatform.key]) {
      hotSearchWidgetCache.data = hotSearchWidgetCache.cache[nextPlatform.key]
      setData(hotSearchWidgetCache.cache[nextPlatform.key])
    } else {
      setData(null)
    }
    void loadHotSearch(nextPlatform.key)
  }

  const handlePlatformClick = (key: string) => {
    setModalPlatformKey(key)
    hotSearchWidgetCache.modalPlatformKey = key
    if (hotSearchWidgetCache.cache[key]) {
      hotSearchWidgetCache.modalData = hotSearchWidgetCache.cache[key]
      setModalData(hotSearchWidgetCache.cache[key])
    } else {
      setModalData(null)
    }
    void loadModalHotSearch(key)
  }

  const handleOpenModal = () => {
    setModalPlatformKey(platformKey)
    setModalData(data)
    hotSearchWidgetCache.modalPlatformKey = platformKey
    hotSearchWidgetCache.modalData = data
    setOpen(true)
  }

  const handleTogglePlatform = async (key: string, checked: boolean) => {
    const nextHidden = checked
      ? hiddenPlatformKeys.filter((item) => item !== key)
      : Array.from(new Set([...hiddenPlatformKeys, key]))
    const nextVisible = platforms.filter((item) => !nextHidden.includes(item.key))
    if (!nextVisible.length) {
      messageApi.warning(t('hotSearch.keepOne', { defaultValue: 'Keep at least one hot search source' }))
      return
    }

    setHiddenPlatformKeys(nextHidden)
    hotSearchWidgetCache.hiddenPlatformKeys = nextHidden
    hotSearchWidgetCache.configLoaded = true
    const config = await widgetsContainerService.getWidgetConfig()
    await widgetsContainerService.saveWidgetConfig({
      ...config,
      hotSearchHiddenPlatforms: nextHidden
    })
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
  const compactPageSize = 5
  const compactPageCount = Math.max(1, Math.ceil(displayItems.length / compactPageSize))
  const normalizedCompactPage = compactPage % compactPageCount
  const compactItems = displayItems.slice(
    normalizedCompactPage * compactPageSize,
    normalizedCompactPage * compactPageSize + compactPageSize
  )

  useEffect(() => {
    setCompactPage(0)
  }, [activePlatform.key, data?.updatedAt])

  const switchCompactPage = (direction: -1 | 1) => {
    setCompactPage((value) => (value + direction + compactPageCount) % compactPageCount)
  }

  return (
    <>
      {contextHolder}
      <Card
        className={styles.hotSearchCard}
        variant='borderless'
        style={{ '--dt-hot-platform-color': activePlatform.color } as React.CSSProperties}
        onClick={handleOpenModal}
      >
        <Spin spinning={loading && !data}>
          <div className={styles.hotSearchCompact}>
            <div className={styles.hotSearchCompactHeader}>
              <button
                type='button'
                className={styles.hotSearchSourceNav}
                onClick={(event) => {
                  event.stopPropagation()
                  switchPlatform(platformIndex - 1)
                }}
                aria-label={t('hotSearch.previousSource', { defaultValue: 'Previous hot search source' })}
              >
                <StepBackwardFilled />
              </button>
              <button
                type='button'
                className={styles.hotSearchPageNav}
                onClick={(event) => {
                  event.stopPropagation()
                  switchCompactPage(-1)
                }}
                aria-label={t('hotSearch.previousPage', { defaultValue: 'Previous hot search page' })}
              >
                <LeftOutlined />
              </button>
              <strong>{activePlatform.shortName}</strong>
              <button
                type='button'
                className={styles.hotSearchPageNav}
                onClick={(event) => {
                  event.stopPropagation()
                  switchCompactPage(1)
                }}
                aria-label={t('hotSearch.nextPage', { defaultValue: 'Next hot search page' })}
              >
                <RightOutlined />
              </button>
              <button
                type='button'
                className={styles.hotSearchSourceNav}
                onClick={(event) => {
                  event.stopPropagation()
                  switchPlatform(platformIndex + 1)
                }}
                aria-label={t('hotSearch.nextSource', { defaultValue: 'Next hot search source' })}
              >
                <StepForwardFilled />
              </button>
            </div>
            <div className={styles.hotSearchCompactList}>
              {compactItems.map((item, index) => (
                <div key={`${activePlatform.key}_${item.id}`} className={styles.hotSearchCompactItem}>
                  <span>{normalizedCompactPage * compactPageSize + index + 1}</span>
                  <strong>{item.title}</strong>
                  <em>{item.hot}</em>
                </div>
              ))}
            </div>
          </div>
        </Spin>
      </Card>

      <Modal
        title={<span className={styles.hotSearchTitle}>{t('hotSearch.title', { defaultValue: 'Hot search' })}</span>}
        open={open}
        onCancel={() => setOpen(false)}
        rootClassName={`${addAppModalStyles.addAppModalRoot} ${styles.widgetModalRoot}`}
        className={styles.widgetModal}
        centered
        width={1000}
        transitionName=''
        maskTransitionName={modalMaskTransitionName}
        maskStyle={modalMaskStyle}
        styles={{ body: { overflow: 'hidden' } }}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.hotSearchModal}>
          <SimpleBar className={`${styles.hotSearchSidebar} dtPrettyScrollbar`} autoHide>
            <div className={styles.hotSearchSidebarInner}>
              {visiblePlatforms.map((platform) => (
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
            </div>
          </SimpleBar>

          <section className={styles.hotSearchMain}>
            <div className={styles.hotSearchModalToolbar}>
              <span>{t('hotSearch.updated', { defaultValue: 'Updated' })}: {modalUpdatedAt}</span>
              <div>
                <Tooltip title={t('common.refresh', { defaultValue: 'Refresh' })}>
                  <button
                    type='button'
                    className={modalLoading ? styles.refreshingToolbarButton : ''}
                    disabled={modalLoading}
                    onClick={() => void loadModalHotSearch(modalPlatformKey, true)}
                  >
                    <ReloadOutlined spin={modalLoading} />
                  </button>
                </Tooltip>
                <Tooltip title={t('common.settings')}>
                  <button
                    ref={settingsButtonRef}
                    type='button'
                    className={settingsOpen ? styles.activeToolbarButton : ''}
                    onClick={() => setSettingsOpen((value) => !value)}
                  >
                    <SettingFilled />
                  </button>
                </Tooltip>
              </div>
            </div>

            {settingsOpen && (
              <div ref={settingsPanelRef} className={styles.hotSearchSettingsPanel}>
                <div className={styles.hotSearchSettingsHeader}>
                  <div>
                    <strong>{t('hotSearch.sources', { defaultValue: 'Visible sources' })}</strong>
                    <span>{t('hotSearch.sourcesHint', { defaultValue: 'Selected sources appear in the source list and card switcher' })}</span>
                  </div>
                </div>
                <div className={styles.hotSearchSettingsGrid}>
                  {platforms.map((platform) => (
                    <Checkbox
                      key={platform.key}
                      checked={!hiddenPlatformKeys.includes(platform.key)}
                      onChange={(event) => void handleTogglePlatform(platform.key, event.target.checked)}
                    >
                      {platform.shortName}
                    </Checkbox>
                  ))}
                </div>
              </div>
            )}

            <SimpleBar className={`${styles.hotSearchModalList} dtPrettyScrollbar`} autoHide>
              <div className={styles.hotSearchModalListInner}>
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
                    {modalLoading ? t('hotSearch.loading', { defaultValue: 'Loading hot search...' }) : t('hotSearch.empty', { defaultValue: 'No hot search data for this platform. Try refreshing later.' })}
                  </div>
                )}
              </div>
            </SimpleBar>
          </section>
        </div>
      </Modal>
    </>
  )
}

export default HotSearchWidget

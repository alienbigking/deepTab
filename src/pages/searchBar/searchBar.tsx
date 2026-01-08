import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input, Popover, Space } from 'antd'
import { CloseOutlined, DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import cn from 'classnames'
import styles from './searchBar.module.less'
import useSearchEngineStore from '../searchEngine/stores/searchEngine'
import generalSettingsService from '../generalSettings/services/generalSettings'
import { defaultGeneralSettings } from '../generalSettings/stores/generalSettings'
import searchBarService from './services/searchBar'
import searchSuggestionService from './services/searchSuggestion'
import type { ISearchHistoryItem } from './types/searchBar'

/**
 * 搜索框组件
 * 支持多搜索引擎切换
 */
const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('')
  const [enginePickerOpen, setEnginePickerOpen] = useState(false)
  const [generalSettings, setGeneralSettings] = useState(defaultGeneralSettings)

  const [panelOpen, setPanelOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<ISearchHistoryItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  const { config, init, setDefaultEngineId } = useSearchEngineStore()

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setGeneralSettings(data)

      try {
        document.documentElement.style.setProperty(
          '--dt-search-width',
          `${String(data.search.searchBarWidth)}vw`
        )
        document.documentElement.style.setProperty(
          '--dt-search-opacity',
          String(data.search.searchBarOpacity / 100)
        )
      } catch (error) {
        console.error('设置搜索框样式变量失败:', error)
      }
    }

    void load()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes?.generalSettings) return
      void load()
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const builtinEngines = useMemo(
    () => [
      { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={q}' },
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}' },
      { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}' },
      { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}' }
    ],
    []
  )

  const customEngines = config.customEngines ?? []

  const allEngines = useMemo(() => {
    return [...builtinEngines, ...customEngines]
  }, [builtinEngines, customEngines])

  const resolvedEngineId = useMemo(() => {
    const id = config.defaultEngineId || 'baidu'
    const exists =
      builtinEngines.some((it) => it.id === id) ||
      (typeof id === 'string' && customEngines.some((it) => it.id === id))
    return exists ? id : 'baidu'
  }, [builtinEngines, config.defaultEngineId, customEngines])

  const buildSearchUrl = (engineId: string, keyword: string) => {
    const encoded = encodeURIComponent(keyword)
    const builtin = builtinEngines.find((it) => it.id === engineId)
    const custom = customEngines.find((it) => it.id === engineId)
    const template = custom?.url || builtin?.url || 'https://www.baidu.com/s?wd={q}'

    if (template.includes('{q}')) return template.replaceAll('{q}', encoded)
    if (template.includes('%s')) return template.replace('%s', encoded)
    return `${template}${template.includes('?') ? '&' : '?'}q=${encoded}`
  }

  const currentEngine = useMemo(() => {
    return (
      allEngines.find((it: any) => it.id === resolvedEngineId) ||
      builtinEngines.find((it) => it.id === 'baidu') || {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com/s?wd={q}'
      }
    )
  }, [allEngines, builtinEngines, resolvedEngineId])

  const getBuiltinFallbackLetter = (id: string) => {
    if (id === 'baidu') return 'B'
    if (id === 'google') return 'G'
    if (id === 'bing') return 'Bi'
    if (id === 'duckduckgo') return 'D'
    return 'S'
  }

  const toFaviconUrl = (template: string) => {
    const v = String(template || '').trim()
    if (!v) return ''
    try {
      const sample = v.includes('{q}') ? v.replaceAll('{q}', 'test') : v.replace('%s', 'test')
      const url = new URL(sample)
      return `${url.origin}/favicon.ico`
    } catch {
      return ''
    }
  }

  const toLocalBuiltinIconUrls = (engineId: string) => {
    try {
      const getURL = chrome?.runtime?.getURL
      if (!getURL) return []
      return [
        getURL(`src/assets/images/searchEngines/${engineId}.svg`),
        getURL(`src/assets/images/searchEngines/${engineId}.png`),
        getURL(`src/assets/images/searchEngines/${engineId}.ico`)
      ]
    } catch {
      return []
    }
  }

  const EngineIcon: React.FC<{ engineId: string }> = ({ engineId }) => {
    const [tryIndex, setTryIndex] = useState(0)

    const { name, iconUrls } = useMemo(() => {
      const custom = customEngines.find((it) => it.id === engineId)
      const builtin = builtinEngines.find((it) => it.id === engineId)
      const resolvedName = custom?.name || builtin?.name || engineId

      const urls: string[] = []

      const customIcon = custom?.icon ? String(custom.icon).trim() : ''
      if (customIcon) urls.push(customIcon)

      if (builtin?.url) {
        urls.push(...toLocalBuiltinIconUrls(engineId))
        const favicon = toFaviconUrl(builtin.url)
        if (favicon) urls.push(favicon)
      } else if (custom?.url) {
        const favicon = toFaviconUrl(custom.url)
        if (favicon) urls.push(favicon)
      }

      return { name: resolvedName, iconUrls: urls }
    }, [builtinEngines, customEngines, engineId])

    useEffect(() => {
      setTryIndex(0)
    }, [engineId, iconUrls.join('|')])

    const active = iconUrls[tryIndex]

    if (active) {
      return (
        <img
          className={styles.engineImg}
          src={active}
          alt={name}
          onError={() => setTryIndex((v) => v + 1)}
        />
      )
    }

    return <span className={styles.engineLetter}>{getBuiltinFallbackLetter(engineId)}</span>
  }

  const openSearchEngineSettings = () => {
    window.dispatchEvent(new CustomEvent('dt:openSettings', { detail: { menu: 'search' } }))
  }

  const handlePickEngine = async (engineId: string) => {
    await setDefaultEngineId(engineId)
    setEnginePickerOpen(false)
  }

  const handleSearch = (value: string) => {
    if (!value.trim()) return

    if (generalSettings.search.searchHistory) {
      void searchBarService.saveSearchHistory({
        keyword: value.trim(),
        timestamp: Date.now(),
        engineId: String(resolvedEngineId)
      })
    }

    const searchUrl = buildSearchUrl(String(resolvedEngineId), value.trim())
    if (generalSettings.search.openMethod === 'currentTab') {
      window.location.assign(searchUrl)
    } else {
      window.open(searchUrl, '_blank')
    }

    if (!generalSettings.search.keepSearchValue) {
      setSearchValue('')
    }

    setPanelOpen(false)
    setActiveIndex(-1)
  }

  const loadHistory = async () => {
    if (!generalSettings.search.searchHistory) {
      setHistory([])
      return
    }
    const list = await searchBarService.getSearchHistory()
    setHistory(list)
  }

  const removeHistory = async (keyword: string) => {
    await searchBarService.removeSearchHistory(keyword)
    await loadHistory()
  }

  const clearHistory = async () => {
    await searchBarService.clearSearchHistory()
    setHistory([])
  }

  useEffect(() => {
    if (!panelOpen) return
    if (!generalSettings.search.searchHistory) return
    if (searchValue.trim()) return
    void loadHistory()
  }, [generalSettings.search.searchHistory, panelOpen, searchValue])

  useEffect(() => {
    if (!generalSettings.search.searchSuggestions) {
      setSuggestions([])
      return
    }

    const q = searchValue.trim()
    if (!q) {
      setSuggestions([])
      return
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current
      void searchSuggestionService.getBingSuggestions(q).then((list) => {
        if (requestId !== requestIdRef.current) return
        setSuggestions(list.slice(0, 10))
        setActiveIndex(-1)
      })
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [generalSettings.search.searchSuggestions, searchValue])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const root = wrapRef.current
      if (!root) return
      if (root.contains(e.target as Node)) return
      setPanelOpen(false)
      setActiveIndex(-1)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key

    if (key === 'Tab') {
      if (!generalSettings.search.tabSwitchEngine) return
      e.preventDefault()
      const list = [...builtinEngines, ...customEngines]
      if (list.length <= 1) return
      const idx = list.findIndex((it: any) => it.id === resolvedEngineId)
      const step = e.shiftKey ? -1 : 1
      const next = list[(idx + step + list.length) % list.length]
      if (next?.id) {
        void handlePickEngine(next.id)
      }
      return
    }

    const trimmed = searchValue.trim()
    const showHistory =
      panelOpen && !trimmed && generalSettings.search.searchHistory && history.length > 0
    const showSuggestions =
      panelOpen && !!trimmed && generalSettings.search.searchSuggestions && suggestions.length > 0

    const list = showSuggestions ? suggestions : showHistory ? history.map((it) => it.keyword) : []
    if (!list.length) {
      if (key === 'Escape') {
        setPanelOpen(false)
        setActiveIndex(-1)
      }
      return
    }

    if (key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((v) => {
        const next = v + 1
        return next >= list.length ? 0 : next
      })
      return
    }

    if (key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((v) => {
        const next = v - 1
        return next < 0 ? list.length - 1 : next
      })
      return
    }

    if (key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < list.length) {
        e.preventDefault()
        const picked = list[activeIndex]
        setSearchValue(picked)
        handleSearch(picked)
      }
      return
    }

    if (key === 'Escape') {
      e.preventDefault()
      setPanelOpen(false)
      setActiveIndex(-1)
    }
  }

  const showHistoryPanel =
    panelOpen && !searchValue.trim() && generalSettings.search.searchHistory && history.length > 0
  const showSuggestPanel =
    panelOpen &&
    !!searchValue.trim() &&
    generalSettings.search.searchSuggestions &&
    suggestions.length > 0

  return (
    <div className={styles.searchBarContainer}>
      <div className={styles.searchInputWrap} ref={wrapRef}>
        <Input
          className={styles.searchInput}
          size='large'
          placeholder='输入关键词搜索'
          prefix={
            <Space size={8} className={styles.prefixWrap}>
              <Popover
                open={enginePickerOpen}
                onOpenChange={setEnginePickerOpen}
                trigger='click'
                placement='bottomLeft'
                overlayClassName={styles.enginePopover}
                content={
                  <div className={styles.enginePanel}>
                    <div className={styles.engineGrid}>
                      {builtinEngines.map((it) => (
                        <div
                          key={it.id}
                          className={
                            it.id === resolvedEngineId
                              ? `${styles.engineTile} ${styles.engineTileActive}`
                              : styles.engineTile
                          }
                          onClick={() => void handlePickEngine(it.id)}
                          role='button'
                          tabIndex={0}
                        >
                          <div className={styles.engineTileIcon}>
                            <EngineIcon engineId={it.id} />
                          </div>
                          <div className={styles.engineTileLabel}>{it.name}</div>
                        </div>
                      ))}

                      {customEngines.map((it) => (
                        <div
                          key={it.id}
                          className={
                            it.id === resolvedEngineId
                              ? `${styles.engineTile} ${styles.engineTileActive}`
                              : styles.engineTile
                          }
                          onClick={() => void handlePickEngine(it.id)}
                          role='button'
                          tabIndex={0}
                        >
                          <div className={styles.engineTileIcon}>
                            <EngineIcon engineId={it.id} />
                          </div>
                          <div className={styles.engineTileLabel}>{it.name}</div>
                        </div>
                      ))}

                      <div
                        className={styles.engineTile}
                        onClick={() => {
                          setEnginePickerOpen(false)
                          openSearchEngineSettings()
                        }}
                        role='button'
                        tabIndex={0}
                      >
                        <div className={styles.engineTileIcon}>
                          <PlusOutlined />
                        </div>
                        <div className={styles.engineTileLabel}>添加</div>
                      </div>
                    </div>
                  </div>
                }
              >
                <span
                  className={styles.engineTrigger}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <span className={styles.engineTriggerIcon}>
                    <EngineIcon engineId={String(currentEngine.id)} />
                  </span>
                  <DownOutlined className={styles.engineTriggerArrow} />
                </span>
              </Popover>
              <SearchOutlined className={styles.searchIcon} />
            </Space>
          }
          allowClear
          value={searchValue}
          onChange={(e) => {
            const next = e.target.value
            setSearchValue(next)
            setPanelOpen(true)
          }}
          onFocus={() => {
            setPanelOpen(true)
            setActiveIndex(-1)
          }}
          onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
        />

        {(showHistoryPanel || showSuggestPanel) && (
          <div
            className={styles.suggestPanel}
            data-dt-scroll-panel='1'
            onMouseDown={(e) => {
              e.preventDefault()
            }}
          >
            <div className={styles.panelHeader}>
              <div>{showHistoryPanel ? '搜索历史' : '搜索建议'}</div>

              {showHistoryPanel && (
                <div
                  className={styles.panelActions}
                  onClick={() => void clearHistory()}
                  role='button'
                  tabIndex={0}
                >
                  清空
                </div>
              )}
            </div>

            <div className={styles.panelList}>
              {showSuggestPanel &&
                suggestions.map((text, idx) => (
                  <div
                    key={`${text}-${idx}`}
                    className={cn(styles.panelItem, {
                      [styles.panelItemActive]: idx === activeIndex
                    })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setSearchValue(text)
                      handleSearch(text)
                    }}
                    role='button'
                    tabIndex={0}
                  >
                    <div className={styles.panelItemText}>{text}</div>
                  </div>
                ))}

              {showHistoryPanel &&
                history.map((it, idx) => (
                  <div
                    key={`${it.keyword}-${it.timestamp}`}
                    className={cn(styles.panelItem, {
                      [styles.panelItemActive]: idx === activeIndex
                    })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setSearchValue(it.keyword)
                      handleSearch(it.keyword)
                    }}
                    role='button'
                    tabIndex={0}
                  >
                    <div className={styles.panelItemText}>{it.keyword}</div>
                    <div className={styles.panelItemRight}>
                      <span
                        className={styles.panelItemDel}
                        onClick={(e) => {
                          e.stopPropagation()
                          void removeHistory(it.keyword)
                        }}
                        role='button'
                        tabIndex={0}
                      >
                        <CloseOutlined />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchBar

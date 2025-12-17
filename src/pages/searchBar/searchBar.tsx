import React, { useEffect, useMemo, useState } from 'react'
import { Input, Popover, Space } from 'antd'
import { DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import styles from './searchBar.module.less'
import useSearchEngineStore from '../searchEngine/stores/searchEngine'
import generalSettingsService from '../generalSettings/services/generalSettings'
import { defaultGeneralSettings } from '../generalSettings/stores/generalSettings'

/**
 * 搜索框组件
 * 支持多搜索引擎切换
 */
const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('')
  const [enginePickerOpen, setEnginePickerOpen] = useState(false)
  const [generalSettings, setGeneralSettings] = useState(defaultGeneralSettings)

  const { config, init, setDefaultEngineId } = useSearchEngineStore()

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const load = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setGeneralSettings(data)
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

    const searchUrl = buildSearchUrl(String(resolvedEngineId), value.trim())
    if (generalSettings.search.openMethod === 'currentTab') {
      window.location.assign(searchUrl)
    } else {
      window.open(searchUrl, '_blank')
    }

    if (!generalSettings.search.keepSearchValue) {
      setSearchValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Tab') return
    if (!generalSettings.search.tabSwitchEngine) return

    e.preventDefault()

    const list = [...builtinEngines, ...customEngines]
    if (list.length <= 1) return
    const idx = list.findIndex((it: any) => it.id === resolvedEngineId)
    const next = list[(idx + 1 + list.length) % list.length]
    if (next?.id) {
      void handlePickEngine(next.id)
    }
  }

  return (
    <div className={styles.searchBarContainer}>
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
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPressEnter={() => handleSearch(searchValue)}
      />
    </div>
  )
}

export default SearchBar

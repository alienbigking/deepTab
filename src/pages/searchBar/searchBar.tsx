import React, { useEffect, useMemo, useState } from 'react'
import { Input, Select, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import styles from './searchBar.module.less'
import useSearchEngineStore from '../searchEngine/stores/searchEngine'

/**
 * 搜索框组件
 * 支持多搜索引擎切换
 */
const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('')

  const { config, init, setDefaultEngineId } = useSearchEngineStore()

  useEffect(() => {
    void init()
  }, [init])

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

  const engineOptions = useMemo(() => {
    const builtin = builtinEngines.map((it) => ({ value: it.id, label: it.name }))
    const custom = customEngines.map((it) => ({ value: it.id, label: it.name }))
    return [...builtin, ...custom]
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

  const handleSearch = (value: string) => {
    if (!value.trim()) return

    const searchUrl = buildSearchUrl(String(resolvedEngineId), value.trim())
    window.open(searchUrl, '_blank')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue)
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
            <span
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Select
                className={styles.engineSelect}
                value={resolvedEngineId}
                onChange={(v) => void setDefaultEngineId(v)}
                options={engineOptions}
                bordered={false}
                popupMatchSelectWidth={false}
              />
            </span>
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

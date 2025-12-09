import React, { useState } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import styles from './searchBar.module.less'

/**
 * 搜索框组件
 * 支持多搜索引擎切换
 */
const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (value: string) => {
    if (!value.trim()) return

    // 默认使用百度搜索，后续可从设置中读取
    const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(value)}`
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
        prefix={<SearchOutlined style={{ color: '#999', fontSize: 18 }} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPressEnter={() => handleSearch(searchValue)}
      />
    </div>
  )
}

export default SearchBar

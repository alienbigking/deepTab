import React from 'react'
import cn from 'classnames'
import { Card, Radio, Space } from 'antd'
import styles from './searchEngine.module.less'

const SearchEngine: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Card title='默认搜索引擎'>
        <Radio.Group defaultValue='baidu'>
          <Space direction='vertical'>
            <Radio value='baidu'>百度</Radio>
            <Radio value='google'>Google</Radio>
            <Radio value='bing'>Bing</Radio>
            <Radio value='duckduckgo'>DuckDuckGo</Radio>
          </Space>
        </Radio.Group>
      </Card>
    </div>
  )
}

export default SearchEngine

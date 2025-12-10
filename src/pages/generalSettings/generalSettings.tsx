import React from 'react'
import cn from 'classnames'
import { Form, Select, Switch, Button } from 'antd'
import styles from './generalSettings.module.less'

const GeneralSettings: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Form layout='vertical'>
        <Form.Item label='语言'>
          <Select defaultValue='zh'>
            <Select.Option value='zh'>中文</Select.Option>
            <Select.Option value='en'>English</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label='时间格式'>
          <Select defaultValue='24'>
            <Select.Option value='12'>12小时制</Select.Option>
            <Select.Option value='24'>24小时制</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label='显示天气' valuePropName='checked'>
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item label='显示时钟' valuePropName='checked'>
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item label='自动保存' valuePropName='checked'>
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item label='动画效果' valuePropName='checked'>
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item>
          <Button type='primary'>保存设置</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default GeneralSettings

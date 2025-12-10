import React from 'react'
import cn from 'classnames'
import { Card, Switch, Form, Select } from 'antd'
import styles from './notification.module.less'

const Notification: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Card title='通知设置'>
        <Form layout='vertical'>
          <Form.Item label='浏览器通知' valuePropName='checked'>
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label='邮件通知' valuePropName='checked'>
            <Switch />
          </Form.Item>
          <Form.Item label='声音提示' valuePropName='checked'>
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label='通知频率'>
            <Select defaultValue='realtime'>
              <Select.Option value='realtime'>实时</Select.Option>
              <Select.Option value='daily'>每日汇总</Select.Option>
              <Select.Option value='weekly'>每周汇总</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Notification

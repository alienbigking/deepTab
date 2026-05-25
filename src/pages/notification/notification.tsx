import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Form, Select, Switch } from 'antd'
import styles from './notification.module.less'
import notificationService from './services/notification'
import type { INotificationSettings } from './types/notification'

const Notification: React.FC = () => {
  const { message } = App.useApp()
  const [settings, setSettings] = useState<INotificationSettings>({
    enableBrowserNotification: true,
    enableEmailNotification: false,
    enableSoundNotification: true,
    notificationFrequency: 'realtime'
  })
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const load = async () => {
      const data = await notificationService.getNotificationSettings()
      setSettings(data)
      if ('Notification' in window) {
        setPermission(window.Notification.permission)
      }
    }
    void load()
  }, [])

  const save = async (next: INotificationSettings) => {
    setSettings(next)
    await notificationService.saveNotificationSettings(next)
    message.success('通知设置已保存')
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      message.warning('当前浏览器不支持通知')
      return
    }
    const next = await window.Notification.requestPermission()
    setPermission(next)
    if (next === 'granted') {
      message.success('浏览器通知已开启')
    }
  }

  const sendTest = () => {
    if (permission !== 'granted') {
      message.warning('请先授权浏览器通知')
      return
    }
    new window.Notification('Deep Tab', {
      body: '这是一条测试通知'
    })
  }

  return (
    <div className={cn(styles.container)}>
      <Card title='通知设置' className='dtSettingsCard' variant='borderless'>
        <Form layout='vertical'>
          <Form.Item label='浏览器通知' valuePropName='checked'>
            <Switch
              checked={settings.enableBrowserNotification}
              onChange={(value) => save({ ...settings, enableBrowserNotification: value })}
            />
          </Form.Item>
          <Form.Item label='邮件通知' valuePropName='checked'>
            <Switch
              checked={settings.enableEmailNotification}
              onChange={(value) => save({ ...settings, enableEmailNotification: value })}
            />
          </Form.Item>
          <Form.Item label='声音提示' valuePropName='checked'>
            <Switch
              checked={settings.enableSoundNotification}
              onChange={(value) => save({ ...settings, enableSoundNotification: value })}
            />
          </Form.Item>
          <Form.Item label='通知频率'>
            <Select
              value={settings.notificationFrequency}
              onChange={(value) => save({ ...settings, notificationFrequency: value })}
            >
              <Select.Option value='realtime'>实时</Select.Option>
              <Select.Option value='daily'>每日汇总</Select.Option>
              <Select.Option value='weekly'>每周汇总</Select.Option>
            </Select>
          </Form.Item>
          <div className={styles.actions}>
            <Button onClick={requestPermission}>授权浏览器通知</Button>
            <Button onClick={sendTest}>发送测试通知</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Notification

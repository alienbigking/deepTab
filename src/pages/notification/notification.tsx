import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Form, Select, Switch } from 'antd'
import styles from './notification.module.less'
import notificationService from './services/notification'
import type { INotificationSettings } from './types/notification'
import { useTranslation } from 'react-i18next'

const Notification: React.FC = () => {
  const { message } = App.useApp()
  const { t } = useTranslation()
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
    message.success(t('notification.saved', { defaultValue: 'Notification settings saved' }))
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      message.warning(t('notification.unsupported', { defaultValue: 'This browser does not support notifications' }))
      return
    }
    const next = await window.Notification.requestPermission()
    setPermission(next)
    if (next === 'granted') {
      message.success(t('notification.enabled', { defaultValue: 'Browser notifications enabled' }))
    }
  }

  const sendTest = () => {
    if (permission !== 'granted') {
      message.warning(t('notification.permissionRequired', { defaultValue: 'Allow browser notifications first' }))
      return
    }
    new window.Notification('Deep Tab', {
      body: t('notification.testBody', { defaultValue: 'This is a test notification' })
    })
  }

  return (
    <div className={cn(styles.container)}>
      <Card title={t('notification.title', { defaultValue: 'Notification settings' })} className='dtSettingsCard' variant='borderless'>
        <Form layout='vertical'>
          <Form.Item label={t('notification.browser', { defaultValue: 'Browser notifications' })} valuePropName='checked'>
            <Switch
              checked={settings.enableBrowserNotification}
              onChange={(value) => save({ ...settings, enableBrowserNotification: value })}
            />
          </Form.Item>
          <Form.Item label={t('notification.email', { defaultValue: 'Email notifications' })} valuePropName='checked'>
            <Switch
              checked={settings.enableEmailNotification}
              onChange={(value) => save({ ...settings, enableEmailNotification: value })}
            />
          </Form.Item>
          <Form.Item label={t('notification.sound', { defaultValue: 'Notification sound' })} valuePropName='checked'>
            <Switch
              checked={settings.enableSoundNotification}
              onChange={(value) => save({ ...settings, enableSoundNotification: value })}
            />
          </Form.Item>
          <Form.Item label={t('notification.frequency', { defaultValue: 'Frequency' })}>
            <Select
              value={settings.notificationFrequency}
              onChange={(value) => save({ ...settings, notificationFrequency: value })}
            >
              <Select.Option value='realtime'>{t('notification.realtime', { defaultValue: 'Real time' })}</Select.Option>
              <Select.Option value='daily'>{t('notification.daily', { defaultValue: 'Daily summary' })}</Select.Option>
              <Select.Option value='weekly'>{t('notification.weekly', { defaultValue: 'Weekly summary' })}</Select.Option>
            </Select>
          </Form.Item>
          <div className={styles.actions}>
            <Button onClick={requestPermission}>{t('notification.allow', { defaultValue: 'Allow browser notifications' })}</Button>
            <Button onClick={sendTest}>{t('notification.sendTest', { defaultValue: 'Send test notification' })}</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Notification

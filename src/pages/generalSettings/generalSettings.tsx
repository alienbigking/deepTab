import React, { useEffect } from 'react'
import cn from 'classnames'
import { App, Form, Select, Switch, Button } from 'antd'
import styles from './generalSettings.module.less'
import useGeneralSettingsStore from './stores/generalSettings'
import generalSettingsService from './services/generalSettings'
import type { IGeneralSettings } from './types/generalSettings'

const GeneralSettings: React.FC = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm<IGeneralSettings>()
  const { settings, setSettings } = useGeneralSettingsStore()

  useEffect(() => {
    const loadSettings = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setSettings(data)
      form.setFieldsValue(data)
    }
    loadSettings()
  }, [form, setSettings])

  useEffect(() => {
    form.setFieldsValue(settings)
  }, [settings, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSettings(values)
      await generalSettingsService.saveGeneralSettings(values)
      message.success('设置已保存')
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  return (
    <div className={cn(styles.container)}>
      <Form
        form={form}
        layout='vertical'
        initialValues={settings}
        onValuesChange={(_, allValues) => setSettings(allValues as IGeneralSettings)}
      >
        <Form.Item label='语言' name='language'>
          <Select>
            <Select.Option value='zh'>中文</Select.Option>
            <Select.Option value='en'>English</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label='时间格式' name='timeFormat'>
          <Select>
            <Select.Option value='12'>12小时制</Select.Option>
            <Select.Option value='24'>24小时制</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label='显示天气' name='showWeather' valuePropName='checked'>
          <Switch />
        </Form.Item>
        <Form.Item label='显示时钟' name='showClock' valuePropName='checked'>
          <Switch />
        </Form.Item>
        <Form.Item label='自动保存' name='autoSave' valuePropName='checked'>
          <Switch />
        </Form.Item>
        <Form.Item label='动画效果' name='animations' valuePropName='checked'>
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type='primary' onClick={handleSave}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default GeneralSettings

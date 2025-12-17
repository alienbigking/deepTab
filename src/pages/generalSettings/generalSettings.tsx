import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { Form, InputNumber, Select, Switch } from 'antd'
import styles from './generalSettings.module.less'
import useGeneralSettingsStore from './stores/generalSettings'
import generalSettingsService from './services/generalSettings'
import type { IGeneralSettings } from './types/generalSettings'

const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm<IGeneralSettings>()
  const { settings, setSettings } = useGeneralSettingsStore()
  const saveTimer = useRef<number | undefined>(undefined)

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

  return (
    <div className={cn(styles.container)}>
      <Form
        form={form}
        layout='vertical'
        initialValues={settings}
        onValuesChange={(_, allValues) => {
          const next = allValues as IGeneralSettings
          setSettings(next)

          if (saveTimer.current) {
            window.clearTimeout(saveTimer.current)
          }
          saveTimer.current = window.setTimeout(() => {
            void generalSettingsService.saveGeneralSettings(next)
          }, 300)
        }}
      >
        <div className={styles.section}>
          <div className={styles.sectionTitle}>控制栏</div>

          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>侧边栏</div>
              <div className={styles.rowControl}>
                <Form.Item name={['controlBar', 'sidebar']} noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value='alwaysShow'>一直显示</Select.Option>
                    <Select.Option value='alwaysHide'>一直隐藏</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>侧边栏位置</div>
              <div className={styles.rowControl}>
                <Form.Item name={['controlBar', 'sidebarPosition']} noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value='left'>左侧</Select.Option>
                    <Select.Option value='right'>右侧</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>底部栏</div>
              <div className={styles.rowControl}>
                <Form.Item name={['controlBar', 'bottomBar']} noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value='alwaysShow'>一直显示</Select.Option>
                    <Select.Option value='alwaysHide'>一直隐藏</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>搜索</div>

          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>搜索框样式</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'searchBarStyle']} noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value='default'>默认</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>打开方式</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'openMethod']} noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value='newTab'>新标签页</Select.Option>
                    <Select.Option value='currentTab'>当前标签页</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>搜索建议</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'searchSuggestions']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>搜索历史</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'searchHistory']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>Tab键切换搜索引擎</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'tabSwitchEngine']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>保留搜索框内容</div>
              <div className={styles.rowControl}>
                <Form.Item name={['search', 'keepSearchValue']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>其他设置</div>

          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>翻页灵敏度</div>
              <div className={styles.rowControl}>
                <Form.Item name={['other', 'scrollSensitivity']} noStyle>
                  <InputNumber min={1} max={100} style={{ width: 90 }} />
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>使用系统默认字体</div>
              <div className={styles.rowControl}>
                <Form.Item name={['other', 'useSystemFont']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>显示备案号</div>
              <div className={styles.rowControl}>
                <Form.Item name={['other', 'showIcp']} valuePropName='checked' noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default GeneralSettings

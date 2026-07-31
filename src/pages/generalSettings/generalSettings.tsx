import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { Card, Form, InputNumber, Select, Switch } from 'antd'
import styles from './generalSettings.module.less'
import useGeneralSettingsStore from './stores/generalSettings'
import generalSettingsService from './services/generalSettings'
import type { IGeneralSettings } from './types/generalSettings'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_OPTIONS, normalizeLanguage, type AppLanguage } from '@/i18n/types'
import settingsSidebarService from '@/pages/settingsSidebar/services/settingsSidebar'

const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm<IGeneralSettings>()
  const { settings, setSettings } = useGeneralSettingsStore()
  const saveTimer = useRef<number | undefined>(undefined)
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = React.useState<AppLanguage>(normalizeLanguage(i18n.language))

  const changeLanguage = async (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage)
    await i18n.changeLanguage(nextLanguage)
    const appSettings = await settingsSidebarService.getAppSettings()
    await settingsSidebarService.saveAppSettings({ ...appSettings, language: nextLanguage })
  }

  const openSearchStyle = () => {
    window.dispatchEvent(new CustomEvent('dt:openSearchStyle'))
  }

  useEffect(() => {
    const loadSettings = async () => {
      const data = await generalSettingsService.getGeneralSettings()
      setSettings(data)
      form.setFieldsValue(data)
    }
    loadSettings()

    const onChanged = (changes: any, areaName: string) => {
      if (areaName !== 'local') return
      if (!changes?.generalSettings) return
      void loadSettings()
    }

    chrome.storage.onChanged.addListener(onChanged)

    return () => {
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [form, setSettings])

  useEffect(() => {
    form.setFieldsValue(settings)
  }, [settings, form])

  return (
    <div className={cn(styles.container)}>
      <Card className={cn('dtSettingsCard', styles.card)} variant='borderless'>
        <Form
          form={form}
          layout='vertical'
          initialValues={settings}
          onValuesChange={(_, allValues) => {
            const raw = allValues as Partial<IGeneralSettings>
            const next: IGeneralSettings = {
              ...settings,
              ...raw,
              controlBar: { ...settings.controlBar, ...(raw as any).controlBar },
              search: { ...settings.search, ...(raw as any).search },
              other: { ...settings.other, ...(raw as any).other }
            }
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
            <div className={styles.sectionTitle}>{t('general.controlBar')}</div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.sidebar')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['controlBar', 'sidebar']} noStyle>
                    <Select style={{ width: 140 }}>
                      <Select.Option value='alwaysShow'>{t('general.alwaysShow')}</Select.Option>
                      <Select.Option value='alwaysHide'>{t('general.alwaysHide')}</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.sidebarPosition')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['controlBar', 'sidebarPosition']} noStyle>
                    <Select style={{ width: 140 }}>
                      <Select.Option value='left'>{t('general.left')}</Select.Option>
                      <Select.Option value='right'>{t('general.right')}</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.bottomBar')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['controlBar', 'bottomBar']} noStyle>
                    <Select style={{ width: 140 }}>
                      <Select.Option value='alwaysShow'>{t('general.alwaysShow')}</Select.Option>
                      <Select.Option value='alwaysHide'>{t('general.alwaysHide')}</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('general.search')}</div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.searchBarStyle')}</div>
                <div className={styles.rowControl}>
                  <div
                    className={styles.searchStyleTrigger}
                    onClick={openSearchStyle}
                    role='button'
                    tabIndex={0}
                  >
                    <div className={styles.searchStyleValue}>
                      {t('general.width')} {settings.search.searchBarWidth}%
                    </div>
                    <div className={styles.searchStyleValue}>
                      {t('general.opacity')} {settings.search.searchBarOpacity}%
                    </div>
                    <div className={styles.searchStyleArrow}>›</div>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.openMethod')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['search', 'openMethod']} noStyle>
                    <Select style={{ width: 140 }}>
                      <Select.Option value='newTab'>{t('general.newTab')}</Select.Option>
                      <Select.Option value='currentTab'>{t('general.currentTab')}</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.searchSuggestions')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['search', 'searchSuggestions']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.searchHistory')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['search', 'searchHistory']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.tabSwitchEngine')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['search', 'tabSwitchEngine']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.keepSearchValue')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['search', 'keepSearchValue']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('general.other')}</div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.language')}</div>
                <div className={styles.rowControl}>
                  <Select
                    value={language}
                    options={LANGUAGE_OPTIONS}
                    style={{ width: 180 }}
                    onChange={(value: AppLanguage) => void changeLanguage(value)}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.scrollSensitivity')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['other', 'scrollSensitivity']} noStyle>
                    <InputNumber min={1} max={100} style={{ width: 90 }} />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.systemFont')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['other', 'useSystemFont']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLabel}>{t('general.showIcp')}</div>
                <div className={styles.rowControl}>
                  <Form.Item name={['other', 'showIcp']} valuePropName='checked' noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default GeneralSettings

import React, { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { Button, Card, Checkbox, Form, Image, Input, Modal, Tag, Upload } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  GoogleOutlined,
  LinkOutlined,
  PlusOutlined
} from '@ant-design/icons'
import styles from './searchEngine.module.less'
import useSearchEngineStore from './stores/searchEngine'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import { useTranslation } from 'react-i18next'

const SearchEngine: React.FC = () => {
  const { config, init, setDefaultEngineId, upsertCustomEngine, removeCustomEngine } =
    useSearchEngineStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lastAutoIcon, setLastAutoIcon] = useState<string>('')
  const [form] = Form.useForm()
  const iconPreview = Form.useWatch('icon', form)
  const { t } = useTranslation()

  function toFaviconUrl(template: string) {
    const v = String(template || '').trim()
    if (!v) return ''
    try {
      const sample = v.includes('{q}') ? v.replaceAll('{q}', 'test') : v.replace('%s', 'test')
      const url = new URL(sample)
      return `${url.origin}/favicon.ico`
    } catch {
      return ''
    }
  }

  function toLocalBuiltinIconUrls(engineId: string) {
    try {
      const getURL = chrome?.runtime?.getURL
      if (!getURL) return []
      return [
        getURL(`src/assets/images/searchEngines/${engineId}.svg`),
        getURL(`src/assets/images/searchEngines/${engineId}.png`),
        getURL(`src/assets/images/searchEngines/${engineId}.ico`)
      ]
    } catch {
      return []
    }
  }

  const BuiltinIcon: React.FC<{
    engineId: string
    template: string
    name: string
    fallback: React.ReactNode
  }> = ({ engineId, template, name, fallback }) => {
    const [tryIndex, setTryIndex] = useState(0)

    const iconUrls = useMemo(() => {
      const urls: string[] = []
      urls.push(...toLocalBuiltinIconUrls(engineId))
      const favicon = toFaviconUrl(template)
      if (favicon) urls.push(favicon)
      return urls
    }, [engineId, template])

    useEffect(() => {
      setTryIndex(0)
    }, [engineId, iconUrls.join('|')])

    const active = iconUrls[tryIndex]

    if (active) {
      return (
        <img
          className={styles.engineIconImg}
          src={active}
          alt={name}
          onError={() => setTryIndex((v) => v + 1)}
        />
      )
    }

    return <>{fallback}</>
  }

  useEffect(() => {
    void init()
  }, [init])

  const builtinEngines = useMemo(
    () => [
      {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com/s?wd={q}',
        icon: <GlobalOutlined />
      },
      {
        id: 'google',
        name: 'Google',
        url: 'https://www.google.com/search?q={q}',
        icon: <GoogleOutlined />
      },
      {
        id: 'bing',
        name: 'Bing',
        url: 'https://www.bing.com/search?q={q}',
        icon: <GlobalOutlined />
      },
      {
        id: 'duckduckgo',
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q={q}',
        icon: <GlobalOutlined />
      }
    ],
    []
  )

  const customEngines = config.customEngines ?? []
  const defaultEngineId = config.defaultEngineId

  const defaultEngineName = useMemo(() => {
    const builtin = builtinEngines.find((it) => it.id === defaultEngineId)
    if (builtin) return builtin.name
    const custom = customEngines.find((it) => it.id === defaultEngineId)
    return custom?.name || defaultEngineId
  }, [builtinEngines, customEngines, defaultEngineId])

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ setAsDefault: true })
    setLastAutoIcon('')
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const engine = customEngines.find((it) => it.id === id)
    if (!engine) return

    setEditingId(id)
    form.resetFields()

    const auto = toFaviconUrl(engine.url)
    setLastAutoIcon(auto)

    form.setFieldsValue({
      name: engine.name,
      url: engine.url,
      icon: engine.icon,
      setAsDefault: defaultEngineId === id
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setLastAutoIcon('')
    form.resetFields()
  }

  const validateUrlTemplate = (_: any, value?: string) => {
    const v = (value || '').trim()
    if (!v) return Promise.reject(new Error(t('searchEngine.urlRequired', { defaultValue: 'Enter a search URL' })))
    const ok = v.includes('{q}') || v.includes('%s')
    if (!ok) return Promise.reject(new Error(t('searchEngine.placeholderRequired', { defaultValue: 'The URL must contain {q} or %s as the query placeholder' })))
    return Promise.resolve()
  }

  const genId = () => {
    try {
      return `custom_${crypto.randomUUID()}`
    } catch {
      return `custom_${Date.now()}_${Math.random().toString(16).slice(2)}`
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const id = editingId ?? genId()

    const engine = {
      id,
      name: String(values.name || '').trim(),
      url: String(values.url || '').trim(),
      icon: values.icon ? String(values.icon).trim() : undefined
    }

    await upsertCustomEngine(engine)
    if (values.setAsDefault) {
      await setDefaultEngineId(id)
    }
    closeModal()
  }

  const onFormValuesChange = (changed: any, all: any) => {
    if (!('url' in changed)) return

    const nextAuto = toFaviconUrl(all.url)
    setLastAutoIcon(nextAuto)

    const currentIcon = String(all.icon || '').trim()
    if (!currentIcon || currentIcon === lastAutoIcon) {
      if (nextAuto) {
        form.setFieldValue('icon', nextAuto)
      } else {
        form.setFieldValue('icon', undefined)
      }
    }
  }

  const handleUploadBefore = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      form.setFieldValue('icon', dataUrl)
      setLastAutoIcon('')
    }
    reader.readAsDataURL(file)
    return false
  }

  return (
    <div className={cn(styles.container)}>
      <Card
        className='dtSettingsCard'
        title={t('searchEngine.defaultTitle', { defaultValue: 'Default search engine' })}
        extra={
          <div className={styles.currentDefault}>
            <span className={styles.currentDefaultLabel}>{t('searchEngine.current', { defaultValue: 'Current' })}: </span>
            <Tag color='processing'>{defaultEngineName}</Tag>
          </div>
        }
      >
        <div className={styles.builtinGrid}>
          {builtinEngines.map((it) => (
            <div
              key={it.id}
              className={cn(styles.engineCard, defaultEngineId === it.id && styles.active)}
              onClick={() => void setDefaultEngineId(it.id)}
              role='button'
              tabIndex={0}
            >
              <div className={styles.engineIcon}>
                <BuiltinIcon engineId={it.id} template={it.url} name={it.name} fallback={it.icon} />
              </div>
              <div className={styles.engineMeta}>
                <div className={styles.engineName}>{it.name}</div>
                <div className={styles.engineUrl}>{it.url}</div>
              </div>
              {defaultEngineId === it.id ? <Tag color='success'>{t('searchEngine.default', { defaultValue: 'Default' })}</Tag> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card
        className='dtSettingsCard'
        title={t('searchEngine.customTitle', { defaultValue: 'Custom search engines' })}
        extra={
          <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
            {t('common.add')}
          </Button>
        }
      >
        {customEngines.length ? (
          <div className={styles.customList}>
            {customEngines.map((it) => (
              <div key={it.id} className={styles.customRow}>
                <div className={styles.customMain}>
                  <div className={styles.customName}>
                    <LinkOutlined />
                    <span>{it.name}</span>
                    {defaultEngineId === it.id ? <Tag color='success'>{t('searchEngine.default', { defaultValue: 'Default' })}</Tag> : null}
                  </div>
                  <div className={styles.customUrl}>{it.url}</div>
                </div>
                <div className={styles.customActions}>
                  {defaultEngineId !== it.id ? (
                    <Button size='small' onClick={() => void setDefaultEngineId(it.id)}>
                      {t('searchEngine.setDefault', { defaultValue: 'Set as default' })}
                    </Button>
                  ) : null}
                  <Button size='small' icon={<EditOutlined />} onClick={() => openEdit(it.id)} />
                  <Button
                    size='small'
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: t('searchEngine.deleteTitle', { defaultValue: 'Delete custom search engine' }),
                        content: t('searchEngine.deleteConfirm', { name: it.name, defaultValue: `Delete “${it.name}”?` }),
                        okText: t('common.delete'),
                        cancelText: t('common.cancel'),
                        okButtonProps: { danger: true },
                        maskTransitionName: modalMaskTransitionName,
                        maskStyle: modalMaskStyle,
                        onOk: async () => {
                          await removeCustomEngine(it.id)
                        }
                      })
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{t('searchEngine.empty', { defaultValue: 'No custom search engines. Use Add to create one.' })}</div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? t('searchEngine.editTitle', { defaultValue: 'Edit custom search engine' }) : t('searchEngine.addTitle', { defaultValue: 'Add custom search engine' })}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        onOk={handleSubmit}
        onCancel={closeModal}
        maskTransitionName={modalMaskTransitionName}
        maskStyle={modalMaskStyle}
        destroyOnHidden
      >
        <Form form={form} layout='vertical' onValuesChange={onFormValuesChange}>
          <Form.Item
            name='name'
            label={t('addApp.name', { defaultValue: 'Name' })}
            rules={[{ required: true, message: t('searchEngine.nameRequired', { defaultValue: 'Enter a name' }) }]}
            normalize={(v) => (typeof v === 'string' ? v.trimStart() : v)}
          >
            <Input placeholder={t('searchEngine.nameExample', { defaultValue: 'Example: GitHub / Wikipedia' })} />
          </Form.Item>
          <Form.Item name='url' label={t('searchEngine.searchUrl', { defaultValue: 'Search URL' })} rules={[{ validator: validateUrlTemplate }]}>
            <Input placeholder={t('searchEngine.urlExample', { defaultValue: 'Example: https://www.google.com/search?q={q}' })} />
          </Form.Item>
          <Form.Item label={t('searchEngine.icon', { defaultValue: 'Icon' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Form.Item name='icon' noStyle>
                <Input placeholder={t('searchEngine.iconPlaceholder', { defaultValue: 'Image URL / favicon / data URL' })} />
              </Form.Item>
              <Upload accept='image/*' showUploadList={false} beforeUpload={handleUploadBefore}>
                <Button>{t('addApp.upload', { defaultValue: 'Upload' })}</Button>
              </Upload>
              <Button
                onClick={() => {
                  const url = String(form.getFieldValue('url') || '')
                  const auto = toFaviconUrl(url)
                  if (auto) {
                    form.setFieldValue('icon', auto)
                    setLastAutoIcon(auto)
                  }
                }}
              >
                {t('searchEngine.useWebsiteIcon', { defaultValue: 'Use website icon' })}
              </Button>
              <Button
                onClick={() => {
                  form.setFieldValue('icon', undefined)
                  setLastAutoIcon('')
                }}
              >
                {t('search.clear')}
              </Button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{t('searchEngine.preview', { defaultValue: 'Preview' })}: </span>
              {String(iconPreview || '').trim() ? (
                <Image
                  preview={false}
                  width={28}
                  height={28}
                  src={String(iconPreview || '')}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(22,119,255,0.15)'
                  }}
                />
              )}
            </div>
          </Form.Item>
          <Form.Item name='setAsDefault' valuePropName='checked'>
            <Checkbox>{t('searchEngine.setDefault', { defaultValue: 'Set as default' })}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SearchEngine

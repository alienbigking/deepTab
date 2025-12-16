import React, { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { Button, Card, Checkbox, Form, Input, Modal, Tag } from 'antd'
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

const SearchEngine: React.FC = () => {
  const { config, init, setDefaultEngineId, upsertCustomEngine, removeCustomEngine } =
    useSearchEngineStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

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
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const engine = customEngines.find((it) => it.id === id)
    if (!engine) return

    setEditingId(id)
    form.resetFields()
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
    form.resetFields()
  }

  const validateUrlTemplate = (_: any, value?: string) => {
    const v = (value || '').trim()
    if (!v) return Promise.reject(new Error('请输入搜索 URL'))
    const ok = v.includes('{q}') || v.includes('%s')
    if (!ok) return Promise.reject(new Error('URL 需要包含 {q} 或 %s 作为关键词占位符'))
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

  return (
    <div className={cn(styles.container)}>
      <Card
        title='默认搜索引擎'
        extra={
          <div className={styles.currentDefault}>
            <span className={styles.currentDefaultLabel}>当前：</span>
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
              <div className={styles.engineIcon}>{it.icon}</div>
              <div className={styles.engineMeta}>
                <div className={styles.engineName}>{it.name}</div>
                <div className={styles.engineUrl}>{it.url}</div>
              </div>
              {defaultEngineId === it.id ? <Tag color='success'>默认</Tag> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card
        title='自定义搜索引擎'
        extra={
          <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
            添加
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
                    {defaultEngineId === it.id ? <Tag color='success'>默认</Tag> : null}
                  </div>
                  <div className={styles.customUrl}>{it.url}</div>
                </div>
                <div className={styles.customActions}>
                  {defaultEngineId !== it.id ? (
                    <Button size='small' onClick={() => void setDefaultEngineId(it.id)}>
                      设为默认
                    </Button>
                  ) : null}
                  <Button size='small' icon={<EditOutlined />} onClick={() => openEdit(it.id)} />
                  <Button
                    size='small'
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: '删除自定义搜索引擎',
                        content: `确定删除 “${it.name}” 吗？`,
                        okText: '删除',
                        cancelText: '取消',
                        okButtonProps: { danger: true },
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
          <div className={styles.empty}>暂无自定义搜索引擎，点击右上角添加</div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? '编辑自定义搜索引擎' : '新增自定义搜索引擎'}
        okText='保存'
        cancelText='取消'
        onOk={handleSubmit}
        onCancel={closeModal}
        destroyOnClose
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='name'
            label='名称'
            rules={[{ required: true, message: '请输入名称' }]}
            normalize={(v) => (typeof v === 'string' ? v.trimStart() : v)}
          >
            <Input placeholder='例如：掘金 / GitHub / 维基百科' />
          </Form.Item>
          <Form.Item name='url' label='搜索 URL' rules={[{ validator: validateUrlTemplate }]}>
            <Input placeholder='例如：https://www.google.com/search?q={q}' />
          </Form.Item>
          <Form.Item name='icon' label='图标（可选）'>
            <Input placeholder='可填写图片 URL（后续可扩展）' />
          </Form.Item>
          <Form.Item name='setAsDefault' valuePropName='checked'>
            <Checkbox>设为默认搜索引擎</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SearchEngine

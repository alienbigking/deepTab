import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { FormInstance } from 'antd'
import { Form, Input, Button, message } from 'antd'
import cn from 'classnames'
import styles from './addAppModalCustom.module.less'

interface AddAppModalCustomProps {
  form: FormInstance
  iconColor: string
  loading?: boolean
  autoFilling?: boolean
  onIconColorChange: (color: string) => void
  onFetchIcon: () => void
  onSave: () => void
  onSaveAndContinue: () => void
}

const AddAppModalCustom: React.FC<AddAppModalCustomProps> = ({
  form,
  iconColor,
  loading = false,
  autoFilling = false,
  onIconColorChange,
  onFetchIcon,
  onSave,
  onSaveAndContinue
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastUrlRef = useRef('')
  const [previewIconIndex, setPreviewIconIndex] = useState(0)
  const iconValue = Form.useWatch('icon', form)
  const urlValue = Form.useWatch('url', form)
  const iconTextValue = Form.useWatch('iconText', form)
  const iconText = String(iconTextValue || 'A').slice(0, 8)

  const faviconUrlsFromInput = (value: string) => {
    const raw = String(value || '').trim()
    if (!raw) return []
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      const url = new URL(normalized)
      if (!url.hostname.includes('.')) return []
      const origin = `${url.protocol}//${url.hostname}`
      return [
        `${origin}/favicon.ico`,
        `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`,
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`
      ]
    } catch {
      return []
    }
  }

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (dataUrl) {
        form.setFieldValue('icon', dataUrl)
        message.success('图标已上传')
      }
      event.target.value = ''
    }
    reader.onerror = () => {
      message.error('读取图片失败')
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const isImageIcon = /^(https?:\/\/|data:image\/)/.test(String(iconValue || ''))
  const iconCandidates = useMemo(() => {
    if (!isImageIcon) return []
    if (/^data:image\//i.test(String(iconValue || ''))) return [String(iconValue)]
    return Array.from(
      new Set([String(iconValue || ''), ...faviconUrlsFromInput(urlValue)].filter(Boolean))
    )
  }, [iconValue, isImageIcon, urlValue])
  const activePreviewIcon = iconCandidates[previewIconIndex]

  useEffect(() => {
    const url = String(urlValue || '').trim()
    if (url === lastUrlRef.current) return
    lastUrlRef.current = url

    if (/^data:image\//i.test(String(form.getFieldValue('icon') || ''))) return
    const nextIcon = faviconUrlsFromInput(urlValue)[0]
    if (nextIcon) {
      form.setFieldValue('icon', nextIcon)
    }
  }, [form, urlValue])

  useEffect(() => {
    setPreviewIconIndex(0)
  }, [iconValue, urlValue])

  return (
    <Form form={form} layout='vertical' autoComplete='off' className={styles.container}>
      <Form.Item name='icon' hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label='地址'
        name='url'
        rules={[
          { required: true, message: '请输入链接地址' },
          {
            validator: (_, value) => {
              const raw = String(value || '').trim()
              if (!raw) return Promise.resolve()
              const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
              try {
                const url = new URL(normalized)
                return url.hostname.includes('.')
                  ? Promise.resolve()
                  : Promise.reject(new Error('请输入有效的网站地址'))
              } catch {
                return Promise.reject(new Error('请输入有效的网站地址'))
              }
            }
          }
        ]}
      >
        <Input
          placeholder='https://'
          onBlur={(event) => {
            const nextIcon = faviconUrlsFromInput(event.target.value)[0]
            if (nextIcon) form.setFieldValue('icon', nextIcon)
          }}
          addonAfter={
            <Button type='link' loading={autoFilling} onClick={onFetchIcon}>
              {autoFilling ? '获取中' : '获取图标'}
            </Button>
          }
        />
      </Form.Item>

      <Form.Item label='名称' name='name' rules={[{ required: true, message: '请输入网站名称' }]}>
        <Input placeholder='网站名称' />
      </Form.Item>

      <div className={styles.row}>
        <Form.Item label='图标颜色' style={{ marginBottom: 0 }}>
          <div className={styles.colors}>
            {['#1890ff', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1', '#000000'].map((color) => (
              <span
                key={color}
                className={cn(styles.colorDot, iconColor === color && styles.colorDotActive)}
                style={{ backgroundColor: color }}
                onClick={() => onIconColorChange(color)}
              />
            ))}
          </div>
        </Form.Item>

        <Form.Item
          label='图标文字'
          name='iconText'
          rules={[
            {
              validator: (_, value) => {
                const icon = String(form.getFieldValue('icon') || '')
                if (/^(https?:\/\/|data:image\/)/.test(icon)) return Promise.resolve()
                return String(value || '').trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error('请输入图标文字'))
              }
            }
          ]}
          style={{ flex: 1, marginBottom: 0 }}
        >
          <Input
            placeholder='例如: A'
            maxLength={8}
            showCount
            onChange={(event) => {
              const icon = String(form.getFieldValue('icon') || '')
              if (!/^(https?:\/\/|data:image\/)/.test(icon)) {
                form.setFieldValue('icon', event.target.value)
              }
            }}
          />
        </Form.Item>
      </div>

      <div className={styles.previewRow}>
        <div>
          <div
            className={cn(styles.iconCard, isImageIcon && styles.imageIconCard)}
            style={{ backgroundColor: isImageIcon ? undefined : iconColor }}
          >
            {isImageIcon && activePreviewIcon ? (
              <img
                src={activePreviewIcon}
                alt=''
                className={styles.previewImg}
                onLoad={() => {
                  if (activePreviewIcon !== iconValue) form.setFieldValue('icon', activePreviewIcon)
                }}
                onError={() => setPreviewIconIndex((index) => index + 1)}
              />
            ) : (
              iconText
            )}
          </div>
          <div className={styles.typeLabel}>
            {isImageIcon && activePreviewIcon ? '网站图标' : '文字图标'}
          </div>
        </div>
        <div>
          <div className={styles.uploadCard} onClick={() => fileInputRef.current?.click()}>
            +
          </div>
          <div className={styles.typeLabel}>上传</div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <div className={styles.actions}>
        <Button type='primary' loading={loading} onClick={onSave}>
          保存
        </Button>
        <Button loading={loading} onClick={onSaveAndContinue}>
          保存并继续
        </Button>
      </div>
    </Form>
  )
}

export default AddAppModalCustom

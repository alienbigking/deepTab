import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { FormInstance } from 'antd'
import { Form, Input, Button, ColorPicker, Segmented, message } from 'antd'
import cn from 'classnames'
import styles from './addAppModalCustom.module.less'
import { isImageIconSource } from './iconFallback'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastUrlRef = useRef('')
  const presetColors = ['#1890ff', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1', '#000000']
  const [failedIconUrls, setFailedIconUrls] = useState<string[]>([])
  const [selectedPreviewKey, setSelectedPreviewKey] = useState('image-0')
  const iconValue = Form.useWatch('icon', form)
  const urlValue = Form.useWatch('url', form)
  const iconTextValue = Form.useWatch('iconText', form)
  const iconBgMode = Form.useWatch('iconBgMode', form) || 'theme'
  const useCustomIconBg = iconBgMode === 'custom'
  const iconText = String(iconTextValue || '').trim().slice(0, 8)
  const shortIconText = iconText.slice(0, 1).toUpperCase()

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
      message.warning(t('profile.imageRequired', { defaultValue: 'Choose an image file' }))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (dataUrl) {
        form.setFieldValue('icon', dataUrl)
        setSelectedPreviewKey('image-0')
        message.success(t('addApp.iconUploaded', { defaultValue: 'Icon uploaded' }))
      }
      event.target.value = ''
    }
    reader.onerror = () => {
      message.error(t('addApp.imageReadFailed', { defaultValue: 'Could not read the image' }))
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const icon = String(iconValue || '')
  const isImageIcon = isImageIconSource(icon)
  const imageIconCandidates = useMemo(() => {
    const currentIcon = String(iconValue || '')
    if (/^(data:image\/|src\/assets\/images\/)/i.test(currentIcon)) return [currentIcon]
    return Array.from(
      new Set([
        isImageIconSource(currentIcon) ? currentIcon : '',
        ...faviconUrlsFromInput(urlValue)
      ].filter(Boolean))
    )
  }, [iconValue, urlValue])
  const imageIconSlots = [imageIconCandidates[0] || '', imageIconCandidates[1] || '']
  const textIconSlots = [
    { label: t('addApp.textIcon', { defaultValue: 'Text icon' }), value: iconText },
    { label: t('addApp.shortIcon', { defaultValue: 'Short icon' }), value: shortIconText }
  ]
  useEffect(() => {
    const url = String(urlValue || '').trim()
    if (url === lastUrlRef.current) return
    lastUrlRef.current = url

    if (/^data:image\//i.test(String(form.getFieldValue('icon') || ''))) return
    const nextIcon = faviconUrlsFromInput(urlValue)[0]
    if (nextIcon) {
      form.setFieldValue('icon', nextIcon)
      setSelectedPreviewKey('image-0')
    }
  }, [form, urlValue])

  useEffect(() => {
    setFailedIconUrls([])
  }, [urlValue])

  useEffect(() => {
    if (icon || urlValue || iconTextValue) return
    setSelectedPreviewKey('image-0')
    setFailedIconUrls([])
  }, [icon, iconTextValue, urlValue])

  useEffect(() => {
    if (!isImageIcon) return
    if (icon && imageIconCandidates.includes(icon)) return
    const nextIcon = imageIconCandidates[0]
    if (nextIcon) {
      form.setFieldValue('icon', nextIcon)
      setSelectedPreviewKey('image-0')
    }
  }, [form, icon, imageIconCandidates, isImageIcon])

  useEffect(() => {
    if (!isImageIcon || !failedIconUrls.includes(icon)) return
    const nextIconIndex = imageIconCandidates.findIndex((item) => !failedIconUrls.includes(item))
    const nextIcon = imageIconCandidates[nextIconIndex]
    if (nextIcon) {
      form.setFieldValue('icon', nextIcon)
      setSelectedPreviewKey(`image-${Math.min(nextIconIndex, 1)}`)
    }
  }, [failedIconUrls, form, icon, imageIconCandidates, isImageIcon])

  return (
    <Form form={form} layout='vertical' autoComplete='off' className={styles.container}>
      <Form.Item name='icon' hidden>
        <Input />
      </Form.Item>
      <Form.Item name='iconBgMode' hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label={t('addApp.address', { defaultValue: 'Address' })}
        name='url'
        rules={[
          { required: true, message: t('addApp.addressRequired', { defaultValue: 'Enter a website address' }) },
          {
            validator: (_, value) => {
              const raw = String(value || '').trim()
              if (!raw) return Promise.resolve()
              const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
              try {
                const url = new URL(normalized)
                return url.hostname.includes('.')
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('addApp.validUrl', { defaultValue: 'Enter a valid website address' })))
              } catch {
                return Promise.reject(new Error(t('addApp.validUrl', { defaultValue: 'Enter a valid website address' })))
              }
            }
          }
        ]}
      >
        <Input
          placeholder='https://'
          onBlur={(event) => {
            const nextIcon = faviconUrlsFromInput(event.target.value)[0]
            if (nextIcon) {
              form.setFieldValue('icon', nextIcon)
              setSelectedPreviewKey('image-0')
            }
          }}
          addonAfter={
            <Button type='link' loading={autoFilling} onClick={onFetchIcon}>
              {autoFilling ? t('common.loading') : t('addApp.fetchIcon', { defaultValue: 'Fetch icon' })}
            </Button>
          }
        />
      </Form.Item>

      <Form.Item label={t('addApp.name', { defaultValue: 'Name' })} name='name' rules={[{ required: true, message: t('addApp.nameRequired', { defaultValue: 'Enter a website name' }) }]}>
        <Input placeholder={t('addApp.websiteName', { defaultValue: 'Website name' })} />
      </Form.Item>

      <div className={styles.row}>
        <Form.Item label={t('addApp.backgroundMode', { defaultValue: 'Background mode' })} style={{ marginBottom: 0 }}>
          <div className={styles.backgroundMode}>
            <Segmented
              className={styles.modeSegment}
              value={iconBgMode}
              onChange={(value) => form.setFieldValue('iconBgMode', String(value))}
              options={[
                { label: t('addApp.followTheme', { defaultValue: 'Follow theme' }), value: 'theme' },
                { label: t('addApp.customColor', { defaultValue: 'Custom color' }), value: 'custom' }
              ]}
            />
            {useCustomIconBg && (
              <div className={styles.colors}>
                {presetColors.map((color) => (
                  <span
                    key={color}
                    className={cn(styles.colorDot, iconColor === color && styles.colorDotActive)}
                    style={{ backgroundColor: color }}
                    onClick={() => onIconColorChange(color)}
                  />
                ))}
                <ColorPicker
                  value={iconColor}
                  disabledAlpha
                  placement='bottomLeft'
                  onChangeComplete={(color) => onIconColorChange(color.toHexString())}
                >
                  <button
                    type='button'
                    className={cn(
                      styles.customColorButton,
                      !presetColors.includes(iconColor) && styles.customColorButtonActive
                    )}
                    aria-label={t('addApp.customColor', { defaultValue: 'Custom color' })}
                  />
                </ColorPicker>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item
          label={t('addApp.iconText', { defaultValue: 'Icon text' })}
          name='iconText'
          rules={[
            {
              validator: (_, value) => {
                const icon = String(form.getFieldValue('icon') || '')
                if (isImageIconSource(icon)) return Promise.resolve()
                return String(value || '').trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('addApp.iconTextRequired', { defaultValue: 'Enter icon text' })))
              }
            }
          ]}
          style={{ flex: 1, marginBottom: 0 }}
        >
          <Input
            placeholder={t('addApp.iconTextExample', { defaultValue: 'Example: A' })}
            maxLength={8}
            showCount
            onChange={(event) => {
              const icon = String(form.getFieldValue('icon') || '')
              if (!isImageIconSource(icon)) {
                form.setFieldValue('icon', event.target.value)
                setSelectedPreviewKey('text-0')
              }
            }}
          />
        </Form.Item>
      </div>

      <div className={styles.previewRow}>
        {imageIconSlots.map((candidate, index) => {
          const failed = failedIconUrls.includes(candidate)
          const disabled = !candidate || failed
          return (
            <div
              key={`image-${index}`}
              className={cn(styles.previewItem, disabled && styles.previewItemDisabled)}
              onClick={() => {
                if (disabled) return
                form.setFieldValue('icon', candidate)
                setSelectedPreviewKey(`image-${index}`)
              }}
            >
              <div className={cn(
                styles.iconCard,
                styles.imageIconCard,
                disabled && styles.iconCardFailed,
                selectedPreviewKey === `image-${index}` && !disabled && styles.iconCardActive
              )}>
                {disabled ? (
                  <span className={styles.iconFailedText}>?</span>
                ) : (
                  <img
                    src={candidate}
                    alt=''
                    className={styles.previewImg}
                    onError={() => {
                      setFailedIconUrls((list) => Array.from(new Set([...list, candidate])))
                    }}
                  />
                )}
              </div>
              <div className={styles.typeLabel}>
                {disabled ? t('addApp.noIcon', { defaultValue: 'No icon' }) : index === 0 ? t('addApp.websiteIcon', { defaultValue: 'Website icon' }) : t('addApp.fallbackIcon', { defaultValue: 'Alternative icon' })}
              </div>
            </div>
          )
        })}

        {textIconSlots.map((item, index) => {
          const disabled = !item.value
          return (
          <div
            key={item.label}
            className={cn(styles.previewItem, disabled && styles.previewItemDisabled)}
            onClick={() => {
              if (disabled) return
              form.setFieldValue('icon', item.value)
              setSelectedPreviewKey(`text-${index}`)
            }}
          >
            <div
              className={cn(
                styles.iconCard,
                disabled && styles.iconCardFailed,
                selectedPreviewKey === `text-${index}` && !disabled && styles.iconCardActive
              )}
              style={{ background: useCustomIconBg ? iconColor : 'var(--dt-app-icon-bg, rgba(10, 18, 30, 0.82))' }}
            >
              <span
                className={disabled ? styles.iconFailedText : styles.iconTextPreview}
                style={{ '--dt-icon-text-length': Math.max(item.value.length, 1) } as React.CSSProperties}
              >
                {disabled ? '?' : item.value}
              </span>
            </div>
            <div className={styles.typeLabel}>{disabled ? t('addApp.noText', { defaultValue: 'No text' }) : item.label}</div>
          </div>
          )
        })}

        <div className={styles.previewItem}>
          <div className={styles.uploadCard} onClick={() => fileInputRef.current?.click()}>
            +
          </div>
          <div className={styles.typeLabel}>{t('addApp.upload', { defaultValue: 'Upload' })}</div>
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
          {t('common.save')}
        </Button>
        <Button loading={loading} onClick={onSaveAndContinue}>
          {t('addApp.saveContinue', { defaultValue: 'Save and continue' })}
        </Button>
      </div>
    </Form>
  )
}

export default AddAppModalCustom

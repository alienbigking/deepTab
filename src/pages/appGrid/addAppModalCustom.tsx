import React, { useRef } from 'react'
import type { FormInstance } from 'antd'
import { Form, Input, Button, message } from 'antd'
import cn from 'classnames'
import styles from './addAppModalCustom.module.less'

interface AddAppModalCustomProps {
  form: FormInstance
  iconColor: string
  onIconColorChange: (color: string) => void
  onFetchIcon: () => void
  onSave: () => void
  onSaveAndContinue: () => void
}

const AddAppModalCustom: React.FC<AddAppModalCustomProps> = ({
  form,
  iconColor,
  onIconColorChange,
  onFetchIcon,
  onSave,
  onSaveAndContinue
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const iconText = (form.getFieldValue('icon') as string)?.[0] || 'A'

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

  const isImageIcon = /^(https?:\/\/|data:image\/)/.test(String(form.getFieldValue('icon') || ''))

  return (
    <Form form={form} layout='vertical' autoComplete='off' className={styles.container}>
      <Form.Item
        label='地址'
        name='url'
        rules={[
          { required: true, message: '请输入链接地址' },
          { type: 'url' as const, message: '请输入有效的 URL' }
        ]}
      >
        <Input
          placeholder='https://'
          addonAfter={
            <Button type='link' onClick={onFetchIcon}>
              获取图标
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
          name='icon'
          rules={[{ required: true, message: '请输入图标文字' }]}
          style={{ flex: 1, marginBottom: 0 }}
        >
          <Input placeholder='例如: A' maxLength={2} />
        </Form.Item>
      </div>

      <div className={styles.previewRow}>
        <div>
          <div className={styles.iconCard} style={{ backgroundColor: iconColor }}>
            {isImageIcon ? (
              <img src={form.getFieldValue('icon')} alt='' style={{ width: 36, height: 36 }} />
            ) : (
              iconText
            )}
          </div>
          <div className={styles.typeLabel}>文字图标</div>
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
        <Button type='primary' onClick={onSave}>
          保存
        </Button>
        <Button onClick={onSaveAndContinue}>保存并继续</Button>
      </div>
    </Form>
  )
}

export default AddAppModalCustom

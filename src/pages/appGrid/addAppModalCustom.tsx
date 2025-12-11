import React from 'react'
import type { FormInstance } from 'antd'
import { Form, Input, Button } from 'antd'
import cn from 'classnames'
import styles from './addAppModalCustom.module.less'

interface AddAppModalCustomProps {
  form: FormInstance
  iconColor: string
  onIconColorChange: (color: string) => void
  onSave: () => void
  onSaveAndContinue: () => void
}

const AddAppModalCustom: React.FC<AddAppModalCustomProps> = ({
  form,
  iconColor,
  onIconColorChange,
  onSave,
  onSaveAndContinue
}) => {
  const iconText = (form.getFieldValue('icon') as string)?.[0] || 'A'

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
        <Input placeholder='https://' addonAfter={<Button type='link'>获取图标</Button>} />
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
            {iconText}
          </div>
          <div className={styles.typeLabel}>文字图标</div>
        </div>
        <div>
          <div className={styles.uploadCard}>+</div>
          <div className={styles.typeLabel}>上传</div>
        </div>
      </div>

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

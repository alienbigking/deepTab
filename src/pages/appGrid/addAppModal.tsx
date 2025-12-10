import React, { useEffect } from 'react'
import { Modal, Form, Input, message } from 'antd'
import cn from 'classnames'
import type { App, AddAppParams } from './types/appGrid'
import appGridService from './services/appGrid'
import styles from './appGrid.module.less'

interface AddAppModalProps {
  open: boolean
  editingApp?: App | null
  onClose: () => void
  onSuccess: () => void
}

const AddAppModal: React.FC<AddAppModalProps> = (props) => {
  const { open = false, editingApp = null, onClose, onSuccess } = props
  const [form] = Form.useForm()

  // 编辑时填充表单
  useEffect(() => {
    if (open && editingApp) {
      form.setFieldsValue({
        name: editingApp.name,
        icon: editingApp.icon,
        url: editingApp.url
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, editingApp, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingApp) {
        // 更新应用
        await appGridService.update(editingApp.id, values)
        message.success('更新成功')
      } else {
        // 添加应用
        await appGridService.add(values as AddAppParams)
        message.success('添加成功')
      }

      form.resetFields()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={editingApp ? '编辑应用' : '添加应用'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText='确定'
      cancelText='取消'
      destroyOnClose
    >
      <Form form={form} layout='vertical' autoComplete='off' className={cn(styles.addAppForm)}>
        <Form.Item
          label='应用名称'
          name='name'
          rules={[{ required: true, message: '请输入应用名称' }]}
        >
          <Input placeholder='例如: Google' />
        </Form.Item>

        <Form.Item
          label='图标'
          name='icon'
          rules={[{ required: true, message: '请输入图标' }]}
          extra='可以使用 Emoji 或图片 URL'
        >
          <Input placeholder='例如: 🔍 或 https://...' />
        </Form.Item>

        <Form.Item
          label='链接地址'
          name='url'
          rules={[
            { required: true, message: '请输入链接地址' },
            { type: 'url', message: '请输入有效的 URL' }
          ]}
        >
          <Input placeholder='例如: https://www.google.com' />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddAppModal

import React, { useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Form, Input, Select, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import styles from './feedback.module.less'
import feedbackService from './services/feedback'

const Feedback: React.FC = () => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const values = await form.validateFields()
      const attachments = files.map((file) => String(file.url || file.response || '')).filter(Boolean)
      await feedbackService.submitFeedback({ ...values, attachments })
      form.resetFields()
      setFiles([])
      message.success('反馈已提交，感谢你的建议')
    } catch (error: any) {
      console.error('提交反馈失败:', error)
      message.error(error?.message || '提交失败，请检查表单内容')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn(styles.container)}>
      <Card title='投诉与反馈' className='dtSettingsCard' variant='borderless'>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <Form.Item label='反馈类型' name='type' rules={[{ required: true, message: '请选择反馈类型' }]}>
            <Select placeholder='请选择反馈类型'>
              <Select.Option value='bug'>Bug 反馈</Select.Option>
              <Select.Option value='feature'>功能建议</Select.Option>
              <Select.Option value='complaint'>投诉</Select.Option>
              <Select.Option value='other'>其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label='标题' name='title' rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder='请输入标题' />
          </Form.Item>
          <Form.Item
            label='详细描述'
            name='content'
            rules={[{ required: true, message: '请填写详细描述' }]}
          >
            <Input.TextArea rows={6} placeholder='请详细描述你的问题或建议' />
          </Form.Item>
          <Form.Item label='联系邮箱' name='email' rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder='选填，方便我们联系你' />
          </Form.Item>
          <Form.Item label='附件'>
            <Upload
              accept='image/*'
              fileList={files}
              listType='picture'
              beforeUpload={async (file) => {
                try {
                  const url = await feedbackService.uploadAttachment(file)
                  setFiles((prev) => [
                    ...prev,
                    {
                      uid: file.uid,
                      name: file.name,
                      status: 'done',
                      url
                    }
                  ])
                } catch (error: any) {
                  message.error(error?.message || '附件上传失败')
                }
                return false
              }}
              onRemove={(file) => {
                setFiles((prev) => prev.filter((item) => item.uid !== file.uid))
              }}
            >
              <Button icon={<UploadOutlined />}>上传截图</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={submitting}>
              提交反馈
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Feedback

import React, { useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Form, Input, Select, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import styles from './feedback.module.less'
import { useTranslation } from 'react-i18next'
import feedbackService from './services/feedback'

const Feedback: React.FC = () => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { t } = useTranslation()
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
      message.success(t('feedback.submitted', { defaultValue: 'Feedback submitted. Thank you.' }))
    } catch (error: any) {
      console.error('提交反馈失败:', error)
      message.error(error?.message || t('feedback.submitFailed', { defaultValue: 'Could not submit feedback. Check the form.' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn(styles.container)}>
      <Card title={t('feedback.title', { defaultValue: 'Feedback' })} className='dtSettingsCard' variant='borderless'>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <Form.Item label={t('feedback.type', { defaultValue: 'Type' })} name='type' rules={[{ required: true, message: t('feedback.typeRequired', { defaultValue: 'Choose a feedback type' }) }]}>
            <Select placeholder={t('feedback.typeRequired', { defaultValue: 'Choose a feedback type' })}>
              <Select.Option value='bug'>{t('feedback.bug', { defaultValue: 'Bug report' })}</Select.Option>
              <Select.Option value='feature'>{t('feedback.feature', { defaultValue: 'Feature request' })}</Select.Option>
              <Select.Option value='complaint'>{t('feedback.complaint', { defaultValue: 'Complaint' })}</Select.Option>
              <Select.Option value='other'>{t('general.other')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('feedback.subject', { defaultValue: 'Subject' })} name='title' rules={[{ required: true, message: t('feedback.subjectRequired', { defaultValue: 'Enter a subject' }) }]}>
            <Input placeholder={t('feedback.subjectRequired', { defaultValue: 'Enter a subject' })} />
          </Form.Item>
          <Form.Item
            label={t('feedback.description', { defaultValue: 'Description' })}
            name='content'
            rules={[{ required: true, message: t('feedback.descriptionRequired', { defaultValue: 'Describe your feedback' }) }]}
          >
            <Input.TextArea rows={6} placeholder={t('feedback.descriptionPlaceholder', { defaultValue: 'Describe your issue or suggestion in detail' })} />
          </Form.Item>
          <Form.Item label={t('feedback.contactEmail', { defaultValue: 'Contact email' })} name='email' rules={[{ type: 'email', message: t('feedback.invalidEmail', { defaultValue: 'Enter a valid email address' }) }]}>
            <Input placeholder={t('feedback.emailOptional', { defaultValue: 'Optional, so we can contact you' })} />
          </Form.Item>
          <Form.Item label={t('feedback.attachments', { defaultValue: 'Attachments' })}>
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
                  message.error(error?.message || t('feedback.uploadFailed', { defaultValue: 'Could not upload the attachment' }))
                }
                return false
              }}
              onRemove={(file) => {
                setFiles((prev) => prev.filter((item) => item.uid !== file.uid))
              }}
            >
              <Button icon={<UploadOutlined />}>{t('feedback.uploadScreenshot', { defaultValue: 'Upload screenshot' })}</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={submitting}>
              {t('feedback.submit', { defaultValue: 'Submit feedback' })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Feedback

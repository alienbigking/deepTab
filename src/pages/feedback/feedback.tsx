import React from 'react'
import cn from 'classnames'
import { Form, Input, Select, Button, Card } from 'antd'
import styles from './feedback.module.less'

const Feedback: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Card title='投诉与反馈'>
        <Form layout='vertical'>
          <Form.Item label='反馈类型' name='type' required>
            <Select placeholder='请选择反馈类型'>
              <Select.Option value='bug'>Bug 反馈</Select.Option>
              <Select.Option value='feature'>功能建议</Select.Option>
              <Select.Option value='complaint'>投诉</Select.Option>
              <Select.Option value='other'>其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label='标题' name='title' required>
            <Input placeholder='请输入标题' />
          </Form.Item>
          <Form.Item label='详细描述' name='content' required>
            <Input.TextArea rows={6} placeholder='请详细描述您的问题或建议' />
          </Form.Item>
          <Form.Item label='联系邮箱' name='email'>
            <Input placeholder='选填，方便我们联系您' />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit'>
              提交反馈
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Feedback

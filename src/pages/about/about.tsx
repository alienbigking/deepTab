import React from 'react'
import cn from 'classnames'
import { Card, Descriptions, Alert } from 'antd'
import styles from './about.module.less'

const About: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Alert
        message='💡 首次使用提示'
        description='如果您在新标签页右下角看到"自定义Chrome"按钮,这是 Chrome 浏览器的功能。您可以点击该按钮,选择"在新标签页上隐藏页脚",按钮将永久隐藏。'
        type='info'
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />
      <Card title='关于 deepTab'>
        <Descriptions column={1}>
          <Descriptions.Item label='版本'>V2.2.22</Descriptions.Item>
          <Descriptions.Item label='作者'>deepTab Team</Descriptions.Item>
          <Descriptions.Item label='邮箱'>1260213657@qq.com</Descriptions.Item>
          <Descriptions.Item label='官网'>https://deeptab.com</Descriptions.Item>
          <Descriptions.Item label='描述'>一款漂亮的新标签页插件</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default About

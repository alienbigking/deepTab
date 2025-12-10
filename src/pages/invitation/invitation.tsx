import React from 'react'
import cn from 'classnames'
import { Card, Button, Input, Space } from 'antd'
import { GiftOutlined } from '@ant-design/icons'
import styles from './invitation.module.less'

const Invitation: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Card>
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <div className={cn(styles.header)}>
            <GiftOutlined style={{ fontSize: 48, color: '#ff6b35' }} />
            <h2>邀请好友，获得奖励</h2>
          </div>
          <div className={cn(styles.inviteCode)}>
            <span>我的邀请码：</span>
            <Input value='DEEPXXX' readOnly style={{ width: 200 }} />
            <Button type='primary'>复制</Button>
          </div>
          <div className={cn(styles.stats)}>
            <div>已邀请：0 人</div>
            <div>成功注册：0 人</div>
            <div>累计奖励：0 元</div>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Invitation

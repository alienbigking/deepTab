import React from 'react'
import cn from 'classnames'
import { Card, Button, Input, Space } from 'antd'
import { GiftOutlined } from '@ant-design/icons'
import styles from './invitation.module.less'

const Invitation: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <Card className='dtSettingsCard' bordered={false}>
        <Space direction='vertical' size='large' className={cn(styles.cardContent)}>
          <div className={cn(styles.header)}>
            <GiftOutlined className={styles.headerIcon} />
            <h2>邀请好友，获得奖励</h2>
          </div>
          <div className={cn(styles.inviteCode)}>
            <span>我的邀请码：</span>
            <Input value='DEEPXXX' readOnly className={styles.inviteInput} />
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

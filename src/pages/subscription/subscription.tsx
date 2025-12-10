import React from 'react'
import cn from 'classnames'
import { Card, Button, Badge } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import styles from './subscription.module.less'

/**
 * 订阅管理组件
 */
const Subscription: React.FC = () => {
  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.currentPlan)}>
        <Badge.Ribbon text='FREE' color='gray'>
          <Card>
            <div className={cn(styles.planInfo)}>
              <CrownOutlined style={{ fontSize: 32, color: '#999' }} />
              <h3>免费版</h3>
              <p>基础功能，永久免费</p>
            </div>
          </Card>
        </Badge.Ribbon>
      </div>

      <div className={cn(styles.upgradeTip)}>
        <Button type='primary' size='large'>
          升级到专业版
        </Button>
      </div>
    </div>
  )
}

export default Subscription

import React, { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Input, List, Space, Tag } from 'antd'
import { CopyOutlined, GiftOutlined, MailOutlined } from '@ant-design/icons'
import styles from './invitation.module.less'
import invitationService from './services/invitation'
import type { IInvitationRecord, IInvitationStats } from './types/invitation'

const Invitation: React.FC = () => {
  const { message } = App.useApp()
  const [stats, setStats] = useState<IInvitationStats>({
    totalInvites: 0,
    successfulInvites: 0,
    totalRewards: 0,
    inviteCode: 'DEEPTAB'
  })
  const [records, setRecords] = useState<IInvitationRecord[]>([])
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const inviteLink = useMemo(() => `https://deeptab.com/invite?code=${stats.inviteCode}`, [stats.inviteCode])

  useEffect(() => {
    const load = async () => {
      const [nextStats, nextRecords] = await Promise.all([
        invitationService.getInvitationStats(),
        invitationService.getInvitationRecords()
      ])
      setStats(nextStats)
      setRecords(nextRecords)
    }
    void load()
  }, [])

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  }

  const sendInvitation = async () => {
    const value = email.trim()
    if (!value) {
      message.warning('请输入邮箱')
      return
    }

    setSending(true)
    try {
      const data = await invitationService.sendInvitation(value)
      setRecords((prev) => [data.record, ...prev])
      setStats(data.stats)
      setEmail('')
      message.success('邀请邮件已发送')
    } catch (error: any) {
      console.error('发送邀请邮件失败:', error)
      message.error(error?.message || '发送邀请失败，请稍后再试')
    } finally {
      setSending(false)
    }
  }

  const getStatusMeta = (status: IInvitationRecord['inviteeStatus']) => {
    if (status === 'registered') {
      return { text: '已注册', className: styles.statusRegistered }
    }
    if (status === 'subscribed') {
      return { text: '已订阅', className: styles.statusSubscribed }
    }
    return { text: '待接受', className: styles.statusPending }
  }

  return (
    <div className={cn(styles.container)}>
      <Card className='dtSettingsCard' variant='borderless'>
        <Space direction='vertical' size='large' className={cn(styles.cardContent)}>
          <div className={cn(styles.header)}>
            <GiftOutlined className={styles.headerIcon} />
            <h2>邀请好友，获得奖励</h2>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>邀请码</span>
            <Input value={stats.inviteCode} readOnly className={styles.inviteInput} />
            <Button type='primary' icon={<CopyOutlined />} onClick={() => void copy(stats.inviteCode)}>
              复制
            </Button>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>邀请链接</span>
            <Input value={inviteLink} readOnly className={styles.inviteInput} />
            <Button type='primary' icon={<CopyOutlined />} onClick={() => void copy(inviteLink)}>
              复制
            </Button>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>发送邀请</span>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='friend@example.com'
              className={styles.inviteInput}
              disabled={sending}
            />
            <Button
              type='primary'
              icon={<MailOutlined />}
              loading={sending}
              onClick={() => void sendInvitation()}
            >
              发送
            </Button>
          </div>

          <div className={cn(styles.stats)}>
            <div>已邀请：{stats.totalInvites} 人</div>
            <div>成功注册：{stats.successfulInvites} 人</div>
            <div>累计奖励：{stats.totalRewards} 元</div>
          </div>

          <List
            size='small'
            dataSource={records}
            locale={{ emptyText: '暂无邀请记录' }}
            renderItem={(item) => (
              <List.Item className={styles.recordItem}>
                <List.Item.Meta
                  title={item.inviteeEmail}
                  description={new Date(item.inviteDate).toLocaleString()}
                />
                <Tag className={cn(styles.statusTag, getStatusMeta(item.inviteeStatus).className)} bordered={false}>
                  {getStatusMeta(item.inviteeStatus).text}
                </Tag>
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </div>
  )
}

export default Invitation

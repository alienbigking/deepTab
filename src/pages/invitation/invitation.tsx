import React, { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { App, Button, Card, Input, List, Space, Tag } from 'antd'
import { CopyOutlined, GiftOutlined, MailOutlined } from '@ant-design/icons'
import styles from './invitation.module.less'
import invitationService from './services/invitation'
import type { IInvitationRecord, IInvitationStats } from './types/invitation'
import { useTranslation } from 'react-i18next'

const Invitation: React.FC = () => {
  const { message } = App.useApp()
  const { t, i18n } = useTranslation()
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
    message.success(t('invitation.copied', { defaultValue: 'Copied' }))
  }

  const sendInvitation = async () => {
    const value = email.trim()
    if (!value) {
      message.warning(t('invitation.emailRequired', { defaultValue: 'Enter an email address' }))
      return
    }

    setSending(true)
    try {
      const data = await invitationService.sendInvitation(value)
      setRecords((prev) => [data.record, ...prev])
      setStats(data.stats)
      setEmail('')
      message.success(t('invitation.sent', { defaultValue: 'Invitation email sent' }))
    } catch (error: any) {
      console.error('发送邀请邮件失败:', error)
      message.error(t('invitation.failed', { defaultValue: 'Could not send the invitation' }))
    } finally {
      setSending(false)
    }
  }

  const getStatusMeta = (status: IInvitationRecord['inviteeStatus']) => {
    if (status === 'registered') {
      return { text: t('invitation.registered', { defaultValue: 'Registered' }), className: styles.statusRegistered }
    }
    if (status === 'subscribed') {
      return { text: t('invitation.subscribed', { defaultValue: 'Subscribed' }), className: styles.statusSubscribed }
    }
    return { text: t('invitation.pending', { defaultValue: 'Pending' }), className: styles.statusPending }
  }

  return (
    <div className={cn(styles.container)}>
      <Card className='dtSettingsCard' variant='borderless'>
        <Space direction='vertical' size='large' className={cn(styles.cardContent)}>
          <div className={cn(styles.header)}>
            <GiftOutlined className={styles.headerIcon} />
            <h2>{t('invitation.title', { defaultValue: 'Invite friends and earn rewards' })}</h2>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>{t('invitation.code', { defaultValue: 'Invitation code' })}</span>
            <Input value={stats.inviteCode} readOnly className={styles.inviteInput} />
            <Button type='primary' icon={<CopyOutlined />} onClick={() => void copy(stats.inviteCode)}>
              {t('invitation.copy', { defaultValue: 'Copy' })}
            </Button>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>{t('invitation.link', { defaultValue: 'Invitation link' })}</span>
            <Input value={inviteLink} readOnly className={styles.inviteInput} />
            <Button type='primary' icon={<CopyOutlined />} onClick={() => void copy(inviteLink)}>
              {t('invitation.copy', { defaultValue: 'Copy' })}
            </Button>
          </div>

          <div className={cn(styles.inviteCode)}>
            <span>{t('invitation.send', { defaultValue: 'Send invitation' })}</span>
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
              {t('invitation.sendButton', { defaultValue: 'Send' })}
            </Button>
          </div>

          <div className={cn(styles.stats)}>
            <div>{t('invitation.invited', { defaultValue: 'Invited' })}: {stats.totalInvites}</div>
            <div>{t('invitation.successful', { defaultValue: 'Registered' })}: {stats.successfulInvites}</div>
            <div>{t('invitation.rewards', { defaultValue: 'Rewards' })}: {stats.totalRewards}</div>
          </div>

          <List
            size='small'
            dataSource={records}
            locale={{ emptyText: t('invitation.empty', { defaultValue: 'No invitation records' }) }}
            renderItem={(item) => (
              <List.Item className={styles.recordItem}>
                <List.Item.Meta
                  title={item.inviteeEmail}
                  description={new Date(item.inviteDate).toLocaleString(i18n.resolvedLanguage)}
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

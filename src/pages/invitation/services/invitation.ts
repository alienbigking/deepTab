import { http } from '@/utils'
import { env } from '@/config/env'
import { IInvitationRecord, IInvitationStats } from '../types/invitation'

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

export default {
  async getInvitationStats(): Promise<IInvitationStats> {
    try {
      const response = await http<IInvitationStats>(buildUrl('/api/deepTab/invitations/stats'))
      return (
        response.data || {
          totalInvites: 0,
          successfulInvites: 0,
          totalRewards: 0,
          inviteCode: 'DEEPTAB'
        }
      )
    } catch (error) {
      console.error('获取邀请统计失败:', error)
      return {
        totalInvites: 0,
        successfulInvites: 0,
        totalRewards: 0,
        inviteCode: 'DEEPTAB'
      }
    }
  },

  async getInvitationRecords(): Promise<IInvitationRecord[]> {
    try {
      const response = await http(buildUrl('/api/deepTab/invitations/records'))
      return response.data || []
    } catch (error) {
      console.warn('获取邀请记录失败:', error)
      return []
    }
  },

  async sendInvitation(
    email: string
  ): Promise<{ record: IInvitationRecord; stats: IInvitationStats }> {
    const response = await http<{ record: IInvitationRecord; stats: IInvitationStats }>(
      buildUrl('/api/deepTab/invitations/send'),
      {
        method: 'POST',
        data: { email }
      }
    )
    if (!response.data?.record || !response.data?.stats) {
      throw new Error(response.message || '邀请邮件发送失败')
    }
    return response.data
  }
}

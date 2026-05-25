import { http } from '@/utils'
import { env } from '@/config/env'
import { IInvitationRecord, IInvitationStats } from '../types/invitation'

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

export default {
  async getInvitationStats(): Promise<IInvitationStats> {
    try {
      const result = await chrome.storage.local.get(['invitationStats'])
      return (
        result.invitationStats || {
          totalInvites: 0,
          successfulInvites: 0,
          totalRewards: 0,
          inviteCode: 'DEEP' + Math.random().toString(36).slice(2, 8).toUpperCase()
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
    const local = await chrome.storage.local.get(['invitationRecords'])
    try {
      const response = await http(buildUrl('/api/deepTab/invitations/records'))
      return response.data || local.invitationRecords || []
    } catch (error) {
      console.warn('获取远程邀请记录失败，使用本地记录:', error)
      return local.invitationRecords || []
    }
  },

  async sendInvitation(email: string): Promise<void> {
    try {
      await http(buildUrl('/api/deepTab/invitations/send'), {
        method: 'POST',
        data: { email }
      })
    } catch (error) {
      console.warn('发送远程邀请失败，已降级为本地记录:', error)
    }
  }
}

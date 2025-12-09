import { http } from '@/utils'
import { env } from '@/config/env'
import { IInvitationRecord, IInvitationStats } from '../types/invitation'

export default {
  async getInvitationStats(): Promise<IInvitationStats> {
    try {
      const result = await chrome.storage.local.get(['invitationStats'])
      return (
        result.invitationStats || {
          totalInvites: 0,
          successfulInvites: 0,
          totalRewards: 0,
          inviteCode: 'DEEP' + Math.random().toString(36).substr(2, 6).toUpperCase()
        }
      )
    } catch (error) {
      console.error('获取邀请统计失败:', error)
      return {
        totalInvites: 0,
        successfulInvites: 0,
        totalRewards: 0,
        inviteCode: 'DEEPXXX'
      }
    }
  },

  async getInvitationRecords(): Promise<IInvitationRecord[]> {
    try {
      const response = await http(`${env.HOST_API_URL}invitations/records`)
      return response.data
    } catch (error) {
      console.error('获取邀请记录失败:', error)
      return []
    }
  },

  async sendInvitation(email: string): Promise<void> {
    try {
      await http(`${env.HOST_API_URL}invitations/send`, {
        method: 'POST',
        data: { email }
      })
    } catch (error) {
      console.error('发送邀请失败:', error)
      throw error
    }
  }
}

/**
 * invitation 模块类型定义
 */

interface IInvitationRecord {
  id: string
  inviteeEmail: string
  inviteeStatus: 'pending' | 'registered' | 'subscribed'
  inviteDate: string
  reward?: number
}

interface IInvitationStats {
  totalInvites: number
  successfulInvites: number
  totalRewards: number
  inviteCode: string
}

export { IInvitationRecord, IInvitationStats }

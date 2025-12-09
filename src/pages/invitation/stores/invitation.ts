import { atom } from 'recoil'
import { IInvitationStats } from '../types/invitation'

const invitationStatsStore = atom<IInvitationStats | null>({
  key: 'invitationStatsStore',
  default: null
})

export default { invitationStatsStore }

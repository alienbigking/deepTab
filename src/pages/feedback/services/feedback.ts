import { http } from '@/utils'
import { env } from '@/config/env'
import { IFeedback } from '../types/feedback'

export default {
  async submitFeedback(feedback: IFeedback): Promise<void> {
    try {
      await http(`${env.HOST_API_URL}feedback/submit`, {
        method: 'POST',
        data: feedback
      })
    } catch (error) {
      console.error('提交反馈失败:', error)
      throw error
    }
  }
}

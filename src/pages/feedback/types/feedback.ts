/**
 * feedback 模块类型定义
 */

type FeedbackType = 'bug' | 'feature' | 'complaint' | 'other'

interface IFeedback {
  id?: string
  type: FeedbackType
  title: string
  content: string
  email?: string
  attachments?: string[]
  timestamp?: string
}

export { FeedbackType, IFeedback }

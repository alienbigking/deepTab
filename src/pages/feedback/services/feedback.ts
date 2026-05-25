import { IFeedback } from '../types/feedback'
import { env } from '@/config/env'
import http from '@/utils/http'

const STORAGE_KEY = 'feedback_list'
const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

const getToken = async () => {
  const result = await chrome.storage.local.get(['token'])
  return result.token || ''
}

export default {
  async submitFeedback(feedback: IFeedback): Promise<void> {
    try {
      try {
        await http(buildUrl('/api/deepTab/feedback'), {
          method: 'POST',
          data: feedback
        })
        return
      } catch (remoteError) {
        console.warn('提交远程反馈失败，已降级保存到本地:', remoteError)
      }

      const result = await chrome.storage.local.get([STORAGE_KEY])
      const list = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
      const next: IFeedback = {
        ...feedback,
        id: feedback.id || `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: feedback.timestamp || new Date().toISOString()
      }
      await chrome.storage.local.set({ [STORAGE_KEY]: [next, ...list] })
    } catch (error) {
      console.error('提交反馈失败:', error)
      throw error
    }
  },

  async getFeedbackList(): Promise<IFeedback[]> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEY])
      return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
    } catch (error) {
      console.error('获取反馈列表失败:', error)
      return []
    }
  },

  async uploadAttachment(file: File): Promise<string> {
    const token = await getToken()
    if (!token) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(buildUrl('/file?describe=feedback'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
    const data = await response.json()
    if (!response.ok || data.status !== 0) {
      throw new Error(data.message || '附件上传失败')
    }
    const url = data.data?.url || ''
    return /^(https?:)?\/\//.test(url) ? url : `${env.HOST_API_URL.replace(/\/$/, '')}${url}`
  }
}

import { env } from '@/config/env'
import http from '@/utils/http'

interface RemotePetMessage {
  id: string
  content: string
  category: string
  durationSeconds?: number
}

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

export default {
  async getRandom(language: string, category?: string): Promise<RemotePetMessage | null> {
    try {
      const response = await http<{ message: RemotePetMessage | null }>(
        buildUrl('/api/deepTab/pet/messages/random'),
        { params: { language, category }, timeout: 8000 }
      )
      return response.data?.message || null
    } catch {
      return null
    }
  }
}

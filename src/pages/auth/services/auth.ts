import { env } from '@/config/env'
import http from '@/utils/http'
import type { AuthSession, LoginParams, RegisterParams } from '../types/auth'

const TOKEN_KEY = 'token'
const SESSION_KEY = 'auth_session'

const buildUrl = (path: string) => `${env.HOST_API_URL.replace(/\/$/, '')}${path}`

const normalizeIdentifier = (value: string) => value.trim()

const getRegisterIdentifier = (identifier: string) => {
  if (/^1[3-9]\d{9}$/.test(identifier)) {
    return { phone: identifier }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    return { email: identifier }
  }
  return { username: identifier }
}

const toAbsoluteUrl = (url: string) => {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:image/')) return url
  return `${env.HOST_API_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

const getToken = async () => {
  const result = await chrome.storage.local.get([TOKEN_KEY])
  return result[TOKEN_KEY] || ''
}

export default {
  async getSession(): Promise<AuthSession | null> {
    const result = await chrome.storage.local.get([SESSION_KEY, TOKEN_KEY])
    const session = result[SESSION_KEY] as AuthSession | undefined
    if (!session?.accessToken || session.accessToken !== result[TOKEN_KEY]) {
      return null
    }
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      await this.clearSession()
      return null
    }
    return session
  },

  async saveSession(session: AuthSession): Promise<void> {
    await chrome.storage.local.set({
      [TOKEN_KEY]: session.accessToken,
      [SESSION_KEY]: session
    })
  },

  async clearSession(): Promise<void> {
    await chrome.storage.local.remove([TOKEN_KEY, SESSION_KEY])
  },

  async login(params: LoginParams): Promise<AuthSession> {
    const response = await http<{
      accessToken: string
      tokenType: string
      expiresIn: number
      user: AuthSession['user']
    }>(buildUrl('/oauth/token'), {
      method: 'POST',
      data: {
        clientId: env.OAUTH_CLIENT_ID,
        clientSecret: env.OAUTH_CLIENT_SECRET,
        userIdentifier: normalizeIdentifier(params.userIdentifier),
        credential: params.password,
        identityType: 'password'
      }
    })

    const data = response.data
    if (!data?.accessToken) {
      throw new Error(response.message || '登录失败')
    }

    const session: AuthSession = {
      accessToken: data.accessToken,
      tokenType: data.tokenType || 'Bearer',
      expiresIn: data.expiresIn || 86400,
      expiresAt: Date.now() + (data.expiresIn || 86400) * 1000,
      user: {
        ...(data.user || {}),
        avatar: toAbsoluteUrl(data.user?.avatar || '')
      }
    }
    await this.saveSession(session)
    return session
  },

  async register(params: RegisterParams): Promise<void> {
    const identifier = normalizeIdentifier(params.username || params.email || params.phone || '')
    if (!identifier) {
      throw new Error('请输入用户名、邮箱或手机号')
    }

    await http(buildUrl('/register'), {
      method: 'POST',
      data: {
        ...getRegisterIdentifier(identifier),
        password: params.password,
        nickname: params.nickname || identifier
      }
    })
  },

  async uploadAvatar(file: File): Promise<AuthSession> {
    const current = await this.getSession()
    if (!current) {
      throw new Error('请先登录')
    }

    const token = await getToken()
    const formData = new FormData()
    formData.append('file', file)

    const uploadResponse = await fetch(buildUrl('/file?describe=avatar'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
    const uploadData = await uploadResponse.json()
    if (!uploadResponse.ok || uploadData.status !== 0) {
      throw new Error(uploadData.message || '头像上传失败')
    }

    const avatar = toAbsoluteUrl(uploadData.data?.url || '')
    if (!avatar) {
      throw new Error('头像上传失败')
    }

    const profileResponse = await http<AuthSession['user']>(buildUrl('/me'), {
      method: 'PUT',
      data: {
        avatar,
        nickname: current.user.nickname || current.user.username || current.user.userIdentifier || ''
      }
    })

    const user = {
      ...current.user,
      ...(profileResponse.data || {}),
      avatar
    }
    const nextSession = {
      ...current,
      user
    }
    await this.saveSession(nextSession)
    return nextSession
  }
}

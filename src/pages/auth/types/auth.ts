export interface AuthUser {
  id?: string
  userId?: string
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  mobile?: string
  userIdentifier?: string
  identityType?: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt: number
  user: AuthUser
}

export interface LoginParams {
  userIdentifier: string
  password: string
}

export interface RegisterParams {
  username?: string
  email?: string
  phone?: string
  password: string
  nickname?: string
}

export interface AuthStore {
  session: AuthSession | null
  isLoading: boolean
  init: () => Promise<void>
  login: (params: LoginParams) => Promise<AuthSession>
  register: (params: RegisterParams) => Promise<void>
  uploadAvatar: (file: File) => Promise<AuthSession>
  logout: () => Promise<void>
  setSession: (session: AuthSession | null) => void
}

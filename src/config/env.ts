type EnvName = 'develop' | 'stage' | 'production'
type LogLevelType = 'debug' | 'info' | 'warn' | 'error' | 'silent'

interface IEnv {
  APP_ENV: EnvName
  HOST_API_URL: string
  OAUTH_CLIENT_ID: string
  OAUTH_CLIENT_SECRET: string
  LOG_LEVEL: LogLevelType
  ENABLE_MOCK: boolean
  NODE_ENV: string
  isDevelopment: boolean
  isProduction: boolean
}

const configMap: Record<EnvName, Omit<IEnv, 'APP_ENV' | 'NODE_ENV' | 'isDevelopment' | 'isProduction'>> = {
  develop: {
    HOST_API_URL: 'http://localhost:3000',
    OAUTH_CLIENT_ID: 'webapp_prod_9bc1',
    OAUTH_CLIENT_SECRET: '27f9b0c8dc2d968117c270a64c22e318',
    LOG_LEVEL: 'debug',
    ENABLE_MOCK: true
  },
  stage: {
    HOST_API_URL: 'http://101.33.234.107:3000',
    OAUTH_CLIENT_ID: 'webapp_prod_9bc1',
    OAUTH_CLIENT_SECRET: '27f9b0c8dc2d968117c270a64c22e318',
    LOG_LEVEL: 'info',
    ENABLE_MOCK: false
  },
  production: {
    HOST_API_URL: 'http://101.33.234.107:3000',
    OAUTH_CLIENT_ID: 'webapp_prod_9bc1',
    OAUTH_CLIENT_SECRET: '27f9b0c8dc2d968117c270a64c22e318',
    LOG_LEVEL: 'warn',
    ENABLE_MOCK: false
  }
}

const isEnvName = (value: unknown): value is EnvName => {
  return value === 'develop' || value === 'stage' || value === 'production'
}

const isLogLevel = (value: unknown): value is LogLevelType => {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error' || value === 'silent'
}

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(text)) return true
  if (['false', '0', 'no', 'n'].includes(text)) return false
  return undefined
}

const normalizeBaseUrl = (value: string) => value.replace(/\/?$/, '/')

const buildEnv = (): IEnv => {
  const appEnv = isEnvName(process.env.APP_ENV) ? process.env.APP_ENV : 'develop'
  const fallback = configMap[appEnv]
  const nodeEnv = process.env.NODE_ENV || (appEnv === 'production' ? 'production' : 'development')
  const enableMock = parseBoolean(process.env.ENABLE_MOCK)

  return {
    APP_ENV: appEnv,
    HOST_API_URL: normalizeBaseUrl(process.env.HOST_API_URL || fallback.HOST_API_URL),
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID || fallback.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET || fallback.OAUTH_CLIENT_SECRET,
    LOG_LEVEL: isLogLevel(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : fallback.LOG_LEVEL,
    ENABLE_MOCK: enableMock === undefined ? fallback.ENABLE_MOCK : enableMock,
    NODE_ENV: nodeEnv,
    isDevelopment: appEnv === 'develop',
    isProduction: appEnv === 'production'
  }
}

const env: IEnv = buildEnv()

export { env }

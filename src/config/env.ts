/**
 * 环境配置 - Chrome 扩展版本
 * 简化配置，支持开发和生产环境
 */

interface IEnv {
  HOST_API_URL: string
  NODE_ENV: string
  isDevelopment: boolean
  isProduction: boolean
}

const buildEnv = (): IEnv => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  // 根据环境返回不同的 API 地址
  const HOST_API_URL = isDevelopment
    ? 'http://localhost:3000/api/'  // 开发环境
    : 'https://api.example.com/'     // 生产环境

  return {
    HOST_API_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
    isDevelopment,
    isProduction
  }
}

const env: IEnv = buildEnv()

export { env }

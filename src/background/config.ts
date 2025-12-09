/**
 * 扩展配置
 */

// 后端 API 基础地址
// export const API_BASE_URL = 'http://localhost:3000'
export const API_BASE_URL = 'http://101.33.234.107:3000'

// 邮件 API 端点
export const EMAIL_API = {
  TIMER_START: `${API_BASE_URL}/email/timer-start`,
  MAX_RUNS_REACHED: `${API_BASE_URL}/email/max-runs-reached`,
  MANUAL_REFRESH: `${API_BASE_URL}c`,
  SEND: `${API_BASE_URL}/email/send`
}

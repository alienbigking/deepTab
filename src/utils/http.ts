/**
 * HTTP 请求工具 - 适配 Chrome 扩展环境
 * 使用原生 fetch API
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
}

interface ResponseData<T = any> {
  code?: number | string
  status?: number
  data?: T
  msg?: string
  message?: string
}

export interface HttpError {
  code: number | string
  message: string
  data: unknown
  isHttpError: true
}

export const isHttpError = (error: unknown): error is HttpError => {
  return Boolean(error && typeof error === 'object' && (error as HttpError).isHttpError)
}

const createHttpError = (
  code: number | string,
  message: string,
  data: unknown = null
): HttpError => ({ code, message, data, isHttpError: true })

/**
 * 构建 URL 查询参数
 */
const buildQueryString = (params: Record<string, any>): string => {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  return query ? `?${query}` : ''
}

/**
 * 获取 token（从 chrome.storage.local）
 */
const getToken = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(['token'])
    return result.token || ''
  } catch (error) {
    console.error('获取 token 失败:', error)
    return ''
  }
}

/**
 * HTTP 请求封装
 */
const http = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<ResponseData<T>> => {
  const {
    method = 'GET',
    headers = {},
    params,
    data,
    timeout = 20000
  } = options

  // 构建完整 URL
  let fullUrl = url
  if (params && Object.keys(params).length > 0) {
    fullUrl += buildQueryString(params)
  }

  // 获取 token
  const token = await getToken()

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  // 构建请求配置
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders
  }

  // 添加请求体
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = JSON.stringify(data)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // 发起请求
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal
    })

    const responseText = await response.text()
    let responseData: ResponseData<T> = {}
    if (responseText) {
      try {
        responseData = JSON.parse(responseText) as ResponseData<T>
      } catch {
        throw createHttpError(response.status || -1, '服务端返回了无法解析的数据', responseText)
      }
    }

    // 处理 HTTP 错误状态
    if (!response.ok) {
      console.error('HTTP 错误:', response.status, responseData)
      
      // 可以在这里处理特定的错误状态
      switch (response.status) {
        case 401:
          console.warn('未授权，需要登录')
          break
        case 403:
          console.warn('无权限访问')
          break
        case 404:
          console.warn('资源不存在')
          break
        case 500:
        case 502:
        case 503:
          console.warn('服务器错误')
          break
      }

      throw createHttpError(
        response.status,
        responseData.message || responseData.msg || '请求失败',
        responseData
      )
    }

    if (responseData && typeof responseData.status === 'number' && responseData.status !== 0) {
      throw createHttpError(
        responseData.status,
        responseData.message || responseData.msg || '请求失败',
        responseData.data
      )
    }

    return responseData
  } catch (error: any) {
    console.error('请求异常:', error)

    if (isHttpError(error)) {
      throw error
    }

    if (error.name === 'AbortError') {
      throw createHttpError(-1, '请求超时')
    }

    throw createHttpError(-1, error.message || '网络错误')
  } finally {
    clearTimeout(timeoutId)
  }
}

export default http

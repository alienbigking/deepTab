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
  code?: number
  data?: T
  msg?: string
  message?: string
}

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
    timeout = 180000
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
    requestHeaders['token'] = token
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

  try {
    // 创建超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 发起请求
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // 解析响应
    const responseData = await response.json()

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

      return Promise.reject({
        code: response.status,
        message: responseData.message || responseData.msg || '请求失败',
        data: responseData
      })
    }

    return responseData
  } catch (error: any) {
    console.error('请求异常:', error)

    if (error.name === 'AbortError') {
      return Promise.reject({
        code: -1,
        message: '请求超时',
        data: null
      })
    }

    return Promise.reject({
      code: -1,
      message: error.message || '网络错误',
      data: null
    })
  }
}

export default http

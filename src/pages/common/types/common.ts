/**
 * 公共类型定义
 */

// 分页参数接口
interface IPagination {
  page?: number
  pageSize?: number
  current?: number
  total?: number
}

// 通用响应接口
interface IResponse<T = any> {
  code: number
  data: T
  msg?: string
  message?: string
}

// 列表响应接口
interface IListResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export { IPagination, IResponse, IListResponse }

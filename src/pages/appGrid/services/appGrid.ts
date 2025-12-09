import { http } from '@/utils'
import { env } from '@/config/env'
import {
  IAddParams,
  IAllListParams,
  IListParams,
  IUpdateParams
} from '../types/appGrid'

export default {
  getList(params?: IListParams) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles`, {
      params: params
    }).then((response) => {
      return response
    })
  },
  getAllList(params?: IAllListParams) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles/list`, {
      params: params
    }).then((response) => {
      return response
    })
  },
  getDetail(id: number) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles/${id}`).then((response) => {
      return response
    })
  },
  add(params: IAddParams) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles`, {
      method: 'POST',
      data: params
    }).then((response) => {
      return response
    })
  },
  update(id: number, params: IUpdateParams) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles/${id}`, {
      method: 'PUT',
      data: params
    }).then((response) => {
      return response
    })
  },
  delete(id: number) {
    return http(`${env.HOST_API_URL}yxpt/sys/roles/${id}`, {
      method: 'DELETE'
    }).then((response) => {
      return response
    })
  }
}

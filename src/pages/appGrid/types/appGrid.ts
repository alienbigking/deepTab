import { IPagination } from '@/pages/common/types/common'

interface IAddParams {}

interface IUpdateParams {
  id: number
  name: string
  remark: string
}

interface IListParams extends IPagination {
  name?: string
}

interface IAllListParams {}

export { IAddParams, IListParams, IUpdateParams, IAllListParams }

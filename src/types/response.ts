// 分页响应结构
export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}
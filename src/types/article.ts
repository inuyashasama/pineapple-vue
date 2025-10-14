export interface Article {
  id?: number
  userId?: number
  title: string
  content: string
  createTime?: string
  updateTime?: string
  views?: number
  filetype?: string
}
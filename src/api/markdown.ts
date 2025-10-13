import type { Page } from '../types/response'
import request from './request'
import type { Article } from '../types/article'

export interface Markdown {
  id?: number
  name?: string
  content: string
  password?: string
  encrypted?: boolean
  fileType?: string
}

/** 获取文章 */
export const getMarkdown = (name: string) => {
  return request.get(`/api/markdown/load/${name}`)
}

/** 保存/更新文章 */
export const saveMarkdown = (markdown: Markdown) => {
  return request.post(`/api/markdown/save`, markdown)
}

export const getArticles = (page = 1, size = 10) => {
  return request.get<Page<Article>>('/api/markdown/list', {
    params: { page, size }
  })
}

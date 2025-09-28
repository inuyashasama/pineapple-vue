import request from './request'

export interface Markdown {
  id?: number
  name?: string
  content: string
  password?: string
  encrypted?: boolean
}

/** 获取文章 */
export const getMarkdown = (name: string) => {
  return request.get(`/api/markdown/load/${name}`)
}

/** 保存/更新文章 */
export const saveMarkdown = (markdown: Markdown) => {
  return request.post(`/api/markdown/save`, markdown)
}

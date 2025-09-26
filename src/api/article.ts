import request from './request'
import { Article } from '@/types'
import { Page } from '@/types/response'

// 获取文章列表
export const getArticles = (page = 1, size = 10) => {
  return request.get<Page<Article>>('/api/articles/list', {
    params: { page, size }
  })
}

// 获取单篇文章
export const getArticle = (id: number) => {
  return request.get<Article>(`/api/articles/${id}`)
}

// 创建文章
export const createArticle = (article: Article) => {
  return request.post('/api/articles', article)
}

// 更新文章
export const updateArticle = (id: number, article: Article) => {
  return request.put(`/api/articles/${id}`, article)
}

// 删除文章
export const deleteArticle = (id: number) => {
  return request.delete(`/api/articles/${id}`)
}
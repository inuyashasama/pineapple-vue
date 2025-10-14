import request from './request'
import { Article } from '@/types/article'
import { Page } from '@/types/response'

// 获取文章列表
export const getArticles = (page = 1, size = 10) => {
  return request.get<Page<Article>>('/api/article/page', {
    params: { page, size }
  })
}

// 获取单篇文章
export const getArticle = (id: number) => {
  return request.get<Article>(`/api/article/getById/${id}`)
}

// 创建文章
export const createArticle = (article: Article) => {
  return request.post('/api/article/createArticle', article)
}

// 更新文章
export const updateArticle = (article: Article) => {
  return request.post('/api/article/update', article)
}

// 删除文章
export const deleteArticle = (id: number) => {
  return request.post(`/api/article/deleteById/${id}`)
}

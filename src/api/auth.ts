import request from './request'
import { User } from '@/types'

export const login = (username: string, password: string) => {
  return request.post('/api/user/login', { username, password })
}

export const register = (user: User) => {
  return request.post('/api/user/register', user)
}
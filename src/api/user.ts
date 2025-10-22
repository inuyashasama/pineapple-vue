import request from './request'
import { User } from '@/types'

export const getProfile = () => {
  return request.get<User>('/api/user/profile')
}

export const modifyPassword = (data: { userId: number; oldPassword: string; newPassword: string }) => {
  return request.post('/api/user/modifyPassword', data)
}
import request from './request'
import { User } from '@/types'

export const getProfile = () => {
  return request.get<User>('/api/user/profile')
}
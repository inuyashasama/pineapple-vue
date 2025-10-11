import request from './request'

// 获取用户积分（扩展：包含签到记录）
export const getPoints = (userId: number) => {
  return request.get(`/api/user-point/${userId}`)
}

// 签到接口
export const signIn = (data: {
  userId: String | number
  points: number
  reason: string
  orderId: string
}) => {
  return request.post('/api/user-point/earn', data)
}

export type TreasureItem = {
  id: string
  name: string
  userId: string
  purchaseDate: string // ISO date
  price: number
  usefulLifeYears: number
  notes?: string
  imageUrl?: string
  // 折旧相关
  depreciationMethod?:'straight' | 'accelerated' | 'usage' | 'none'
  residualPercent?: number // 直线折旧残值百分比（0-100）
  totalUsageHours?: number // 使用量折旧：预计总使用小时
  usedHours?: number // 已使用小时
  totalUsageLimit?: number;
  currentUsage?: number;
}


import request from '@/api/request'
import { BASE_URL } from '@/config/config'

export default {

  async fetchFromServer(): Promise<TreasureItem[]> {
    try {
      const data = await request.get('/api/treasure/getAllTreasureItems')
      if (Array.isArray(data)) return data as TreasureItem[]
      return []
    } catch (e) {
      console.warn('fetchFromServer failed, fallback to local', e)
      return []
    }
  },


  async save(item: TreasureItem) {
    try {
      // 后端接口期望 JSON
      await request.post('/api/treasure/saveTreasureItem', item)
      return
    } catch (e) {
      console.warn('save to server failed, fallback to local', e)
    }
  },

  async remove(id: string) {
    try {
      await request.delete(`/api/treasure/deleteTreasureItem/${id}`)
      return
    } catch (e) {
      console.warn('remove on server failed, fallback to local', e)
    }
  },


  // 上传图片：优先使用后端上传接口，失败则回退为 base64 字符串
  async uploadImage(file: File) {
    try {
      const form = new FormData()
      form.append('file', file)
      const res: any = await request.post('/api/upload/avatar', form)
      return BASE_URL + res
    } catch (e) {
      console.warn('uploadImage to server failed, fallback to base64', e)
    }
  }

}

export interface TreasureItem {
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
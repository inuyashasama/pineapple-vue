<!-- @/components/SignIn.vue -->
<template>
  <!-- 对话框容器 -->
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="400px"
    center
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <div class="sign-in-dialog">
      <!-- 签到状态 -->
      <div class="sign-status">
        <p class="streak">连续签到 <span class="days">{{ streakDays }}</span> 天</p>
        <p class="today-status" :class="{ signed: todaySigned }">
          {{ todaySigned ? '🎉 今日已签到' : `📅 今日可领 ${dailyPoints} 积分` }}
        </p>
      </div>

      <!-- 签到按钮 -->
      <el-button
        :type="todaySigned ? 'info' : 'primary'"
        :disabled="todaySigned"
        @click="handleSignIn"
        class="sign-btn"
        size="large"
        :loading="signing"
      >
        {{ todaySigned ? '已签到 ✅' : `立即签到领 ${dailyPoints} 积分` }}
      </el-button>

      <!-- 签到日历 -->
      <div class="calendar">
        <div class="calendar-header">
          <el-button link @click="prevMonth" class="nav-btn">❮</el-button>
          <span class="month-year">{{ currentMonthStr }}</span>
          <el-button link @click="nextMonth" class="nav-btn">❯</el-button>
        </div>

        <div class="weekdays">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>

        <div class="days-grid">
          <div
            v-for="day in daysInMonth"
            :key="day.date"
            :class="{
              'day': true,
              'current': day.isCurrentMonth,
              'today': day.isToday,
              'signed': day.isSigned,
              'disabled': !day.isCurrentMonth
            }"
          >
            {{ day.date.getDate() }}
          </div>
        </div>
      </div>

      <!-- 奖励说明 -->
      <div class="reward-info">
        <p>每日签到可获得 <strong>{{ dailyPoints }} 积分</strong></p>
        <p v-if="streakDays >= 7">连续 7 天额外 +20 积分！</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { getSignStatus, signIn, getUserPointsHistory } from '@/api/point'
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

// 用户信息
const userId = LocalStorageUtil.get('userId')

// 弹窗控制
const visible = ref(false)
const signing = ref(false)

// 当前日期
const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))

// 签到数据
const signedDates = ref<string[]>([])
const todaySigned = ref(false)
const streakDays = ref(0)
const dailyPoints = 10 // 每日积分

// 星期几
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 格式化日期
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

// 当前月份字符串
const currentMonthStr = computed(() => {
  return currentMonth.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

// 所有天数
const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const date = new Date(year, month, 1)
  const days = []

  // 前导空白
  const firstDayOfWeek = date.getDay()
  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevDate = new Date(year, month, -firstDayOfWeek + i + 1)
    days.push({
      date: prevDate,
      isCurrentMonth: false,
      isToday: false,
      isSigned: false
    })
  }

  // 当前月
  while (date.getMonth() === month) {
    const dateString = formatDate(date)
    const isToday = isSameDay(date, today)
    const isSigned = signedDates.value.includes(dateString)

    days.push({
      date: new Date(date),
      isCurrentMonth: true,
      isToday,
      isSigned
    })
    date.setDate(date.getDate() + 1)
  }

  return days
})

// 上一月 / 下一月
const prevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}
const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

// 加载签到数据
const loadSignInData = async () => {
  if (!userId) return
  try {
    // 调用获取用户签到历史的接口
    const res = await getUserPointsHistory(userId) as any
    
    // 根据实际后端返回的数据结构调整
    if (res && Array.isArray(res)) {
      // 提取签到日期列表（从 createdAt 字段提取日期部分）
      signedDates.value = res
        .filter((record: any) => record.reason === 'DAILY_SIGN_IN' && record.changeType === 'EARNED')
        .map((record: any) => {
          // 从 "2025-10-11 08:32:58" 格式中提取日期部分 "2025-10-11"
          return record.createdAt.split(' ')[0];
        })
      
      // 简单计算连续签到天数（需要后端提供或者通过算法计算）
      // 这里暂时使用简单的计算方式
      streakDays.value = calculateStreakDays(signedDates.value)
      
      // 检查今日是否已签到
      todaySigned.value = signedDates.value.includes(formatDate(today))
    }
  } catch (err) {
    ElMessage.error('加载签到数据失败')
    console.error('获取签到历史失败:', err)
  }
}

// 添加计算连续签到天数的辅助函数
const calculateStreakDays = (signedDates: string[]): number => {
  if (!signedDates.length) return 0
  
  const sortedDates = [...signedDates].sort().reverse()
  let streak = 0
  let currentDate = new Date()
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr)
    // 设置为同一天（忽略时间）
    date.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)
    
    // 检查是否是今天或昨天
    const timeDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 3600 * 24))
    
    if (timeDiff === streak) {
      streak++
    } else if (timeDiff < streak) {
      // 已经计算过的日期，跳过
      continue
    } else {
      // 断签，停止计算
      break
    }
  }
  
  return streak
}
// 签到
const handleSignIn = async () => {
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }
  signing.value = true
  try {
    await signIn({
      userId,
      points: dailyPoints,
      reason: 'DAILY_SIGN_IN',
      orderId: `SIGN_${Date.now()}`
    })
    ElMessage.success(`签到成功！获得 ${dailyPoints} 积分`)
    signedDates.value.push(formatDate(today))
    todaySigned.value = true
    streakDays.value += 1
  } catch (err: any) {
    ElMessage.error(err.message || '签到失败')
  } finally {
    signing.value = false
  }
}

// 弹窗打开
const open = () => {
  visible.value = true
  loadSignInData()
}

// 弹窗关闭
const onClosed = () => {
  // 可选：重置状态
}

// 暴露方法给父组件
defineExpose({
  open
})

// 计算标题
const dialogTitle = computed(() => {
  return todaySigned.value ? '已签到 ✅' : '每日签到领积分'
})
</script>

<style scoped>
.sign-in-dialog {
  text-align: center;
}

.sign-status {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.streak {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}
.streak .days {
  color: #ff6f61;
  font-weight: bold;
}

.today-status {
  color: #999;
}
.today-status.signed {
  color: #67c23a;
}

.sign-btn {
  width: 100%;
  margin: 10px 0 20px;
  font-size: 16px;
  height: 50px;
}

.calendar {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  margin: 20px 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 10px 20px;
  font-weight: 600;
}

.nav-btn {
  font-size: 1.2em;
  color: #666;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  background: #f1f3f5;
  padding: 8px 0;
  font-size: 0.85em;
  color: #666;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.9em;
}

.day {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #999;
  position: relative;
}

.day.current {
  color: #333;
}

.day.today {
  color: #ff6f61;
  font-weight: bold;
}

.day.signed::after {
  content: '✓';
  position: absolute;
  bottom: 2px;
  right: 6px;
  font-size: 0.8em;
  color: #409eff;
}

.reward-info {
  font-size: 0.9em;
  color: #999;
  line-height: 1.5;
}
</style>
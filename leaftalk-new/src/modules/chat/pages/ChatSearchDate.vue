<template>
  <div class="chat-search-date">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      title="按日期查找"
      :showBack="true"
      @back="goBack"
    />
    
    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 星期标题（固定在顶部） -->
      <div class="weekday-header">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="loading-icon"></iconify-icon>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="monthsData.length === 0" class="empty-container">
        <iconify-icon icon="heroicons:calendar" width="48" color="#ccc"></iconify-icon>
        <p>最近三个月没有聊天记录</p>
      </div>

      <!-- 滚动区域 - 显示最近三个月 -->
      <div v-else class="calendar-scroll-area">
        <div
          v-for="monthData in monthsData"
          :key="monthData.key"
          class="month-section"
        >
          <!-- 月份标题 -->
          <div class="month-title">{{ monthData.title }}</div>

          <!-- 日期网格 -->
          <div class="calendar-grid">
            <div
              v-for="(day, index) in monthData.days"
              :key="index"
              :class="[
                'calendar-day',
                {
                  'empty': !day.date,
                  'disabled': day.disabled,
                  'today': day.isToday,
                  'has-message': day.hasMessage
                }
              ]"
              @click="selectDate(day)"
            >
              <span v-if="day.date" class="day-number">{{ day.day }}</span>
              <span v-if="day.isToday && day.date" class="today-label">今天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'
import { messagePersistenceService } from '@/modules/chat/services/messagePersistenceService'

const router = useRouter()
const route = useRoute()

// 响应式数据
const selectedDate = ref<Date | null>(null)

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 获取今天的日期（只包含年月日）
const getToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 有消息记录的日期（最近3个月）
const datesWithMessages = ref<Set<string>>(new Set())
const isLoading = ref(true)

// 从数据库加载真实的聊天记录日期
const loadMessageDates = async () => {
  try {
    isLoading.value = true
    const chatId = route.params.chatId as string

    if (!chatId) {
      console.warn('⚠️ 没有提供 chatId')
      return
    }

    console.log('📅 开始加载聊天记录日期，chatId:', chatId)

    // 从持久化服务加载该会话的所有消息
    const messages = await messagePersistenceService.getLatestMessages(chatId, 1000)

    if (!messages || messages.length === 0) {
      console.log('📭 该会话没有消息记录')
      datesWithMessages.value = new Set()
      return
    }

    console.log('📨 加载到消息数量:', messages.length)

    // 提取所有消息的日期（只保留年月日）
    const dates = new Set<string>()
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1) // 三个月前的第一天

    messages.forEach(msg => {
      const timestamp = Number(msg.timestamp)
      if (!timestamp) return

      const date = new Date(timestamp)

      // 只统计最近三个月的消息
      if (date >= threeMonthsAgo && date <= now) {
        const dateKey = formatDateKey(date)
        dates.add(dateKey)
      }
    })

    console.log('📅 最近三个月有消息的日期数量:', dates.size)
    console.log('📅 有消息的日期:', Array.from(dates).sort())

    datesWithMessages.value = dates
  } catch (error) {
    console.error('❌ 加载消息日期失败:', error)
    datesWithMessages.value = new Set()
  } finally {
    isLoading.value = false
  }
}

// 计算属性 - 生成最近三个月的数据（只显示有聊天记录的月份）
const monthsData = computed(() => {
  const today = getToday()
  const months: any[] = []

  // 生成最近三个月（从两个月前到当前月）
  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()

    // 月份标题
    const title = `${year}年${month + 1}月`

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 获取当月第一天是星期几（0-6）
    const firstDayOfWeek = firstDay.getDay()

    // 获取当月有多少天
    const daysInMonth = lastDay.getDate()

    const days: any[] = []
    let monthHasMessages = false // 标记该月是否有消息

    // 填充空白日期（月初）
    for (let j = 0; j < firstDayOfWeek; j++) {
      days.push({ date: null, day: '', disabled: true, hasMessage: false })
    }

    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = formatDateKey(date)

      // 判断是否是今天
      const isToday = date.getTime() === today.getTime()

      // 判断是否是未来日期（当前月份不显示未来日期）
      const isFuture = date > today

      // 未来日期不显示
      if (isFuture) {
        continue
      }

      // 判断是否有消息
      const hasMessage = datesWithMessages.value.has(dateKey)

      // 如果该天有消息，标记该月有消息
      if (hasMessage) {
        monthHasMessages = true
      }

      days.push({
        date: date,
        day: day,
        disabled: !hasMessage, // 没有消息则禁用（显示灰色）
        isToday: isToday,
        hasMessage: hasMessage // 有消息则显示亮色
      })
    }

    // 只有该月有消息记录才添加到列表中
    if (monthHasMessages) {
      months.push({
        key: `${year}-${month}`,
        title: title,
        days: days
      })
    }
  }

  return months
})

// 方法
const goBack = () => {
  router.back()
}

// 选择日期
const selectDate = (day: any) => {
  // 如果没有日期、被禁用或没有消息，则不处理
  if (!day.date || day.disabled || !day.hasMessage) return

  selectedDate.value = day.date

  // 跳转到聊天页面的该日期消息
  const chatId = route.params.chatId as string
  if (chatId) {
    const dateStr = formatDateKey(day.date)
    console.log('🔍 跳转到聊天页面，定位到日期:', dateStr)
    // 跳转到聊天页面，并传递日期参数
    router.push({
      path: `/chat/${chatId}`,
      query: { date: dateStr }
    })
  }
}

// 格式化日期为 YYYY-MM-DD
const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 生命周期
onMounted(async () => {
  await loadMessageDates()
})
</script>

<style scoped>
.chat-search-date {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #EDEDED;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

/* 星期标题 - 固定在顶部 */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  background: white;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
}

.weekday {
  text-align: center;
  font-size: 14px;
  color: #999;
  padding: 12px 0;
}

/* 滚动区域 */
.calendar-scroll-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 月份区块 */
.month-section {
  margin-bottom: 24px;
}

/* 月份标题 */
.month-title {
  font-size: 15px;
  color: #999;
  padding: 16px 16px 12px 16px;
  text-align: left;
}

/* 日期网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding: 0 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 4px;
}

.calendar-day.empty {
  cursor: default;
}

/* 有消息的日期 - 亮色（黑色） */
.calendar-day.has-message .day-number {
  color: #333;
}

/* 没有消息的日期 - 灰色 */
.calendar-day.disabled .day-number {
  color: #D0D0D0;
}

/* 今天 - 绿色 */
.calendar-day.today .day-number {
  color: #07C160;
  font-weight: 500;
}

/* 今天标签 */
.today-label {
  font-size: 10px;
  color: #07C160;
  margin-top: 2px;
}

/* 点击效果 - 只有有消息的日期才有 */
.calendar-day.has-message:not(.disabled):active {
  background: #F0F0F0;
  border-radius: 4px;
}

.day-number {
  line-height: 1;
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.empty-container p {
  font-size: 15px;
}
</style>


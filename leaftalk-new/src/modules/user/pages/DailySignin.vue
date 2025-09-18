<template>
  <div class="daily-signin-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">每日签到</h1>
      <button @click="showSigninHistory = true" class="history-btn">
        <iconify-icon icon="heroicons:clock" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 签到状态卡片 -->
    <div class="signin-status-card">
      <div class="status-header">
        <div class="status-icon" :class="{ signed: todaySignedIn }">
          <iconify-icon :icon="todaySignedIn ? 'heroicons:check-circle' : 'heroicons:calendar-days'" width="32"></iconify-icon>
        </div>
        <div class="status-info">
          <div class="status-title">
            {{ todaySignedIn ? '今日已签到' : '今日未签到' }}
          </div>
          <div class="status-desc">
            {{ todaySignedIn ? `获得 ${todayReward} 叶语豆` : '签到可获得叶语豆奖励' }}
          </div>
        </div>
      </div>
      
      <div class="signin-stats">
        <div class="stat-item">
          <div class="stat-number">{{ consecutiveDays }}</div>
          <div class="stat-label">连续签到</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalSignins }}</div>
          <div class="stat-label">累计签到</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalRewards }}</div>
          <div class="stat-label">累计奖励</div>
        </div>
      </div>
    </div>

    <!-- 签到日历 -->
    <div class="signin-calendar">
      <div class="calendar-header">
        <button @click="previousMonth" class="nav-btn">
          <iconify-icon icon="heroicons:chevron-left" width="20"></iconify-icon>
        </button>
        <div class="month-year">{{ currentMonthYear }}</div>
        <button @click="nextMonth" class="nav-btn">
          <iconify-icon icon="heroicons:chevron-right" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="calendar-grid">
        <div class="weekday-header">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <div class="calendar-days">
          <div 
            v-for="day in calendarDays" 
            :key="day.date"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'signed': day.isSigned,
              'future': day.isFuture
            }"
          >
            <div class="day-number">{{ day.day }}</div>
            <div v-if="day.isSigned" class="signin-mark">
              <iconify-icon icon="heroicons:check" width="12"></iconify-icon>
            </div>
            <div v-if="day.reward" class="day-reward">+{{ day.reward }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 签到奖励规则 -->
    <div class="reward-rules">
      <div class="section-title">签到奖励规则</div>
      <div class="rules-list">
        <div 
          v-for="rule in rewardRules" 
          :key="rule.days"
          class="rule-item"
          :class="{ active: consecutiveDays >= rule.days }"
        >
          <div class="rule-icon">
            <iconify-icon :icon="rule.icon" width="20"></iconify-icon>
          </div>
          <div class="rule-info">
            <div class="rule-title">连续{{ rule.days }}天</div>
            <div class="rule-desc">{{ rule.description }}</div>
          </div>
          <div class="rule-reward">+{{ rule.reward }}豆</div>
        </div>
      </div>
    </div>

    <!-- 签到按钮 -->
    <div class="signin-action" v-if="!todaySignedIn">
      <button @click="performSignin" class="signin-btn" :disabled="signingIn">
        <iconify-icon icon="heroicons:sparkles" width="20"></iconify-icon>
        <span>{{ signingIn ? '签到中...' : '立即签到' }}</span>
      </button>
    </div>

    <!-- 额外任务 -->
    <div class="extra-tasks">
      <div class="section-title">额外任务</div>
      <div class="task-list">
        <div 
          v-for="task in extraTasks" 
          :key="task.id"
          class="task-item"
          :class="{ completed: task.completed }"
        >
          <div class="task-icon">
            <iconify-icon :icon="task.icon" width="20"></iconify-icon>
          </div>
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-desc">{{ task.description }}</div>
            <div class="task-progress" v-if="task.progress !== undefined">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (task.progress / task.target * 100) + '%' }"></div>
              </div>
              <div class="progress-text">{{ task.progress }}/{{ task.target }}</div>
            </div>
          </div>
          <div class="task-reward">
            <div class="reward-amount">+{{ task.reward }}豆</div>
            <button 
              v-if="!task.completed && task.progress >= task.target" 
              @click="claimTaskReward(task)"
              class="claim-btn"
            >
              领取
            </button>
            <div v-else-if="task.completed" class="completed-mark">
              <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 签到成功弹窗 -->
    <div v-if="showSigninSuccess" class="modal-overlay">
      <div class="signin-success-modal">
        <div class="success-animation">
          <div class="success-circle">
            <iconify-icon icon="heroicons:check" width="48"></iconify-icon>
          </div>
          <div class="success-sparkles">
            <div v-for="i in 8" :key="i" class="sparkle" :style="getSparkleStyle(i)">
              <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
            </div>
          </div>
        </div>
        
        <h3>签到成功！</h3>
        <p>恭喜您获得 {{ todayReward }} 叶语豆</p>
        
        <div class="success-stats">
          <div class="success-stat">
            <div class="stat-label">连续签到</div>
            <div class="stat-value">{{ consecutiveDays }}天</div>
          </div>
          <div class="success-stat">
            <div class="stat-label">今日奖励</div>
            <div class="stat-value">{{ todayReward }}豆</div>
          </div>
        </div>
        
        <button @click="closeSuccessModal" class="close-success-btn">
          继续
        </button>
      </div>
    </div>

    <!-- 签到历史弹窗 -->
    <div v-if="showSigninHistory" class="modal-overlay" @click="showSigninHistory = false">
      <div class="history-modal" @click.stop>
        <div class="modal-header">
          <h3>签到历史</h3>
          <button @click="showSigninHistory = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="history-list">
          <div 
            v-for="record in signinHistory" 
            :key="record.id"
            class="history-item"
          >
            <div class="history-date">{{ formatDate(record.date) }}</div>
            <div class="history-reward">+{{ record.reward }}豆</div>
            <div class="history-consecutive">连续{{ record.consecutive }}天</div>
          </div>
          
          <div v-if="signinHistory.length === 0" class="empty-history">
            <iconify-icon icon="heroicons:calendar-days" width="48"></iconify-icon>
            <p>暂无签到记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 状态
const todaySignedIn = ref(false)
const todayReward = ref(0)
const consecutiveDays = ref(0)
const totalSignins = ref(0)
const totalRewards = ref(0)
const signingIn = ref(false)
const showSigninSuccess = ref(false)
const showSigninHistory = ref(false)

// 日历状态
const currentDate = ref(new Date())
const signinRecords = ref([])
const signinHistory = ref([])

// 额外任务
const extraTasks = ref([
  {
    id: 1,
    title: '邀请好友',
    description: '邀请1位好友注册叶语',
    icon: 'heroicons:user-plus',
    reward: 100,
    progress: 0,
    target: 1,
    completed: false
  },
  {
    id: 2,
    title: '完善资料',
    description: '完善个人资料信息',
    icon: 'heroicons:user',
    reward: 50,
    progress: 80,
    target: 100,
    completed: false
  },
  {
    id: 3,
    title: '创建族谱',
    description: '创建第一个家族族谱',
    icon: 'heroicons:home',
    reward: 200,
    progress: 1,
    target: 1,
    completed: true
  }
])

// 奖励规则
const rewardRules = ref([
  { days: 1, reward: 10, icon: 'heroicons:gift', description: '基础奖励' },
  { days: 3, reward: 15, icon: 'heroicons:star', description: '连续3天额外奖励' },
  { days: 7, reward: 25, icon: 'heroicons:fire', description: '连续7天额外奖励' },
  { days: 15, reward: 50, icon: 'heroicons:trophy', description: '连续15天额外奖励' },
  { days: 30, reward: 100, icon: 'heroicons:crown', description: '连续30天超级奖励' }
])

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const today = new Date()
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取日历开始日期（包含上月末尾几天）
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  // 生成42天的日历（6周）
  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const signinRecord = signinRecords.value.find(record => record.date === dateStr)
    
    days.push({
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      isFuture: date > today,
      isSigned: !!signinRecord,
      reward: signinRecord?.reward || 0
    })
  }
  
  return days
})

// 生命周期
onMounted(() => {
  loadSigninData()
  loadSigninHistory()
  loadExtraTasks()
})

// 方法
const loadSigninData = async () => {
  try {
    const response = await fetch('/api/user/signin/status', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const data = result.data
        todaySignedIn.value = data.todaySignedIn
        todayReward.value = data.todayReward
        consecutiveDays.value = data.consecutiveDays
        totalSignins.value = data.totalSignins
        totalRewards.value = data.totalRewards
        signinRecords.value = data.records
      }
    }
  } catch (error) {
    console.error('加载签到数据失败:', error)
  }
}

const loadSigninHistory = async () => {
  try {
    const response = await fetch('/api/user/signin/history', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        signinHistory.value = result.data
      }
    }
  } catch (error) {
    console.error('加载签到历史失败:', error)
  }
}

const loadExtraTasks = async () => {
  try {
    const response = await fetch('/api/user/tasks', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        extraTasks.value = result.data
      }
    }
  } catch (error) {
    console.error('加载额外任务失败:', error)
  }
}

const performSignin = async () => {
  if (signingIn.value || todaySignedIn.value) return
  
  try {
    signingIn.value = true
    
    const response = await fetch('/api/user/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        todaySignedIn.value = true
        todayReward.value = result.data.reward
        consecutiveDays.value = result.data.consecutiveDays
        totalSignins.value += 1
        totalRewards.value += result.data.reward
        
        // 更新签到记录
        const today = new Date().toISOString().split('T')[0]
        signinRecords.value.push({
          date: today,
          reward: result.data.reward
        })
        
        showSigninSuccess.value = true
      } else {
        appStore.showToast(result.message || '签到失败', 'error')
      }
    } else {
      appStore.showToast('签到请求失败', 'error')
    }
  } catch (error) {
    console.error('签到失败:', error)
    appStore.showToast('签到失败', 'error')
  } finally {
    signingIn.value = false
  }
}

const claimTaskReward = async (task) => {
  try {
    const response = await fetch(`/api/user/tasks/${task.id}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        task.completed = true
        totalRewards.value += task.reward
        appStore.showToast(`获得 ${task.reward} 叶语豆`, 'success')
      } else {
        appStore.showToast(result.message || '领取失败', 'error')
      }
    } else {
      appStore.showToast('领取请求失败', 'error')
    }
  } catch (error) {
    console.error('领取任务奖励失败:', error)
    appStore.showToast('领取失败', 'error')
  }
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const closeSuccessModal = () => {
  showSigninSuccess.value = false
}

const getSparkleStyle = (index) => {
  const angle = (index * 45) * Math.PI / 180
  const radius = 60
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    animationDelay: `${index * 0.1}s`
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.daily-signin-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .history-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 签到状态卡片 */
.signin-status-card {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.status-icon {
  width: 48px;
  height: 48px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.status-icon.signed {
  background: #07c160;
  color: white;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.status-desc {
  font-size: 14px;
  color: #666;
}

.signin-stats {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 签到日历 */
.signin-calendar {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.month-year {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 8px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  height: 48px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.day-number {
  font-size: 14px;
  color: #333;
}

.calendar-day.other-month .day-number {
  color: #ccc;
}

.calendar-day.today {
  background: rgba(7, 193, 96, 0.1);
}

.calendar-day.signed {
  background: rgba(7, 193, 96, 0.2);
}

.calendar-day.future {
  color: #ccc;
}

.signin-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.day-reward {
  font-size: 10px;
  color: #07c160;
  margin-top: 2px;
}

/* 奖励规则 */
.reward-rules {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.2s;
}

.rule-item.active {
  background: rgba(7, 193, 96, 0.1);
  border-left: 3px solid #07c160;
}

.rule-icon {
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.rule-item.active .rule-icon {
  background: #07c160;
  color: white;
}

.rule-info {
  flex: 1;
}

.rule-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.rule-desc {
  font-size: 12px;
  color: #666;
}

.rule-reward {
  font-size: 14px;
  font-weight: 600;
  color: #ff9800;
}

/* 签到按钮 */
.signin-action {
  margin: 0 16px 16px;
}

.signin-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(45deg, #07c160, #10d56c);
  color: white;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
  transition: all 0.2s;
}

.signin-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.4);
}

.signin-btn:disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
}

/* 额外任务 */
.extra-tasks {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.2s;
}

.task-item.completed {
  background: rgba(7, 193, 96, 0.1);
}

.task-icon {
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.task-item.completed .task-icon {
  background: #07c160;
  color: white;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.task-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #07c160;
  border-radius: 3px;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.task-reward {
  text-align: center;
}

.reward-amount {
  font-size: 14px;
  font-weight: 600;
  color: #ff9800;
  margin-bottom: 8px;
}

.claim-btn {
  height: 28px;
  border: none;
  border-radius: 14px;
  background: #ff9800;
  color: white;
  font-size: 12px;
  padding: 0 12px;
  cursor: pointer;
}

.completed-mark {
  color: #07c160;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.signin-success-modal {
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  max-width: 300px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.success-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
}

.success-circle {
  width: 100%;
  height: 100%;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse 1s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-sparkles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.sparkle {
  position: absolute;
  color: #ffd700;
  animation: sparkle 1s ease-in-out;
}

@keyframes sparkle {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

.signin-success-modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.signin-success-modal p {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
}

.success-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.success-stat {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-success-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 22px;
  background: #07c160;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

/* 历史弹窗 */
.history-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.history-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.history-date {
  font-size: 14px;
  color: #333;
}

.history-reward {
  font-size: 14px;
  font-weight: 600;
  color: #ff9800;
}

.history-consecutive {
  font-size: 12px;
  color: #666;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-history iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}
</style>

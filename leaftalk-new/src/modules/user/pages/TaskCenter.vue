<template>
  <div class="task-center">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">任务中心</h1>
      <button @click="showTaskHistory = true" class="history-btn">
        <iconify-icon icon="heroicons:clock" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 用户等级信息 -->
    <div class="user-level-card">
      <div class="level-background">
        <div class="level-avatar">
          <img :src="userInfo.avatar || '/default-avatar.png'" :alt="userInfo.name" />
          <div class="level-badge">
            <span>Lv.{{ userLevel.level }}</span>
          </div>
        </div>
        <div class="level-info">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="level-title">{{ userLevel.title }}</div>
          <div class="level-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (userLevel.currentExp / userLevel.nextLevelExp * 100) + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              {{ userLevel.currentExp }}/{{ userLevel.nextLevelExp }} EXP
            </div>
          </div>
        </div>
        <div class="level-rewards">
          <div class="reward-item">
            <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
            <span>{{ userStats.totalBeans }}豆</span>
          </div>
          <div class="reward-item">
            <iconify-icon icon="heroicons:trophy" width="16"></iconify-icon>
            <span>{{ userStats.totalAchievements }}成就</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日任务 -->
    <div class="task-section">
      <div class="section-header">
        <h3>每日任务</h3>
        <div class="section-progress">
          <span>{{ completedDailyTasks }}/{{ dailyTasks.length }}</span>
          <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
        </div>
      </div>
      
      <div class="task-list">
        <div 
          v-for="task in dailyTasks" 
          :key="task.id"
          class="task-item"
          :class="{ completed: task.completed, claimed: task.claimed }"
        >
          <div class="task-icon">
            <iconify-icon :icon="task.icon" width="24"></iconify-icon>
          </div>
          <div class="task-info">
            <div class="task-name">{{ task.name }}</div>
            <div class="task-desc">{{ task.description }}</div>
            <div class="task-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: Math.min(task.current / task.target * 100, 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ task.current }}/{{ task.target }}</span>
            </div>
          </div>
          <div class="task-reward">
            <div class="reward-amount">+{{ task.reward }}豆</div>
            <button 
              @click="claimTaskReward(task)"
              :disabled="!task.completed || task.claimed"
              class="claim-btn"
              :class="{ 
                'can-claim': task.completed && !task.claimed,
                'claimed': task.claimed 
              }"
            >
              {{ task.claimed ? '已领取' : task.completed ? '领取' : '进行中' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就系统 -->
    <div class="achievement-section">
      <div class="section-header">
        <h3>成就系统</h3>
        <button @click="showAllAchievements" class="view-all-btn">查看全部</button>
      </div>
      
      <div class="achievement-categories">
        <button 
          v-for="category in achievementCategories" 
          :key="category.id"
          @click="selectedCategory = category.id"
          :class="{ active: selectedCategory === category.id }"
          class="category-btn"
        >
          <iconify-icon :icon="category.icon" width="16"></iconify-icon>
          <span>{{ category.name }}</span>
          <div v-if="category.newCount > 0" class="new-badge">{{ category.newCount }}</div>
        </button>
      </div>
      
      <div class="achievement-list">
        <div 
          v-for="achievement in filteredAchievements" 
          :key="achievement.id"
          class="achievement-item"
          :class="{ 
            completed: achievement.completed, 
            claimed: achievement.claimed,
            locked: achievement.locked 
          }"
          @click="viewAchievement(achievement)"
        >
          <div class="achievement-icon">
            <iconify-icon :icon="achievement.icon" width="32"></iconify-icon>
            <div v-if="achievement.completed && !achievement.claimed" class="completion-badge">
              <iconify-icon icon="heroicons:exclamation" width="12"></iconify-icon>
            </div>
          </div>
          <div class="achievement-info">
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div class="achievement-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: Math.min(achievement.current / achievement.target * 100, 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ achievement.current }}/{{ achievement.target }}</span>
            </div>
          </div>
          <div class="achievement-reward">
            <div class="reward-info">
              <div class="reward-beans">+{{ achievement.beanReward }}豆</div>
              <div class="reward-exp">+{{ achievement.expReward }}EXP</div>
            </div>
            <button 
              v-if="achievement.completed && !achievement.claimed"
              @click.stop="claimAchievementReward(achievement)"
              class="claim-achievement-btn"
            >
              领取
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 等级奖励 -->
    <div class="level-rewards-section">
      <div class="section-header">
        <h3>等级奖励</h3>
        <div class="current-level">当前等级: {{ userLevel.level }}</div>
      </div>
      
      <div class="level-rewards-list">
        <div 
          v-for="levelReward in levelRewards" 
          :key="levelReward.level"
          class="level-reward-item"
          :class="{ 
            current: levelReward.level === userLevel.level,
            completed: levelReward.level < userLevel.level,
            locked: levelReward.level > userLevel.level 
          }"
        >
          <div class="level-number">{{ levelReward.level }}</div>
          <div class="level-reward-info">
            <div class="level-name">{{ levelReward.name }}</div>
            <div class="reward-items">
              <span v-for="reward in levelReward.rewards" :key="reward.type" class="reward-item">
                <iconify-icon :icon="getRewardIcon(reward.type)" width="14"></iconify-icon>
                {{ reward.amount }}{{ getRewardUnit(reward.type) }}
              </span>
            </div>
          </div>
          <div class="level-status">
            <span v-if="levelReward.level < userLevel.level" class="status-completed">已获得</span>
            <span v-else-if="levelReward.level === userLevel.level" class="status-current">当前</span>
            <span v-else class="status-locked">未解锁</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务历史弹窗 -->
    <div v-if="showTaskHistory" class="modal-overlay" @click="showTaskHistory = false">
      <div class="task-history-modal" @click.stop>
        <div class="modal-header">
          <h3>任务历史</h3>
          <button @click="showTaskHistory = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="history-filters">
            <select v-model="historyFilter">
              <option value="all">全部任务</option>
              <option value="daily">每日任务</option>
              <option value="achievement">成就任务</option>
              <option value="special">特殊任务</option>
            </select>
            <select v-model="historyPeriod">
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
              <option value="all">全部时间</option>
            </select>
          </div>
          
          <div class="history-list">
            <div 
              v-for="record in filteredTaskHistory" 
              :key="record.id"
              class="history-item"
            >
              <div class="history-icon">
                <iconify-icon :icon="record.icon" width="20"></iconify-icon>
              </div>
              <div class="history-info">
                <div class="history-name">{{ record.name }}</div>
                <div class="history-time">{{ formatDateTime(record.completedAt) }}</div>
              </div>
              <div class="history-reward">
                <span class="reward-beans">+{{ record.beanReward }}豆</span>
                <span v-if="record.expReward" class="reward-exp">+{{ record.expReward }}EXP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就详情弹窗 -->
    <div v-if="showAchievementDetail" class="modal-overlay" @click="showAchievementDetail = false">
      <div class="achievement-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>成就详情</h3>
          <button @click="showAchievementDetail = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div v-if="selectedAchievement" class="achievement-detail">
            <div class="detail-icon">
              <iconify-icon :icon="selectedAchievement.icon" width="64"></iconify-icon>
            </div>
            <div class="detail-info">
              <h4>{{ selectedAchievement.name }}</h4>
              <p>{{ selectedAchievement.description }}</p>
              <div class="detail-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: Math.min(selectedAchievement.current / selectedAchievement.target * 100, 100) + '%' }"
                  ></div>
                </div>
                <span>{{ selectedAchievement.current }}/{{ selectedAchievement.target }}</span>
              </div>
              <div class="detail-rewards">
                <div class="reward-item">
                  <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
                  <span>{{ selectedAchievement.beanReward }}叶语豆</span>
                </div>
                <div class="reward-item">
                  <iconify-icon icon="heroicons:star" width="16"></iconify-icon>
                  <span>{{ selectedAchievement.expReward }}经验值</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button 
            v-if="selectedAchievement?.completed && !selectedAchievement?.claimed"
            @click="claimAchievementReward(selectedAchievement)"
            class="claim-detail-btn"
          >
            领取奖励
          </button>
          <button @click="showAchievementDetail = false" class="close-detail-btn">关闭</button>
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
const showTaskHistory = ref(false)
const showAchievementDetail = ref(false)
const selectedCategory = ref('all')
const selectedAchievement = ref(null)
const historyFilter = ref('all')
const historyPeriod = ref('week')

// 用户信息
const userInfo = ref({
  id: 1,
  name: '叶小明',
  avatar: '/mock-avatar-3.jpg'
})

// 用户等级信息
const userLevel = ref({
  level: 5,
  title: '家族新星',
  currentExp: 1250,
  nextLevelExp: 2000
})

// 用户统计
const userStats = ref({
  totalBeans: 3580,
  totalAchievements: 12
})

// 每日任务
const dailyTasks = ref([
  {
    id: 1,
    name: '每日签到',
    description: '完成每日签到获得奖励',
    icon: 'heroicons:calendar-days',
    current: 1,
    target: 1,
    reward: 10,
    completed: true,
    claimed: false
  },
  {
    id: 2,
    name: '查看族谱',
    description: '浏览家族族谱信息',
    icon: 'heroicons:users',
    current: 1,
    target: 1,
    reward: 5,
    completed: true,
    claimed: true
  },
  {
    id: 3,
    name: '发布动态',
    description: '在家族群中发布一条动态',
    icon: 'heroicons:chat-bubble-left',
    current: 0,
    target: 1,
    reward: 15,
    completed: false,
    claimed: false
  },
  {
    id: 4,
    name: '添加家族成员',
    description: '为族谱添加一位新成员',
    icon: 'heroicons:user-plus',
    current: 0,
    target: 1,
    reward: 20,
    completed: false,
    claimed: false
  }
])

// 成就分类
const achievementCategories = ref([
  { id: 'all', name: '全部', icon: 'heroicons:squares-2x2', newCount: 2 },
  { id: 'social', name: '社交', icon: 'heroicons:users', newCount: 1 },
  { id: 'genealogy', name: '族谱', icon: 'heroicons:academic-cap', newCount: 1 },
  { id: 'activity', name: '活动', icon: 'heroicons:sparkles', newCount: 0 },
  { id: 'contribution', name: '贡献', icon: 'heroicons:heart', newCount: 0 }
])

// 成就列表
const achievements = ref([
  {
    id: 1,
    name: '初来乍到',
    description: '完成账户注册',
    icon: 'heroicons:user-plus',
    category: 'social',
    current: 1,
    target: 1,
    beanReward: 50,
    expReward: 100,
    completed: true,
    claimed: true,
    locked: false
  },
  {
    id: 2,
    name: '族谱建设者',
    description: '添加10位家族成员',
    icon: 'heroicons:users',
    category: 'genealogy',
    current: 8,
    target: 10,
    beanReward: 100,
    expReward: 200,
    completed: false,
    claimed: false,
    locked: false
  },
  {
    id: 3,
    name: '社交达人',
    description: '发布50条动态',
    icon: 'heroicons:chat-bubble-left',
    category: 'social',
    current: 45,
    target: 50,
    beanReward: 200,
    expReward: 300,
    completed: false,
    claimed: false,
    locked: false
  },
  {
    id: 4,
    name: '签到达人',
    description: '连续签到30天',
    icon: 'heroicons:calendar-days',
    category: 'activity',
    current: 30,
    target: 30,
    beanReward: 300,
    expReward: 500,
    completed: true,
    claimed: false,
    locked: false
  }
])

// 等级奖励
const levelRewards = ref([
  {
    level: 1,
    name: '新手上路',
    rewards: [
      { type: 'beans', amount: 100 },
      { type: 'avatar_frame', amount: 1 }
    ]
  },
  {
    level: 5,
    name: '家族新星',
    rewards: [
      { type: 'beans', amount: 500 },
      { type: 'title', amount: 1 },
      { type: 'privilege', amount: 1 }
    ]
  },
  {
    level: 10,
    name: '族谱专家',
    rewards: [
      { type: 'beans', amount: 1000 },
      { type: 'special_avatar', amount: 1 },
      { type: 'advanced_features', amount: 1 }
    ]
  }
])

// 任务历史
const taskHistory = ref([
  {
    id: 1,
    name: '每日签到',
    icon: 'heroicons:calendar-days',
    type: 'daily',
    beanReward: 10,
    expReward: 20,
    completedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 2,
    name: '查看族谱',
    icon: 'heroicons:users',
    type: 'daily',
    beanReward: 5,
    expReward: 10,
    completedAt: '2024-01-15T10:30:00Z'
  }
])

// 计算属性
const completedDailyTasks = computed(() => {
  return dailyTasks.value.filter(task => task.completed).length
})

const filteredAchievements = computed(() => {
  if (selectedCategory.value === 'all') {
    return achievements.value
  }
  return achievements.value.filter(achievement => achievement.category === selectedCategory.value)
})

const filteredTaskHistory = computed(() => {
  let filtered = taskHistory.value
  
  if (historyFilter.value !== 'all') {
    filtered = filtered.filter(record => record.type === historyFilter.value)
  }
  
  if (historyPeriod.value !== 'all') {
    const now = new Date()
    const cutoff = new Date()
    
    if (historyPeriod.value === 'week') {
      cutoff.setDate(now.getDate() - 7)
    } else if (historyPeriod.value === 'month') {
      cutoff.setMonth(now.getMonth() - 1)
    }
    
    filtered = filtered.filter(record => new Date(record.completedAt) >= cutoff)
  }
  
  return filtered
})

// 生命周期
onMounted(() => {
  loadTaskData()
})

// 方法
const loadTaskData = async () => {
  try {
    const response = await fetch('/api/user/tasks', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const data = result.data
        userLevel.value = data.userLevel
        userStats.value = data.userStats
        dailyTasks.value = data.dailyTasks
        achievements.value = data.achievements
        taskHistory.value = data.taskHistory
      }
    }
  } catch (error) {
    console.error('加载任务数据失败:', error)
    // 使用模拟数据
  }
}

const claimTaskReward = async (task) => {
  if (!task.completed || task.claimed) return
  
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
        task.claimed = true
        userStats.value.totalBeans += task.reward
        appStore.showToast(`获得 ${task.reward} 叶语豆！`, 'success')
      }
    }
  } catch (error) {
    console.error('领取任务奖励失败:', error)
    appStore.showToast('领取失败', 'error')
  }
}

const claimAchievementReward = async (achievement) => {
  if (!achievement.completed || achievement.claimed) return
  
  try {
    const response = await fetch(`/api/user/achievements/${achievement.id}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        achievement.claimed = true
        userStats.value.totalBeans += achievement.beanReward
        userLevel.value.currentExp += achievement.expReward
        
        // 检查是否升级
        if (userLevel.value.currentExp >= userLevel.value.nextLevelExp) {
          levelUp()
        }
        
        appStore.showToast(`获得 ${achievement.beanReward} 叶语豆和 ${achievement.expReward} 经验！`, 'success')
        showAchievementDetail.value = false
      }
    }
  } catch (error) {
    console.error('领取成就奖励失败:', error)
    appStore.showToast('领取失败', 'error')
  }
}

const levelUp = () => {
  userLevel.value.level += 1
  userLevel.value.currentExp -= userLevel.value.nextLevelExp
  userLevel.value.nextLevelExp = Math.floor(userLevel.value.nextLevelExp * 1.5)
  
  // 更新等级称号
  const levelTitles = {
    1: '新手上路',
    5: '家族新星',
    10: '族谱专家',
    15: '家族长老',
    20: '族谱大师'
  }
  
  if (levelTitles[userLevel.value.level]) {
    userLevel.value.title = levelTitles[userLevel.value.level]
  }
  
  appStore.showToast(`恭喜升级到 ${userLevel.value.level} 级！`, 'success')
}

const viewAchievement = (achievement) => {
  selectedAchievement.value = achievement
  showAchievementDetail.value = true
}

const showAllAchievements = () => {
  router.push('/achievements')
}

const getRewardIcon = (type) => {
  const icons = {
    beans: 'heroicons:sparkles',
    avatar_frame: 'heroicons:photo',
    title: 'heroicons:star',
    privilege: 'heroicons:key',
    special_avatar: 'heroicons:user-circle',
    advanced_features: 'heroicons:cog-6-tooth'
  }
  return icons[type] || 'heroicons:gift'
}

const getRewardUnit = (type) => {
  const units = {
    beans: '豆',
    avatar_frame: '个',
    title: '个',
    privilege: '项',
    special_avatar: '个',
    advanced_features: '项'
  }
  return units[type] || ''
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-center {
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

.history-btn {
  background: #f0f0f0;
  border-radius: 8px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 用户等级卡片 */
.user-level-card {
  margin: 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.level-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.level-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ffd700;
  color: #333;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.level-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.level-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.level-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ffd700;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  opacity: 0.8;
}

.level-rewards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.9;
}

/* 任务区域 */
.task-section, .achievement-section, .level-rewards-section {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #07c160;
}

.view-all-btn {
  background: none;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
}

.current-level {
  font-size: 14px;
  color: #666;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.2s;
}

.task-item.completed {
  background: rgba(7, 193, 96, 0.1);
  border: 1px solid rgba(7, 193, 96, 0.3);
}

.task-item.claimed {
  opacity: 0.6;
}

.task-icon {
  width: 40px;
  height: 40px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.task-item.completed .task-icon {
  background: #4CAF50;
}

.task-item.claimed .task-icon {
  background: #ccc;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
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

.task-progress .progress-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.task-progress .progress-fill {
  height: 100%;
  background: #07c160;
  border-radius: 2px;
}

.task-progress .progress-text {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.task-reward {
  text-align: center;
}

.reward-amount {
  font-size: 12px;
  color: #ff9800;
  font-weight: 500;
  margin-bottom: 4px;
}

.claim-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.claim-btn.can-claim {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.claim-btn.claimed {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.claim-btn:disabled {
  cursor: not-allowed;
}

/* 成就系统 */
.achievement-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.category-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.new-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 6px;
  min-width: 16px;
  text-align: center;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.achievement-item:hover {
  background: #f0f0f0;
}

.achievement-item.completed {
  background: rgba(7, 193, 96, 0.1);
  border: 1px solid rgba(7, 193, 96, 0.3);
}

.achievement-item.claimed {
  opacity: 0.6;
}

.achievement-item.locked {
  opacity: 0.4;
}

.achievement-icon {
  position: relative;
  width: 48px;
  height: 48px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.achievement-item.completed .achievement-icon {
  background: #4CAF50;
}

.achievement-item.locked .achievement-icon {
  background: #ccc;
}

.completion-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #ff4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.achievement-progress .progress-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.achievement-progress .progress-fill {
  height: 100%;
  background: #07c160;
  border-radius: 2px;
}

.achievement-progress .progress-text {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.achievement-reward {
  text-align: center;
}

.reward-info {
  margin-bottom: 8px;
}

.reward-beans {
  font-size: 12px;
  color: #ff9800;
  font-weight: 500;
  display: block;
  margin-bottom: 2px;
}

.reward-exp {
  font-size: 11px;
  color: #2196f3;
}

.claim-achievement-btn {
  padding: 4px 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

/* 等级奖励 */
.level-rewards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.level-reward-item.current {
  background: rgba(7, 193, 96, 0.1);
  border: 1px solid rgba(7, 193, 96, 0.3);
}

.level-reward-item.completed {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.level-reward-item.locked {
  opacity: 0.6;
}

.level-number {
  width: 32px;
  height: 32px;
  background: #07c160;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.level-reward-item.completed .level-number {
  background: #4CAF50;
}

.level-reward-item.locked .level-number {
  background: #ccc;
}

.level-reward-info {
  flex: 1;
}

.level-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.reward-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-items .reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: white;
  padding: 2px 6px;
  border-radius: 8px;
}

.level-status {
  font-size: 12px;
}

.status-completed {
  color: #4CAF50;
}

.status-current {
  color: #07c160;
  font-weight: 500;
}

.status-locked {
  color: #999;
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

.task-history-modal,
.achievement-detail-modal {
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

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 任务历史 */
.history-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.history-filters select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.history-icon {
  width: 32px;
  height: 32px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-reward {
  text-align: right;
}

.reward-beans {
  font-size: 12px;
  color: #ff9800;
  display: block;
  margin-bottom: 2px;
}

.reward-exp {
  font-size: 11px;
  color: #2196f3;
}

/* 成就详情 */
.achievement-detail {
  text-align: center;
}

.detail-icon {
  margin-bottom: 16px;
}

.detail-icon iconify-icon {
  color: #07c160;
}

.detail-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.detail-info p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.4;
}

.detail-progress {
  margin-bottom: 16px;
}

.detail-progress .progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.detail-progress .progress-fill {
  height: 100%;
  background: #07c160;
  border-radius: 4px;
}

.detail-rewards {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.detail-rewards .reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.claim-detail-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.close-detail-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}
</style>

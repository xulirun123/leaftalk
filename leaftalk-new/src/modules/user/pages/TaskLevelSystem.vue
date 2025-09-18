<template>
  <div class="task-level-system">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">任务中心</h1>
      <button @click="showLevelInfo = true" class="level-btn">
        <iconify-icon icon="heroicons:information-circle" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 用户等级信息 -->
    <div class="user-level-card">
      <div class="level-background">
        <div class="level-avatar">
          <img :src="userInfo.avatar || '/default-avatar.png'" :alt="userInfo.name" />
          <div class="level-badge" :class="userInfo.level.tier">
            <span>{{ userInfo.level.number }}</span>
          </div>
        </div>
        
        <div class="level-info">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="level-title" :class="userInfo.level.tier">
            {{ userInfo.level.title }}
          </div>
          <div class="level-description">{{ userInfo.level.description }}</div>
        </div>
        
        <div class="level-stats">
          <div class="stat-item">
            <div class="stat-value">{{ userInfo.totalExp }}</div>
            <div class="stat-label">总经验</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ userInfo.completedTasks }}</div>
            <div class="stat-label">完成任务</div>
          </div>
        </div>
      </div>
      
      <div class="level-progress">
        <div class="progress-info">
          <span class="current-exp">{{ userInfo.currentExp }}</span>
          <span class="progress-separator">/</span>
          <span class="next-level-exp">{{ userInfo.nextLevelExp }}</span>
          <span class="next-level-text">升级到{{ getNextLevelTitle() }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: (userInfo.currentExp / userInfo.nextLevelExp * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 任务分类 -->
    <div class="task-categories">
      <div class="category-tabs">
        <button 
          v-for="category in taskCategories" 
          :key="category.id"
          @click="activeCategory = category.id"
          :class="{ active: activeCategory === category.id }"
          class="category-tab"
        >
          <iconify-icon :icon="category.icon" width="16"></iconify-icon>
          <span>{{ category.name }}</span>
          <div v-if="getUncompletedCount(category.id) > 0" class="task-count">
            {{ getUncompletedCount(category.id) }}
          </div>
        </button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list-container">
      <div class="task-list-header">
        <h3>{{ getCurrentCategoryName() }}</h3>
        <div class="task-filters">
          <select v-model="taskFilter" @change="filterTasks">
            <option value="all">全部任务</option>
            <option value="available">可完成</option>
            <option value="completed">已完成</option>
            <option value="locked">未解锁</option>
          </select>
        </div>
      </div>
      
      <div class="task-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="{ 
            completed: task.completed,
            locked: task.locked,
            featured: task.featured 
          }"
          @click="selectTask(task)"
        >
          <div class="task-icon" :class="task.difficulty">
            <iconify-icon :icon="getTaskIcon(task)" width="20"></iconify-icon>
            <div v-if="task.featured" class="featured-badge">
              <iconify-icon icon="heroicons:star" width="12"></iconify-icon>
            </div>
          </div>
          
          <div class="task-content">
            <div class="task-header">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-difficulty" :class="task.difficulty">
                {{ getDifficultyText(task.difficulty) }}
              </div>
            </div>
            
            <div class="task-description">{{ task.description }}</div>
            
            <div class="task-progress" v-if="task.type === 'progress'">
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: (task.currentProgress / task.targetProgress * 100) + '%' }"
                ></div>
              </div>
              <div class="progress-text">
                {{ task.currentProgress }} / {{ task.targetProgress }}
              </div>
            </div>
            
            <div class="task-rewards">
              <div class="reward-list">
                <div 
                  v-for="reward in task.rewards" 
                  :key="reward.type"
                  class="reward-item"
                >
                  <iconify-icon :icon="getRewardIcon(reward.type)" width="14"></iconify-icon>
                  <span>{{ reward.amount }}{{ getRewardUnit(reward.type) }}</span>
                </div>
              </div>
              
              <div class="task-deadline" v-if="task.deadline">
                <iconify-icon icon="heroicons:clock" width="12"></iconify-icon>
                <span>{{ formatDeadline(task.deadline) }}</span>
              </div>
            </div>
          </div>
          
          <div class="task-actions">
            <button 
              v-if="task.completed"
              class="action-btn completed"
              disabled
            >
              <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
              <span>已完成</span>
            </button>
            
            <button 
              v-else-if="task.locked"
              class="action-btn locked"
              disabled
            >
              <iconify-icon icon="heroicons:lock-closed" width="16"></iconify-icon>
              <span>未解锁</span>
            </button>
            
            <button 
              v-else-if="task.type === 'instant'"
              @click.stop="completeTask(task)"
              class="action-btn available"
            >
              <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
              <span>开始</span>
            </button>
            
            <button 
              v-else
              @click.stop="viewTaskDetail(task)"
              class="action-btn available"
            >
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
              <span>查看</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就系统 */
    <div class="achievement-system">
      <div class="achievement-header">
        <h3>成就系统</h3>
        <button @click="showAllAchievements = true" class="view-all-btn">
          <span>查看全部</span>
          <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
        </button>
      </div>
      
      <div class="achievement-grid">
        <div 
          v-for="achievement in recentAchievements" 
          :key="achievement.id"
          class="achievement-item"
          :class="{ unlocked: achievement.unlocked }"
          @click="viewAchievementDetail(achievement)"
        >
          <div class="achievement-icon" :class="achievement.rarity">
            <iconify-icon :icon="achievement.icon" width="24"></iconify-icon>
            <div v-if="achievement.unlocked" class="unlock-badge">
              <iconify-icon icon="heroicons:check" width="12"></iconify-icon>
            </div>
          </div>
          
          <div class="achievement-info">
            <div class="achievement-title">{{ achievement.title }}</div>
            <div class="achievement-description">{{ achievement.description }}</div>
            <div v-if="achievement.unlocked" class="unlock-date">
              {{ formatDate(achievement.unlockedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日签到 -->
    <div class="daily-checkin">
      <div class="checkin-header">
        <h3>每日签到</h3>
        <div class="checkin-streak">连续{{ checkinData.streak }}天</div>
      </div>
      
      <div class="checkin-calendar">
        <div 
          v-for="(day, index) in checkinData.calendar" 
          :key="index"
          class="checkin-day"
          :class="{ 
            checked: day.checked,
            today: day.isToday,
            future: day.isFuture 
          }"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-reward">
            <iconify-icon :icon="getRewardIcon(day.reward.type)" width="12"></iconify-icon>
            <span>{{ day.reward.amount }}</span>
          </div>
          <div v-if="day.checked" class="check-mark">
            <iconify-icon icon="heroicons:check" width="12"></iconify-icon>
          </div>
        </div>
      </div>
      
      <div class="checkin-actions">
        <button 
          @click="performCheckin"
          :disabled="checkinData.todayChecked"
          class="checkin-btn"
          :class="{ checked: checkinData.todayChecked }"
        >
          <iconify-icon :icon="checkinData.todayChecked ? 'heroicons:check' : 'heroicons:gift'" width="16"></iconify-icon>
          <span>{{ checkinData.todayChecked ? '今日已签到' : '立即签到' }}</span>
        </button>
      </div>
    </div>

    <!-- 任务详情弹窗 -->
    <div v-if="selectedTask" class="modal-overlay" @click="closeTaskDetail">
      <div class="task-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedTask.title }}</h3>
          <button @click="closeTaskDetail" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="task-detail">
            <div class="detail-section">
              <h4>任务描述</h4>
              <p>{{ selectedTask.description }}</p>
              <div v-if="selectedTask.longDescription" class="long-description">
                {{ selectedTask.longDescription }}
              </div>
            </div>
            
            <div class="detail-section">
              <h4>完成条件</h4>
              <div class="task-requirements">
                <div 
                  v-for="requirement in selectedTask.requirements" 
                  :key="requirement.id"
                  class="requirement-item"
                  :class="{ completed: requirement.completed }"
                >
                  <iconify-icon 
                    :icon="requirement.completed ? 'heroicons:check-circle' : 'heroicons:clock'" 
                    width="16"
                  ></iconify-icon>
                  <span>{{ requirement.description }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>任务奖励</h4>
              <div class="reward-grid">
                <div 
                  v-for="reward in selectedTask.rewards" 
                  :key="reward.type"
                  class="reward-card"
                >
                  <div class="reward-icon">
                    <iconify-icon :icon="getRewardIcon(reward.type)" width="20"></iconify-icon>
                  </div>
                  <div class="reward-info">
                    <div class="reward-amount">{{ reward.amount }}{{ getRewardUnit(reward.type) }}</div>
                    <div class="reward-name">{{ getRewardName(reward.type) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedTask.tips && selectedTask.tips.length > 0" class="detail-section">
              <h4>完成提示</h4>
              <div class="task-tips">
                <div 
                  v-for="tip in selectedTask.tips" 
                  :key="tip"
                  class="tip-item"
                >
                  <iconify-icon icon="heroicons:light-bulb" width="14"></iconify-icon>
                  <span>{{ tip }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeTaskDetail" class="cancel-btn">关闭</button>
          <button 
            v-if="!selectedTask.completed && !selectedTask.locked"
            @click="startTask(selectedTask)"
            class="start-btn"
          >
            <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
            <span>开始任务</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 等级信息弹窗 -->
    <div v-if="showLevelInfo" class="modal-overlay" @click="showLevelInfo = false">
      <div class="level-info-modal" @click.stop>
        <div class="modal-header">
          <h3>等级体系说明</h3>
          <button @click="showLevelInfo = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="level-system-info">
            <div class="info-section">
              <h4>等级划分</h4>
              <div class="level-tiers">
                <div 
                  v-for="tier in levelTiers" 
                  :key="tier.id"
                  class="tier-item"
                  :class="tier.id"
                >
                  <div class="tier-icon">
                    <iconify-icon :icon="tier.icon" width="20"></iconify-icon>
                  </div>
                  <div class="tier-info">
                    <div class="tier-name">{{ tier.name }}</div>
                    <div class="tier-range">{{ tier.range }}</div>
                    <div class="tier-description">{{ tier.description }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h4>经验获取</h4>
              <div class="exp-sources">
                <div 
                  v-for="source in expSources" 
                  :key="source.id"
                  class="source-item"
                >
                  <iconify-icon :icon="source.icon" width="16"></iconify-icon>
                  <div class="source-info">
                    <div class="source-name">{{ source.name }}</div>
                    <div class="source-exp">+{{ source.exp }}经验</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h4>等级特权</h4>
              <div class="level-privileges">
                <div 
                  v-for="privilege in levelPrivileges" 
                  :key="privilege.id"
                  class="privilege-item"
                >
                  <iconify-icon :icon="privilege.icon" width="16"></iconify-icon>
                  <div class="privilege-info">
                    <div class="privilege-name">{{ privilege.name }}</div>
                    <div class="privilege-level">{{ privilege.level }}级解锁</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在加载任务数据...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 状态
const isLoading = ref(false)
const showLevelInfo = ref(false)
const showAllAchievements = ref(false)
const selectedTask = ref(null)
const activeCategory = ref('daily')
const taskFilter = ref('all')

// 用户信息
const userInfo = ref({
  id: 1,
  name: '叶小明',
  avatar: '/mock-avatar-3.jpg',
  totalExp: 2580,
  currentExp: 580,
  nextLevelExp: 1000,
  completedTasks: 45,
  level: {
    number: 8,
    title: '家族守护者',
    description: '积极参与家族事务，贡献突出',
    tier: 'silver'
  }
})

// 任务分类
const taskCategories = ref([
  { id: 'daily', name: '每日任务', icon: 'heroicons:calendar-days' },
  { id: 'weekly', name: '每周任务', icon: 'heroicons:calendar' },
  { id: 'achievement', name: '成就任务', icon: 'heroicons:trophy' },
  { id: 'special', name: '特殊任务', icon: 'heroicons:star' },
  { id: 'genealogy', name: '族谱任务', icon: 'heroicons:users' }
])

// 任务数据
const taskData = ref([
  {
    id: 1,
    category: 'daily',
    title: '每日签到',
    description: '完成每日签到，获得经验和叶语豆奖励',
    longDescription: '每日签到是最基础的任务，连续签到可以获得更多奖励。建议每天都要完成。',
    type: 'instant',
    difficulty: 'easy',
    completed: false,
    locked: false,
    featured: true,
    rewards: [
      { type: 'exp', amount: 10 },
      { type: 'beans', amount: 5 }
    ],
    requirements: [
      { id: 1, description: '点击签到按钮', completed: false }
    ],
    tips: ['每天第一次打开应用时记得签到', '连续签到可以获得额外奖励']
  },
  {
    id: 2,
    category: 'daily',
    title: '浏览族谱',
    description: '查看家族成员信息，了解家族动态',
    type: 'progress',
    difficulty: 'easy',
    completed: false,
    locked: false,
    featured: false,
    currentProgress: 2,
    targetProgress: 5,
    rewards: [
      { type: 'exp', amount: 15 },
      { type: 'beans', amount: 8 }
    ],
    requirements: [
      { id: 1, description: '查看5个家族成员档案', completed: false }
    ],
    tips: ['可以通过族谱页面查看成员信息']
  },
  {
    id: 3,
    category: 'weekly',
    title: '参与家族活动',
    description: '积极参与家族组织的各类活动',
    type: 'progress',
    difficulty: 'medium',
    completed: false,
    locked: false,
    featured: false,
    currentProgress: 1,
    targetProgress: 3,
    deadline: '2024-01-21',
    rewards: [
      { type: 'exp', amount: 50 },
      { type: 'beans', amount: 30 },
      { type: 'money', amount: 10 }
    ],
    requirements: [
      { id: 1, description: '参与3次家族活动', completed: false }
    ],
    tips: ['关注家族群聊中的活动通知', '积极参与可以增进家族感情']
  },
  {
    id: 4,
    category: 'achievement',
    title: '慷慨贡献者',
    description: '累计向家族基金贡献达到1000元',
    type: 'progress',
    difficulty: 'hard',
    completed: false,
    locked: false,
    featured: true,
    currentProgress: 650,
    targetProgress: 1000,
    rewards: [
      { type: 'exp', amount: 200 },
      { type: 'beans', amount: 100 },
      { type: 'title', amount: 1 }
    ],
    requirements: [
      { id: 1, description: '累计贡献1000元', completed: false }
    ],
    tips: ['可以通过基金页面进行贡献', '贡献记录会永久保存']
  },
  {
    id: 5,
    category: 'special',
    title: '清明祭祖',
    description: '在清明节期间完成虚拟祭祖活动',
    type: 'instant',
    difficulty: 'medium',
    completed: false,
    locked: true,
    featured: false,
    deadline: '2024-04-05',
    rewards: [
      { type: 'exp', amount: 100 },
      { type: 'beans', amount: 50 },
      { type: 'special', amount: 1 }
    ],
    requirements: [
      { id: 1, description: '等待清明节开启', completed: false }
    ],
    tips: ['清明节期间自动解锁', '完成后可获得特殊纪念品']
  }
])

// 成就数据
const recentAchievements = ref([
  {
    id: 1,
    title: '新手上路',
    description: '完成第一个任务',
    icon: 'heroicons:academic-cap',
    rarity: 'common',
    unlocked: true,
    unlockedAt: '2024-01-10'
  },
  {
    id: 2,
    title: '坚持不懈',
    description: '连续签到7天',
    icon: 'heroicons:fire',
    rarity: 'rare',
    unlocked: true,
    unlockedAt: '2024-01-15'
  },
  {
    id: 3,
    title: '家族之星',
    description: '获得100个家族成员点赞',
    icon: 'heroicons:star',
    rarity: 'epic',
    unlocked: false,
    unlockedAt: null
  }
])

// 签到数据
const checkinData = ref({
  streak: 5,
  todayChecked: false,
  calendar: [
    { day: 1, checked: true, isToday: false, isFuture: false, reward: { type: 'beans', amount: 5 } },
    { day: 2, checked: true, isToday: false, isFuture: false, reward: { type: 'beans', amount: 5 } },
    { day: 3, checked: true, isToday: false, isFuture: false, reward: { type: 'exp', amount: 10 } },
    { day: 4, checked: true, isToday: false, isFuture: false, reward: { type: 'beans', amount: 8 } },
    { day: 5, checked: true, isToday: false, isFuture: false, reward: { type: 'money', amount: 2 } },
    { day: 6, checked: false, isToday: true, isFuture: false, reward: { type: 'beans', amount: 10 } },
    { day: 7, checked: false, isToday: false, isFuture: true, reward: { type: 'exp', amount: 20 } }
  ]
})

// 等级层级
const levelTiers = ref([
  {
    id: 'bronze',
    name: '青铜家族',
    range: '1-10级',
    description: '家族新成员，正在学习家族文化',
    icon: 'heroicons:shield'
  },
  {
    id: 'silver',
    name: '白银家族',
    range: '11-25级',
    description: '积极参与家族事务的活跃成员',
    icon: 'heroicons:star'
  },
  {
    id: 'gold',
    name: '黄金家族',
    range: '26-50级',
    description: '家族核心成员，贡献卓越',
    icon: 'heroicons:trophy'
  },
  {
    id: 'diamond',
    name: '钻石家族',
    range: '51级以上',
    description: '家族领袖，德高望重',
    icon: 'heroicons:crown'
  }
])

// 经验来源
const expSources = ref([
  { id: 1, name: '每日签到', exp: 10, icon: 'heroicons:calendar-days' },
  { id: 2, name: '完成任务', exp: '10-200', icon: 'heroicons:check-circle' },
  { id: 3, name: '参与活动', exp: 50, icon: 'heroicons:users' },
  { id: 4, name: '基金贡献', exp: 20, icon: 'heroicons:banknotes' },
  { id: 5, name: '分享内容', exp: 15, icon: 'heroicons:share' }
])

// 等级特权
const levelPrivileges = ref([
  { id: 1, name: '自定义头像框', level: 5, icon: 'heroicons:photo' },
  { id: 2, name: '专属称号', level: 10, icon: 'heroicons:academic-cap' },
  { id: 3, name: '优先客服', level: 15, icon: 'heroicons:chat-bubble-left-right' },
  { id: 4, name: '高级功能', level: 20, icon: 'heroicons:cog-6-tooth' },
  { id: 5, name: '管理权限', level: 30, icon: 'heroicons:shield-check' }
])

// 计算属性
const filteredTasks = computed(() => {
  let tasks = taskData.value.filter(task => task.category === activeCategory.value)

  switch (taskFilter.value) {
    case 'available':
      return tasks.filter(task => !task.completed && !task.locked)
    case 'completed':
      return tasks.filter(task => task.completed)
    case 'locked':
      return tasks.filter(task => task.locked)
    default:
      return tasks
  }
})

// 生命周期
onMounted(() => {
  loadTaskData()
})

// 方法
const loadTaskData = async () => {
  isLoading.value = true

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
        userInfo.value = { ...userInfo.value, ...data.userInfo }
        taskData.value = data.tasks || taskData.value
        recentAchievements.value = data.achievements || recentAchievements.value
        checkinData.value = { ...checkinData.value, ...data.checkinData }
      }
    }
  } catch (error) {
    console.error('加载任务数据失败:', error)
    // 使用模拟数据
  } finally {
    isLoading.value = false
  }
}

const getUncompletedCount = (categoryId) => {
  return taskData.value.filter(task =>
    task.category === categoryId && !task.completed && !task.locked
  ).length
}

const getCurrentCategoryName = () => {
  return taskCategories.value.find(cat => cat.id === activeCategory.value)?.name || ''
}

const getNextLevelTitle = () => {
  const nextLevel = userInfo.value.level.number + 1
  // 这里可以根据等级计算下一级称号
  return `Lv.${nextLevel}`
}

const selectTask = (task) => {
  if (!task.locked) {
    selectedTask.value = task
  }
}

const closeTaskDetail = () => {
  selectedTask.value = null
}

const startTask = (task) => {
  if (task.type === 'instant') {
    completeTask(task)
  } else {
    // 跳转到任务相关页面
    navigateToTask(task)
  }
  closeTaskDetail()
}

const completeTask = async (task) => {
  try {
    const response = await fetch(`/api/user/tasks/${task.id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 更新任务状态
        const taskIndex = taskData.value.findIndex(t => t.id === task.id)
        if (taskIndex > -1) {
          taskData.value[taskIndex].completed = true
        }

        // 更新用户经验
        userInfo.value.totalExp += result.data.expGained
        userInfo.value.currentExp += result.data.expGained

        // 检查是否升级
        if (userInfo.value.currentExp >= userInfo.value.nextLevelExp) {
          handleLevelUp()
        }

        appStore.showToast(`任务完成！获得${result.data.expGained}经验`, 'success')
      }
    }
  } catch (error) {
    console.error('完成任务失败:', error)
    appStore.showToast('完成任务失败', 'error')
  }
}

const navigateToTask = (task) => {
  // 根据任务类型跳转到相应页面
  switch (task.category) {
    case 'genealogy':
      router.push('/genealogy')
      break
    case 'special':
      if (task.title.includes('清明')) {
        router.push('/qingming')
      }
      break
    default:
      appStore.showToast('任务页面开发中', 'info')
  }
}

const handleLevelUp = () => {
  userInfo.value.level.number += 1
  userInfo.value.currentExp -= userInfo.value.nextLevelExp
  userInfo.value.nextLevelExp = calculateNextLevelExp(userInfo.value.level.number)

  // 更新等级称号
  updateLevelTitle()

  appStore.showToast(`恭喜升级到${userInfo.value.level.number}级！`, 'success')
}

const calculateNextLevelExp = (level) => {
  // 等级经验计算公式
  return Math.floor(100 * Math.pow(1.2, level - 1))
}

const updateLevelTitle = () => {
  const level = userInfo.value.level.number

  if (level <= 10) {
    userInfo.value.level.tier = 'bronze'
    userInfo.value.level.title = '家族新人'
  } else if (level <= 25) {
    userInfo.value.level.tier = 'silver'
    userInfo.value.level.title = '家族守护者'
  } else if (level <= 50) {
    userInfo.value.level.tier = 'gold'
    userInfo.value.level.title = '家族精英'
  } else {
    userInfo.value.level.tier = 'diamond'
    userInfo.value.level.title = '家族长老'
  }
}

const performCheckin = async () => {
  try {
    const response = await fetch('/api/user/checkin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        checkinData.value.todayChecked = true
        checkinData.value.streak += 1

        // 更新日历
        const todayIndex = checkinData.value.calendar.findIndex(day => day.isToday)
        if (todayIndex > -1) {
          checkinData.value.calendar[todayIndex].checked = true
        }

        // 更新用户经验
        const expGained = result.data.expGained || 10
        userInfo.value.totalExp += expGained
        userInfo.value.currentExp += expGained

        appStore.showToast(`签到成功！获得${expGained}经验`, 'success')
      }
    }
  } catch (error) {
    console.error('签到失败:', error)
    appStore.showToast('签到失败', 'error')
  }
}

const viewTaskDetail = (task) => {
  selectedTask.value = task
}

const viewAchievementDetail = (achievement) => {
  appStore.showToast(`成就：${achievement.title}`, 'info')
}

const filterTasks = () => {
  // 筛选逻辑已在计算属性中实现
}

// 辅助方法
const getTaskIcon = (task) => {
  const iconMap = {
    daily: 'heroicons:calendar-days',
    weekly: 'heroicons:calendar',
    achievement: 'heroicons:trophy',
    special: 'heroicons:star',
    genealogy: 'heroicons:users'
  }

  if (task.completed) return 'heroicons:check-circle'
  if (task.locked) return 'heroicons:lock-closed'

  return iconMap[task.category] || 'heroicons:clipboard-document-list'
}

const getDifficultyText = (difficulty) => {
  const textMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return textMap[difficulty] || '未知'
}

const getRewardIcon = (type) => {
  const iconMap = {
    exp: 'heroicons:academic-cap',
    beans: 'heroicons:currency-dollar',
    money: 'heroicons:banknotes',
    title: 'heroicons:trophy',
    special: 'heroicons:gift'
  }
  return iconMap[type] || 'heroicons:gift'
}

const getRewardUnit = (type) => {
  const unitMap = {
    exp: '经验',
    beans: '叶语豆',
    money: '叶语钱',
    title: '称号',
    special: '特殊奖励'
  }
  return unitMap[type] || ''
}

const getRewardName = (type) => {
  const nameMap = {
    exp: '经验值',
    beans: '叶语豆',
    money: '叶语钱',
    title: '专属称号',
    special: '特殊奖励'
  }
  return nameMap[type] || '未知奖励'
}

const formatDeadline = (deadline) => {
  const date = new Date(deadline)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '已过期'
  if (diffDays === 0) return '今天截止'
  if (diffDays === 1) return '明天截止'
  return `${diffDays}天后截止`
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.task-level-system {
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

.back-btn, .level-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  border-radius: 8px;
}

.level-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 用户等级卡片 */
.user-level-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 16px;
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.level-background {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.level-avatar {
  position: relative;
  width: 64px;
  height: 64px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
}

.level-badge.bronze {
  background: linear-gradient(45deg, #CD7F32, #8D6E63);
}

.level-badge.silver {
  background: linear-gradient(45deg, #C0C0C0, #9E9E9E);
}

.level-badge.gold {
  background: linear-gradient(45deg, #FFD700, #FFA000);
}

.level-badge.diamond {
  background: linear-gradient(45deg, #B9F2FF, #00BCD4);
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
  font-weight: 500;
  margin-bottom: 4px;
  opacity: 0.9;
}

.level-title.bronze { color: #FFE0B2; }
.level-title.silver { color: #F5F5F5; }
.level-title.gold { color: #FFF9C4; }
.level-title.diamond { color: #E0F7FA; }

.level-description {
  font-size: 12px;
  opacity: 0.8;
}

.level-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  opacity: 0.8;
}

.level-progress {
  margin-top: 16px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.current-exp {
  font-weight: 600;
}

.progress-separator {
  opacity: 0.6;
}

.next-level-exp {
  opacity: 0.8;
}

.next-level-text {
  margin-left: auto;
  opacity: 0.8;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA000);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 通用区域样式 */
.task-categories,
.task-list-container,
.achievement-system,
.daily-checkin {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 任务分类 */
.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
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

.category-tab:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.category-tab.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.task-count {
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.category-tab.active .task-count {
  background: rgba(255, 255, 255, 0.3);
}

/* 任务列表 */
.task-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.task-list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.task-filters select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
}

.task-item:hover {
  background: #f0f0f0;
  border-color: #07c160;
}

.task-item.completed {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.task-item.locked {
  background: rgba(158, 158, 158, 0.1);
  border-color: #9E9E9E;
  opacity: 0.6;
  cursor: not-allowed;
}

.task-item.featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #FFD700, #FFA000);
  border-radius: 8px 8px 0 0;
}

.task-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;
}

.task-icon.easy {
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
}

.task-icon.medium {
  background: linear-gradient(45deg, #FF9800, #FFC107);
}

.task-icon.hard {
  background: linear-gradient(45deg, #F44336, #E91E63);
}

.featured-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #FFD700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.task-content {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.task-difficulty {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.task-difficulty.easy {
  background: #4CAF50;
}

.task-difficulty.medium {
  background: #FF9800;
}

.task-difficulty.hard {
  background: #F44336;
}

.task-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.task-progress {
  margin-bottom: 8px;
}

.task-progress .progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.task-progress .progress-fill {
  height: 100%;
  background: #07c160;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 10px;
  color: #999;
}

.task-rewards {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reward-list {
  display: flex;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 8px;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #ff6b6b;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn.available {
  background: #07c160;
  color: white;
}

.action-btn.available:hover {
  background: #06a552;
}

.action-btn.completed {
  background: #4CAF50;
  color: white;
  cursor: not-allowed;
}

.action-btn.locked {
  background: #9E9E9E;
  color: white;
  cursor: not-allowed;
}

/* 成就系统 */
.achievement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.achievement-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
}

.achievement-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border: 1px solid transparent;
}

.achievement-item:hover {
  background: #f0f0f0;
  border-color: #07c160;
}

.achievement-item.unlocked {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.achievement-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;
}

.achievement-icon.common {
  background: linear-gradient(45deg, #9E9E9E, #757575);
}

.achievement-icon.rare {
  background: linear-gradient(45deg, #2196F3, #1976D2);
}

.achievement-icon.epic {
  background: linear-gradient(45deg, #9C27B0, #7B1FA2);
}

.achievement-icon.legendary {
  background: linear-gradient(45deg, #FF9800, #F57C00);
}

.unlock-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.achievement-info {
  flex: 1;
}

.achievement-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.achievement-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.unlock-date {
  font-size: 10px;
  color: #999;
}

/* 每日签到 */
.checkin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.checkin-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.checkin-streak {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

.checkin-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.checkin-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 6px;
  background: #f9f9f9;
  border: 1px solid transparent;
  position: relative;
}

.checkin-day.checked {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.checkin-day.today {
  background: rgba(7, 193, 96, 0.1);
  border-color: #07c160;
}

.checkin-day.future {
  opacity: 0.5;
}

.day-number {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.day-reward {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #666;
}

.check-mark {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.checkin-actions {
  text-align: center;
}

.checkin-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.checkin-btn:not(.checked) {
  background: #07c160;
  color: white;
}

.checkin-btn:not(.checked):hover {
  background: #06a552;
}

.checkin-btn.checked {
  background: #4CAF50;
  color: white;
  cursor: not-allowed;
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

.task-detail-modal,
.level-info-modal {
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

/* 任务详情 */
.task-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.detail-section p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.long-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.task-requirements {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.requirement-item.completed {
  color: #4CAF50;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.reward-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  text-align: center;
}

.reward-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-amount {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.reward-name {
  font-size: 10px;
  color: #666;
}

.task-tips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.start-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 等级信息 */
.level-system-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.level-tiers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tier-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.tier-item.bronze {
  background: rgba(205, 127, 50, 0.1);
  border-color: #CD7F32;
}

.tier-item.silver {
  background: rgba(192, 192, 192, 0.1);
  border-color: #C0C0C0;
}

.tier-item.gold {
  background: rgba(255, 215, 0, 0.1);
  border-color: #FFD700;
}

.tier-item.diamond {
  background: rgba(0, 188, 212, 0.1);
  border-color: #00BCD4;
}

.tier-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tier-info {
  flex: 1;
}

.tier-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.tier-range {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.tier-description {
  font-size: 11px;
  color: #999;
}

.exp-sources,
.level-privileges {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item,
.privilege-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.source-info,
.privilege-info {
  flex: 1;
}

.source-name,
.privilege-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 2px;
}

.source-exp,
.privilege-level {
  font-size: 10px;
  color: #666;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 2000;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  color: #07c160;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .level-background {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .level-stats {
    justify-content: center;
  }

  .category-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .reward-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .checkin-calendar {
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .checkin-day {
    padding: 6px 2px;
  }

  .level-tiers {
    gap: 6px;
  }

  .tier-item {
    padding: 8px;
  }
}
</style>

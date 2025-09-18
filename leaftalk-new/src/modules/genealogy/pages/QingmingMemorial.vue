<template>
  <div class="qingming-memorial">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">清明祭祖</h1>
      <button @click="showActivityInfo = true" class="info-btn">
        <iconify-icon icon="heroicons:information-circle" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 清明节主题横幅 -->
    <div class="qingming-banner">
      <div class="banner-background">
        <div class="banner-content">
          <div class="banner-text">
            <h2>{{ qingmingInfo.title }}</h2>
            <p>{{ qingmingInfo.subtitle }}</p>
            <div class="countdown" v-if="qingmingInfo.countdown > 0">
              <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
              <span>距离清明节还有 {{ qingmingInfo.countdown }} 天</span>
            </div>
          </div>
          <div class="banner-decoration">
            <iconify-icon icon="mdi:flower-lotus" width="48"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动统计 -->
    <div class="activity-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:users" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activityStats.totalParticipants }}</div>
            <div class="stat-label">参与人数</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">
            <iconify-icon icon="mdi:flower" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activityStats.totalOfferings }}</div>
            <div class="stat-label">祭品献上</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:heart" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activityStats.totalWishes }}</div>
            <div class="stat-label">祈福心愿</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:gift" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activityStats.totalRewards }}</div>
            <div class="stat-label">获得奖励</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 祭祖对象选择 -->
    <div class="ancestor-selection">
      <div class="section-header">
        <h3>选择祭祖对象</h3>
        <div class="ancestor-count">{{ ancestors.length }}位先祖</div>
      </div>

      <div class="ancestor-list">
        <div
          v-for="ancestor in ancestors"
          :key="ancestor.id"
          class="ancestor-item"
          :class="{ selected: selectedAncestor?.id === ancestor.id }"
          @click="selectAncestor(ancestor)"
        >
          <div class="ancestor-avatar">
            <img :src="ancestor.avatar || '/default-avatar.png'" :alt="ancestor.name" />
            <div class="memorial-badge">
              <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
            </div>
          </div>
          <div class="ancestor-info">
            <div class="ancestor-name">{{ ancestor.name }}</div>
            <div class="ancestor-dates">
              {{ formatDate(ancestor.birthDate) }} - {{ formatDate(ancestor.deathDate) }}
            </div>
            <div class="ancestor-relation">{{ ancestor.relation }}</div>
          </div>
          <div class="ancestor-status">
            <div v-if="ancestor.hasMemorial" class="status-badge completed">
              <iconify-icon icon="heroicons:check" width="12"></iconify-icon>
              <span>已祭祀</span>
            </div>
            <div v-else class="status-badge pending">
              <iconify-icon icon="heroicons:clock" width="12"></iconify-icon>
              <span>待祭祀</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 虚拟祭祀场景 -->
    <div v-if="selectedAncestor" class="memorial-scene">
      <div class="section-header">
        <h3>虚拟祭祀</h3>
        <div class="scene-info">为 {{ selectedAncestor.name }} 祭祀</div>
      </div>

      <div class="scene-container">
        <div class="scene-background">
          <div class="altar">
            <div class="ancestor-portrait">
              <img :src="selectedAncestor.avatar || '/default-avatar.png'" :alt="selectedAncestor.name" />
              <div class="portrait-frame"></div>
            </div>
            <div class="altar-table">
              <div class="offering-area">
                <div
                  v-for="offering in currentOfferings"
                  :key="offering.id"
                  class="offering-item"
                  :style="{ left: offering.x + '%', top: offering.y + '%' }"
                >
                  <img :src="offering.icon" :alt="offering.name" />
                  <div class="offering-count">{{ offering.count }}</div>
                </div>
              </div>
            </div>
            <div class="incense-area">
              <div
                v-for="incense in activeIncense"
                :key="incense.id"
                class="incense-stick"
                :class="{ burning: incense.burning }"
              >
                <div class="incense-smoke" v-if="incense.burning"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 祭祀操作 -->
        <div class="memorial-actions">
          <div class="action-grid">
            <button
              @click="performAction('bow')"
              class="action-btn bow"
              :disabled="actionCooldown.bow > 0"
            >
              <iconify-icon icon="mdi:human-greeting" width="24"></iconify-icon>
              <span>鞠躬</span>
              <div v-if="actionCooldown.bow > 0" class="cooldown">{{ actionCooldown.bow }}s</div>
            </button>

            <button
              @click="performAction('incense')"
              class="action-btn incense"
              :disabled="actionCooldown.incense > 0"
            >
              <iconify-icon icon="mdi:fire" width="24"></iconify-icon>
              <span>上香</span>
              <div v-if="actionCooldown.incense > 0" class="cooldown">{{ actionCooldown.incense }}s</div>
            </button>

            <button
              @click="showOfferingModal = true"
              class="action-btn offering"
            >
              <iconify-icon icon="mdi:flower" width="24"></iconify-icon>
              <span>献祭品</span>
            </button>

            <button
              @click="showWishModal = true"
              class="action-btn wish"
            >
              <iconify-icon icon="heroicons:heart" width="24"></iconify-icon>
              <span>许心愿</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 清明节特色活动 -->
    <div class="special-activities">
      <div class="section-header">
        <h3>清明节特色活动</h3>
        <div class="activity-time">活动时间：{{ qingmingInfo.activityPeriod }}</div>
      </div>

      <div class="activity-list">
        <div
          v-for="activity in specialActivities"
          :key="activity.id"
          class="activity-item"
          :class="{ completed: activity.completed, locked: activity.locked }"
          @click="joinActivity(activity)"
        >
          <div class="activity-icon">
            <iconify-icon :icon="activity.icon" width="32"></iconify-icon>
            <div v-if="activity.completed" class="completion-mark">
              <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
            </div>
          </div>
          <div class="activity-info">
            <div class="activity-name">{{ activity.name }}</div>
            <div class="activity-desc">{{ activity.description }}</div>
            <div class="activity-progress" v-if="activity.progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (activity.current / activity.target * 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ activity.current }}/{{ activity.target }}</span>
            </div>
          </div>
          <div class="activity-reward">
            <div class="reward-items">
              <div v-for="reward in activity.rewards" :key="reward.type" class="reward-item">
                <iconify-icon :icon="getRewardIcon(reward.type)" width="16"></iconify-icon>
                <span>{{ reward.amount }}</span>
              </div>
            </div>
            <button
              v-if="activity.completed && !activity.claimed"
              @click.stop="claimActivityReward(activity)"
              class="claim-btn"
            >
              领取
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 家族祭祀排行榜 -->
    <div class="family-ranking">
      <div class="section-header">
        <h3>家族祭祀排行榜</h3>
        <div class="ranking-period">本次清明节</div>
      </div>

      <div class="ranking-list">
        <div
          v-for="(member, index) in familyRanking"
          :key="member.id"
          class="ranking-item"
          :class="{ highlight: member.id === currentUserId }"
        >
          <div class="ranking-position">
            <div class="position-number" :class="getRankClass(index + 1)">{{ index + 1 }}</div>
          </div>
          <div class="member-avatar">
            <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" />
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-stats">
              <span class="stat-item">
                <iconify-icon icon="mdi:flower" width="12"></iconify-icon>
                {{ member.offeringCount }}次祭祀
              </span>
              <span class="stat-item">
                <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
                {{ member.wishCount }}个心愿
              </span>
            </div>
          </div>
          <div class="member-score">
            <div class="score-value">{{ member.totalScore }}</div>
            <div class="score-label">积分</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 献祭品弹窗 -->
    <div v-if="showOfferingModal" class="modal-overlay" @click="showOfferingModal = false">
      <div class="offering-modal" @click.stop>
        <div class="modal-header">
          <h3>选择祭品</h3>
          <button @click="showOfferingModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="modal-content">
          <div class="offering-categories">
            <button
              v-for="category in offeringCategories"
              :key="category.id"
              @click="selectedOfferingCategory = category.id"
              :class="{ active: selectedOfferingCategory === category.id }"
              class="category-btn"
            >
              <iconify-icon :icon="category.icon" width="16"></iconify-icon>
              <span>{{ category.name }}</span>
            </button>
          </div>

          <div class="offering-grid">
            <div
              v-for="offering in filteredOfferings"
              :key="offering.id"
              class="offering-option"
              :class="{ selected: selectedOfferings.includes(offering.id) }"
              @click="toggleOffering(offering)"
            >
              <div class="offering-icon">
                <img :src="offering.icon" :alt="offering.name" />
              </div>
              <div class="offering-name">{{ offering.name }}</div>
              <div class="offering-price">
                <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
                <span>{{ offering.price }}豆</span>
              </div>
              <div v-if="selectedOfferings.includes(offering.id)" class="selection-mark">
                <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <div class="total-cost">
            <span>总计：{{ totalOfferingCost }}叶语豆</span>
          </div>
          <button @click="showOfferingModal = false" class="cancel-btn">取消</button>
          <button @click="confirmOffering" class="confirm-btn" :disabled="selectedOfferings.length === 0">
            献祭品
          </button>
        </div>
      </div>
    </div>

    <!-- 许心愿弹窗 -->
    <div v-if="showWishModal" class="modal-overlay" @click="showWishModal = false">
      <div class="wish-modal" @click.stop>
        <div class="modal-header">
          <h3>许下心愿</h3>
          <button @click="showWishModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="modal-content">
          <div class="wish-form">
            <div class="form-group">
              <label>心愿类型</label>
              <select v-model="wishForm.type">
                <option value="">选择心愿类型</option>
                <option value="health">身体健康</option>
                <option value="career">事业顺利</option>
                <option value="family">家庭和睦</option>
                <option value="study">学业进步</option>
                <option value="wealth">财运亨通</option>
                <option value="peace">平安顺遂</option>
                <option value="other">其他心愿</option>
              </select>
            </div>

            <div class="form-group">
              <label>心愿内容</label>
              <textarea
                v-model="wishForm.content"
                placeholder="请写下您的心愿，先祖会保佑您..."
                rows="4"
                maxlength="200"
              ></textarea>
              <div class="char-count">{{ wishForm.content.length }}/200</div>
            </div>

            <div class="form-group">
              <label>是否公开</label>
              <div class="privacy-options">
                <label class="privacy-option">
                  <input type="radio" v-model="wishForm.isPublic" :value="true" />
                  <span>公开心愿（其他家族成员可见）</span>
                </label>
                <label class="privacy-option">
                  <input type="radio" v-model="wishForm.isPublic" :value="false" />
                  <span>私密心愿（仅自己可见）</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showWishModal = false" class="cancel-btn">取消</button>
          <button @click="submitWish" class="submit-btn" :disabled="!wishForm.type || !wishForm.content.trim()">
            许愿
          </button>
        </div>
      </div>
    </div>

    <!-- 活动信息弹窗 -->
    <div v-if="showActivityInfo" class="modal-overlay" @click="showActivityInfo = false">
      <div class="activity-info-modal" @click.stop>
        <div class="modal-header">
          <h3>清明节祭祖活动</h3>
          <button @click="showActivityInfo = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="modal-content">
          <div class="activity-description">
            <h4>活动介绍</h4>
            <p>清明节是中华民族传统的祭祖节日，叶语平台特别推出虚拟祭祖活动，让身在异乡的家族成员也能参与祭祀，表达对先祖的敬意和思念。</p>

            <h4>活动内容</h4>
            <ul>
              <li>虚拟祭祀：为先祖献花、上香、鞠躬</li>
              <li>许愿祈福：向先祖许下心愿，祈求保佑</li>
              <li>家族排行：与家族成员一起参与，增进感情</li>
              <li>特色任务：完成清明节专属任务获得奖励</li>
            </ul>

            <h4>活动奖励</h4>
            <ul>
              <li>叶语豆奖励：参与祭祀获得叶语豆</li>
              <li>专属称号：活跃参与者获得"孝心传承"称号</li>
              <li>纪念徽章：完成所有任务获得清明节纪念徽章</li>
            </ul>

            <h4>活动时间</h4>
            <p>{{ qingmingInfo.activityPeriod }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)
const currentUserId = ref(1)

// 状态
const showOfferingModal = ref(false)
const showWishModal = ref(false)
const showActivityInfo = ref(false)
const selectedAncestor = ref(null)
const selectedOfferingCategory = ref('flowers')
const selectedOfferings = ref([])

// 动作冷却时间
const actionCooldown = reactive({
  bow: 0,
  incense: 0
})

// 清明节信息
const qingmingInfo = ref({
  title: '2024年清明节祭祖',
  subtitle: '慎终追远，民德归厚',
  countdown: 15, // 距离清明节天数
  activityPeriod: '2024年4月1日 - 4月10日'
})

// 活动统计
const activityStats = ref({
  totalParticipants: 1256,
  totalOfferings: 3428,
  totalWishes: 892,
  totalRewards: 15680
})

// 先祖列表
const ancestors = ref([
  {
    id: 1,
    name: '叶德华',
    avatar: '/mock-avatar-1.jpg',
    birthDate: '1920-01-01',
    deathDate: '1995-12-31',
    relation: '祖父',
    hasMemorial: false
  },
  {
    id: 2,
    name: '王秀英',
    avatar: '/mock-avatar-5.jpg',
    birthDate: '1925-03-15',
    deathDate: '1998-08-20',
    relation: '祖母',
    hasMemorial: true
  },
  {
    id: 3,
    name: '叶志强',
    avatar: '/mock-avatar-6.jpg',
    birthDate: '1890-05-10',
    deathDate: '1960-11-05',
    relation: '曾祖父',
    hasMemorial: false
  }
])

// 当前祭品
const currentOfferings = ref([])

// 活跃香火
const activeIncense = ref([])

// 特色活动
const specialActivities = ref([
  {
    id: 1,
    name: '孝心传承',
    description: '为3位先祖完成祭祀',
    icon: 'heroicons:heart',
    current: 1,
    target: 3,
    progress: true,
    rewards: [
      { type: 'beans', amount: 100 },
      { type: 'title', amount: 1 }
    ],
    completed: false,
    claimed: false,
    locked: false
  },
  {
    id: 2,
    name: '香火不断',
    description: '累计上香10次',
    icon: 'mdi:fire',
    current: 6,
    target: 10,
    progress: true,
    rewards: [
      { type: 'beans', amount: 50 },
      { type: 'exp', amount: 100 }
    ],
    completed: false,
    claimed: false,
    locked: false
  },
  {
    id: 3,
    name: '花开富贵',
    description: '献花20束',
    icon: 'mdi:flower',
    current: 15,
    target: 20,
    progress: true,
    rewards: [
      { type: 'beans', amount: 80 },
      { type: 'badge', amount: 1 }
    ],
    completed: false,
    claimed: false,
    locked: false
  },
  {
    id: 4,
    name: '心愿成真',
    description: '许下5个心愿',
    icon: 'heroicons:star',
    current: 3,
    target: 5,
    progress: true,
    rewards: [
      { type: 'beans', amount: 60 },
      { type: 'privilege', amount: 1 }
    ],
    completed: false,
    claimed: false,
    locked: false
  }
])

// 家族排行榜
const familyRanking = ref([
  {
    id: 2,
    name: '叶建国',
    avatar: '/mock-avatar-2.jpg',
    offeringCount: 15,
    wishCount: 8,
    totalScore: 1250
  },
  {
    id: 1,
    name: '叶小明',
    avatar: '/mock-avatar-3.jpg',
    offeringCount: 12,
    wishCount: 6,
    totalScore: 980
  },
  {
    id: 3,
    name: '叶小红',
    avatar: '/mock-avatar-4.jpg',
    offeringCount: 10,
    wishCount: 5,
    totalScore: 850
  }
])

// 祭品分类
const offeringCategories = ref([
  { id: 'flowers', name: '鲜花', icon: 'mdi:flower' },
  { id: 'fruits', name: '水果', icon: 'mdi:food-apple' },
  { id: 'incense', name: '香烛', icon: 'mdi:fire' },
  { id: 'food', name: '供品', icon: 'mdi:food' },
  { id: 'paper', name: '纸钱', icon: 'mdi:cash-multiple' }
])

// 祭品选项
const offeringOptions = ref([
  // 鲜花类
  { id: 1, name: '白菊花', icon: '/offering-chrysanthemum.png', price: 10, category: 'flowers' },
  { id: 2, name: '黄菊花', icon: '/offering-yellow-chrysanthemum.png', price: 10, category: 'flowers' },
  { id: 3, name: '康乃馨', icon: '/offering-carnation.png', price: 15, category: 'flowers' },
  { id: 4, name: '百合花', icon: '/offering-lily.png', price: 20, category: 'flowers' },

  // 水果类
  { id: 5, name: '苹果', icon: '/offering-apple.png', price: 8, category: 'fruits' },
  { id: 6, name: '橘子', icon: '/offering-orange.png', price: 8, category: 'fruits' },
  { id: 7, name: '香蕉', icon: '/offering-banana.png', price: 6, category: 'fruits' },
  { id: 8, name: '葡萄', icon: '/offering-grape.png', price: 12, category: 'fruits' },

  // 香烛类
  { id: 9, name: '檀香', icon: '/offering-sandalwood.png', price: 25, category: 'incense' },
  { id: 10, name: '蜡烛', icon: '/offering-candle.png', price: 15, category: 'incense' },
  { id: 11, name: '莲花香', icon: '/offering-lotus-incense.png', price: 30, category: 'incense' },

  // 供品类
  { id: 12, name: '米饭', icon: '/offering-rice.png', price: 5, category: 'food' },
  { id: 13, name: '酒水', icon: '/offering-wine.png', price: 20, category: 'food' },
  { id: 14, name: '糕点', icon: '/offering-cake.png', price: 18, category: 'food' },

  // 纸钱类
  { id: 15, name: '金元宝', icon: '/offering-gold-ingot.png', price: 50, category: 'paper' },
  { id: 16, name: '纸钱', icon: '/offering-paper-money.png', price: 30, category: 'paper' }
])

// 心愿表单
const wishForm = reactive({
  type: '',
  content: '',
  isPublic: true
})

// 计算属性
const filteredOfferings = computed(() => {
  return offeringOptions.value.filter(offering => offering.category === selectedOfferingCategory.value)
})

const totalOfferingCost = computed(() => {
  return selectedOfferings.value.reduce((total, offeringId) => {
    const offering = offeringOptions.value.find(o => o.id === offeringId)
    return total + (offering ? offering.price : 0)
  }, 0)
})

// 定时器
let cooldownTimer = null

// 生命周期
onMounted(() => {
  loadQingmingData()
  startCooldownTimer()
})

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }
})

// 方法
const loadQingmingData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/qingming`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const data = result.data
        ancestors.value = data.ancestors || ancestors.value
        activityStats.value = data.stats || activityStats.value
        specialActivities.value = data.activities || specialActivities.value
        familyRanking.value = data.ranking || familyRanking.value
      }
    }
  } catch (error) {
    console.error('加载清明节数据失败:', error)
    // 使用模拟数据
  }
}

const selectAncestor = (ancestor) => {
  selectedAncestor.value = ancestor
  loadAncestorOfferings(ancestor.id)
}

const loadAncestorOfferings = async (ancestorId) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/ancestors/${ancestorId}/offerings`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        currentOfferings.value = result.data.offerings || []
        activeIncense.value = result.data.incense || []
      }
    }
  } catch (error) {
    console.error('加载祭品失败:', error)
    // 使用默认数据
    currentOfferings.value = []
    activeIncense.value = []
  }
}

const performAction = async (actionType) => {
  if (!selectedAncestor.value || actionCooldown[actionType] > 0) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/qingming/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        ancestorId: selectedAncestor.value.id,
        actionType
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 设置冷却时间
        if (actionType === 'bow') {
          actionCooldown.bow = 5
          showActionEffect('bow')
        } else if (actionType === 'incense') {
          actionCooldown.incense = 10
          addIncense()
          showActionEffect('incense')
        }

        // 更新活动进度
        updateActivityProgress(actionType)

        appStore.showToast(getActionMessage(actionType), 'success')
      }
    }
  } catch (error) {
    console.error('执行祭祀动作失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const addIncense = () => {
  const newIncense = {
    id: Date.now(),
    burning: true
  }
  activeIncense.value.push(newIncense)

  // 3秒后香火熄灭
  setTimeout(() => {
    const index = activeIncense.value.findIndex(i => i.id === newIncense.id)
    if (index > -1) {
      activeIncense.value[index].burning = false
    }
  }, 3000)
}

const showActionEffect = (actionType) => {
  // 显示动作特效（简化实现）
  const effects = {
    bow: '🙏 虔诚鞠躬',
    incense: '🔥 香火缭绕'
  }

  // 可以在这里添加更复杂的动画效果
  console.log(`执行动作: ${effects[actionType]}`)
}

const getActionMessage = (actionType) => {
  const messages = {
    bow: '向先祖虔诚鞠躬，获得5叶语豆',
    incense: '为先祖点燃心香，获得10叶语豆'
  }
  return messages[actionType] || '祭祀完成'
}

const toggleOffering = (offering) => {
  const index = selectedOfferings.value.indexOf(offering.id)
  if (index > -1) {
    selectedOfferings.value.splice(index, 1)
  } else {
    selectedOfferings.value.push(offering.id)
  }
}

const confirmOffering = async () => {
  if (selectedOfferings.value.length === 0) return

  try {
    const offerings = selectedOfferings.value.map(id => {
      const offering = offeringOptions.value.find(o => o.id === id)
      return {
        id: offering.id,
        name: offering.name,
        icon: offering.icon,
        price: offering.price
      }
    })

    const response = await fetch(`/api/genealogy/${genealogyId.value}/qingming/offering`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        ancestorId: selectedAncestor.value.id,
        offerings
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 添加祭品到场景
        offerings.forEach((offering, index) => {
          currentOfferings.value.push({
            id: Date.now() + index,
            name: offering.name,
            icon: offering.icon,
            count: 1,
            x: Math.random() * 60 + 20, // 随机位置
            y: Math.random() * 40 + 30
          })
        })

        // 更新活动进度
        updateActivityProgress('offering', selectedOfferings.value.length)

        appStore.showToast(`献祭品成功，消耗${totalOfferingCost.value}叶语豆`, 'success')
        showOfferingModal.value = false
        selectedOfferings.value = []
      }
    }
  } catch (error) {
    console.error('献祭品失败:', error)
    appStore.showToast('献祭品失败', 'error')
  }
}

const submitWish = async () => {
  if (!wishForm.type || !wishForm.content.trim()) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/qingming/wish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        ancestorId: selectedAncestor.value.id,
        type: wishForm.type,
        content: wishForm.content,
        isPublic: wishForm.isPublic
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 更新活动进度
        updateActivityProgress('wish')

        appStore.showToast('心愿已许下，先祖会保佑您', 'success')
        showWishModal.value = false
        resetWishForm()
      }
    }
  } catch (error) {
    console.error('许愿失败:', error)
    appStore.showToast('许愿失败', 'error')
  }
}

const updateActivityProgress = (actionType, count = 1) => {
  const activityMap = {
    bow: ['孝心传承'],
    incense: ['香火不断', '孝心传承'],
    offering: ['花开富贵', '孝心传承'],
    wish: ['心愿成真']
  }

  const relatedActivities = activityMap[actionType] || []

  relatedActivities.forEach(activityName => {
    const activity = specialActivities.value.find(a => a.name === activityName)
    if (activity && !activity.completed) {
      activity.current = Math.min(activity.current + count, activity.target)
      if (activity.current >= activity.target) {
        activity.completed = true
        appStore.showToast(`完成活动：${activity.name}`, 'success')
      }
    }
  })
}

const joinActivity = (activity) => {
  if (activity.locked) {
    appStore.showToast('活动尚未解锁', 'warning')
    return
  }

  if (activity.completed && !activity.claimed) {
    claimActivityReward(activity)
  } else {
    appStore.showToast(`活动进度：${activity.current}/${activity.target}`, 'info')
  }
}

const claimActivityReward = async (activity) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/qingming/claim/${activity.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        activity.claimed = true

        const rewardText = activity.rewards.map(r => `${r.amount}${getRewardUnit(r.type)}`).join('、')
        appStore.showToast(`获得奖励：${rewardText}`, 'success')
      }
    }
  } catch (error) {
    console.error('领取奖励失败:', error)
    appStore.showToast('领取失败', 'error')
  }
}

const startCooldownTimer = () => {
  cooldownTimer = setInterval(() => {
    Object.keys(actionCooldown).forEach(key => {
      if (actionCooldown[key] > 0) {
        actionCooldown[key]--
      }
    })
  }, 1000)
}

const resetWishForm = () => {
  Object.assign(wishForm, {
    type: '',
    content: '',
    isPublic: true
  })
}

// 辅助方法
const getRankClass = (position) => {
  if (position === 1) return 'gold'
  if (position === 2) return 'silver'
  if (position === 3) return 'bronze'
  return 'normal'
}

const getRewardIcon = (type) => {
  const icons = {
    beans: 'heroicons:sparkles',
    exp: 'heroicons:star',
    title: 'heroicons:trophy',
    badge: 'heroicons:shield-check',
    privilege: 'heroicons:key'
  }
  return icons[type] || 'heroicons:gift'
}

const getRewardUnit = (type) => {
  const units = {
    beans: '豆',
    exp: '经验',
    title: '称号',
    badge: '徽章',
    privilege: '特权'
  }
  return units[type] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.qingming-memorial {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8f0 0%, #f5f5f5 100%);
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .info-btn {
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

.info-btn {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 清明节横幅 */
.qingming-banner {
  margin: 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.banner-background {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%);
  position: relative;
  overflow: hidden;
}

.banner-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/qingming-pattern.png') repeat;
  opacity: 0.1;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  color: white;
  position: relative;
  z-index: 1;
}

.banner-text h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.banner-text p {
  margin: 0 0 12px 0;
  font-size: 14px;
  opacity: 0.9;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
}

.banner-decoration {
  opacity: 0.3;
}

/* 活动统计 */
.activity-stats {
  margin: 0 16px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  background: white;
  padding: 16px 8px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(45deg, #4CAF50, #66BB6A);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 通用区域样式 */
.ancestor-selection,
.memorial-scene,
.special-activities,
.family-ranking {
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

.ancestor-count,
.scene-info,
.activity-time,
.ranking-period {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

/* 先祖选择 */
.ancestor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ancestor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.ancestor-item:hover {
  background: #f0f0f0;
}

.ancestor-item.selected {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.ancestor-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.ancestor-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(76, 175, 80, 0.3);
}

.memorial-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #ff6b6b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.ancestor-info {
  flex: 1;
}

.ancestor-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.ancestor-dates {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.ancestor-relation {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 500;
}

.ancestor-status {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.status-badge.pending {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

/* 虚拟祭祀场景 */
.scene-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scene-background {
  background: linear-gradient(180deg, #e8f5e8 0%, #f0f8f0 100%);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  min-height: 200px;
}

.altar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.ancestor-portrait {
  position: relative;
  width: 80px;
  height: 80px;
}

.ancestor-portrait img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.portrait-frame {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 3px solid #FFD700;
  border-radius: 12px;
  background: linear-gradient(45deg, #FFD700, #FFA000);
  z-index: -1;
}

.altar-table {
  width: 100%;
  height: 80px;
  background: linear-gradient(180deg, #8D6E63 0%, #6D4C41 100%);
  border-radius: 8px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.offering-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.offering-item {
  position: absolute;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
}

.offering-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.offering-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 6px;
  min-width: 12px;
  text-align: center;
}

.incense-area {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.incense-stick {
  width: 4px;
  height: 40px;
  background: #8D6E63;
  border-radius: 2px;
  position: relative;
}

.incense-stick.burning {
  background: linear-gradient(180deg, #FF5722 0%, #8D6E63 50%);
}

.incense-smoke {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
  border-radius: 1px;
  animation: smoke 2s infinite;
}

@keyframes smoke {
  0% { opacity: 0.8; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

/* 祭祀操作 */
.memorial-actions {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.bow {
  background: linear-gradient(45deg, #2196F3, #1976D2);
}

.action-btn.incense {
  background: linear-gradient(45deg, #FF5722, #D84315);
}

.action-btn.offering {
  background: linear-gradient(45deg, #4CAF50, #388E3C);
}

.action-btn.wish {
  background: linear-gradient(45deg, #9C27B0, #7B1FA2);
}

.action-btn span {
  font-size: 14px;
  font-weight: 500;
}

.cooldown {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

/* 特色活动 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #f0f0f0;
}

.activity-item.completed {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.activity-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.activity-icon {
  position: relative;
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #4CAF50, #66BB6A);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.completion-mark {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #FFD700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.activity-info {
  flex: 1;
}

.activity-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.activity-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.activity-reward {
  text-align: center;
}

.reward-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
  justify-content: center;
}

.claim-btn {
  padding: 4px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
}

/* 家族排行榜 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.ranking-item.highlight {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.ranking-position {
  width: 32px;
  text-align: center;
}

.position-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.position-number.gold {
  background: linear-gradient(45deg, #FFD700, #FFA000);
}

.position-number.silver {
  background: linear-gradient(45deg, #C0C0C0, #9E9E9E);
}

.position-number.bronze {
  background: linear-gradient(45deg, #CD7F32, #8D6E63);
}

.position-number.normal {
  background: #999;
}

.member-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.member-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.member-score {
  text-align: center;
}

.score-value {
  font-size: 16px;
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 2px;
}

.score-label {
  font-size: 11px;
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

.offering-modal,
.wish-modal,
.activity-info-modal {
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

/* 祭品选择 */
.offering-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
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
}

.category-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.offering-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.offering-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.offering-option:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.offering-option.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.offering-icon {
  width: 32px;
  height: 32px;
}

.offering-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.offering-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.offering-price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #FF9800;
}

.selection-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* 心愿表单 */
.wish-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
}

.form-group select {
  height: 44px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
}

.privacy-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.privacy-option input[type="radio"] {
  accent-color: #4CAF50;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.total-cost {
  flex: 1;
  font-size: 14px;
  color: #FF9800;
  font-weight: 500;
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

.confirm-btn,
.submit-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #4CAF50;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn:disabled,
.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 活动信息 */
.activity-description h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.activity-description p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.activity-description ul {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.activity-description li {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
}
</style>
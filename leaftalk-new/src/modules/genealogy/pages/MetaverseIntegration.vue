<template>
  <div class="metaverse-integration-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="元宇宙家族" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 功能分类标签 -->
    <div class="function-tabs">
      <div 
        v-for="tab in functionTabs" 
        :key="tab.value"
        class="function-tab"
        :class="{ active: currentFunction === tab.value }"
        @click="setFunction(tab.value)"
      >
        <iconify-icon :icon="tab.icon" width="18"></iconify-icon>
        <span>{{ tab.label }}</span>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="metaverse-content">
      <!-- 虚拟祠堂 -->
      <div v-if="currentFunction === 'shrine'" class="shrine-section">
        <div class="shrine-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:building-library" width="32" class="intro-icon"></iconify-icon>
            <h3>虚拟家族祠堂</h3>
            <p>在元宇宙中建立专属的家族祠堂，传承家族文化</p>
          </div>
        </div>

        <div class="shrine-preview">
          <div class="preview-card">
            <div class="preview-image">
              <img src="/metaverse/shrine-preview.jpg" alt="虚拟祠堂预览" />
              <div class="preview-overlay">
                <button @click="enterShrine" class="enter-btn">
                  <iconify-icon icon="heroicons:eye" width="20"></iconify-icon>
                  进入祠堂
                </button>
              </div>
            </div>
            <div class="preview-info">
              <h4>{{ familyShrine.name }}</h4>
              <p>{{ familyShrine.description }}</p>
              <div class="shrine-stats">
                <div class="stat-item">
                  <iconify-icon icon="heroicons:users" width="14"></iconify-icon>
                  <span>{{ familyShrine.memberCount }}位族人</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                  <span>{{ familyShrine.visitCount }}次访问</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                  <span>建立于{{ formatDate(familyShrine.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="shrine-features">
          <h4>祠堂功能</h4>
          <div class="features-grid">
            <div 
              v-for="feature in shrineFeatures" 
              :key="feature.id"
              class="feature-card"
              @click="useFeature(feature)"
            >
              <div class="feature-icon">
                <iconify-icon :icon="feature.icon" width="24"></iconify-icon>
              </div>
              <div class="feature-info">
                <h5>{{ feature.title }}</h5>
                <p>{{ feature.description }}</p>
              </div>
              <div v-if="feature.isNew" class="new-badge">新</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数字藏品 -->
      <div v-if="currentFunction === 'nft'" class="nft-section">
        <div class="nft-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:photo" width="32" class="intro-icon"></iconify-icon>
            <h3>家族数字藏品</h3>
            <p>将珍贵的家族文物和记忆铸造为永恒的数字藏品</p>
          </div>
        </div>

        <div class="nft-categories">
          <div 
            v-for="category in nftCategories" 
            :key="category.value"
            class="nft-category"
            :class="{ active: currentNftCategory === category.value }"
            @click="setNftCategory(category.value)"
          >
            <iconify-icon :icon="category.icon" width="16"></iconify-icon>
            <span>{{ category.label }}</span>
          </div>
        </div>

        <div class="nft-grid">
          <div 
            v-for="nft in filteredNfts" 
            :key="nft.id"
            class="nft-card"
            @click="viewNftDetail(nft)"
          >
            <div class="nft-image">
              <img :src="nft.image" :alt="nft.name" />
              <div class="nft-rarity" :class="nft.rarity">
                {{ getRarityText(nft.rarity) }}
              </div>
              <div v-if="nft.isOwned" class="owned-badge">
                <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
              </div>
            </div>
            <div class="nft-info">
              <h5>{{ nft.name }}</h5>
              <p class="nft-description">{{ nft.description }}</p>
              <div class="nft-meta">
                <div class="nft-creator">
                  <img :src="nft.creator.avatar || '/default-avatar.png'" :alt="nft.creator.name" />
                  <span>{{ nft.creator.name }}</span>
                </div>
                <div class="nft-price">
                  <span v-if="nft.price === 0" class="free">免费</span>
                  <span v-else class="paid">{{ nft.price }} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="create-nft">
          <button @click="createNft" class="create-nft-btn">
            <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
            创建数字藏品
          </button>
        </div>
      </div>

      <!-- 虚拟活动 -->
      <div v-if="currentFunction === 'events'" class="events-section">
        <div class="events-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:calendar-days" width="32" class="intro-icon"></iconify-icon>
            <h3>虚拟家族活动</h3>
            <p>在元宇宙中举办各种家族聚会和庆典活动</p>
          </div>
        </div>

        <div class="events-list">
          <div 
            v-for="event in virtualEvents" 
            :key="event.id"
            class="event-card"
            @click="viewEventDetail(event)"
          >
            <div class="event-image">
              <img :src="event.image" :alt="event.title" />
              <div class="event-status" :class="event.status">
                {{ getEventStatusText(event.status) }}
              </div>
            </div>
            <div class="event-info">
              <h4>{{ event.title }}</h4>
              <p class="event-description">{{ event.description }}</p>
              <div class="event-meta">
                <div class="meta-item">
                  <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                  <span>{{ formatDateTime(event.startTime) }}</span>
                </div>
                <div class="meta-item">
                  <iconify-icon icon="heroicons:users" width="14"></iconify-icon>
                  <span>{{ event.participantCount }}人参与</span>
                </div>
                <div class="meta-item">
                  <iconify-icon icon="heroicons:globe-alt" width="14"></iconify-icon>
                  <span>{{ event.platform }}</span>
                </div>
              </div>
              <div class="event-actions">
                <button 
                  v-if="event.status === 'upcoming' && !event.isJoined"
                  @click.stop="joinEvent(event)"
                  class="action-btn primary"
                >
                  <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
                  参加活动
                </button>
                <button 
                  v-else-if="event.status === 'ongoing'"
                  @click.stop="enterEvent(event)"
                  class="action-btn primary"
                >
                  <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
                  进入活动
                </button>
                <button 
                  @click.stop="shareEvent(event)"
                  class="action-btn"
                >
                  <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VR体验 -->
      <div v-if="currentFunction === 'vr'" class="vr-section">
        <div class="vr-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:eye" width="32" class="intro-icon"></iconify-icon>
            <h3>VR沉浸体验</h3>
            <p>通过VR技术，身临其境地体验家族历史和文化</p>
          </div>
        </div>

        <div class="vr-experiences">
          <div 
            v-for="experience in vrExperiences" 
            :key="experience.id"
            class="vr-card"
            @click="startVrExperience(experience)"
          >
            <div class="vr-preview">
              <img :src="experience.preview" :alt="experience.title" />
              <div class="vr-overlay">
                <iconify-icon icon="heroicons:play" width="32"></iconify-icon>
                <span>开始体验</span>
              </div>
              <div class="vr-duration">{{ experience.duration }}分钟</div>
            </div>
            <div class="vr-info">
              <h4>{{ experience.title }}</h4>
              <p class="vr-description">{{ experience.description }}</p>
              <div class="vr-features">
                <div v-if="experience.hasVR" class="feature-tag vr">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  VR支持
                </div>
                <div v-if="experience.hasAR" class="feature-tag ar">
                  <iconify-icon icon="heroicons:device-phone-mobile" width="12"></iconify-icon>
                  AR支持
                </div>
                <div v-if="experience.interactive" class="feature-tag interactive">
                  <iconify-icon icon="heroicons:hand-raised" width="12"></iconify-icon>
                  互动体验
                </div>
              </div>
              <div class="vr-rating">
                <div class="rating-stars">
                  <iconify-icon 
                    v-for="i in 5" 
                    :key="i"
                    icon="heroicons:star"
                    width="12"
                    :class="{ filled: i <= experience.rating }"
                  ></iconify-icon>
                </div>
                <span class="rating-text">{{ experience.rating }}/5 ({{ experience.reviewCount }}评价)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="shouldShowEmpty" class="empty-state">
        <iconify-icon :icon="getEmptyIcon()" width="48" class="empty-icon"></iconify-icon>
        <h3>{{ getEmptyTitle() }}</h3>
        <p>{{ getEmptyDesc() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const currentFunction = ref('shrine')
const currentNftCategory = ref('all')

const functionTabs = ref([
  { label: '虚拟祠堂', value: 'shrine', icon: 'heroicons:building-library' },
  { label: '数字藏品', value: 'nft', icon: 'heroicons:photo' },
  { label: '虚拟活动', value: 'events', icon: 'heroicons:calendar-days' },
  { label: 'VR体验', value: 'vr', icon: 'heroicons:eye' }
])

const familyShrine = ref({
  name: '张氏家族祠堂',
  description: '传承千年的家族文化圣地，在元宇宙中重现辉煌',
  memberCount: 156,
  visitCount: 2340,
  createTime: new Date('2023-10-01')
})

const shrineFeatures = ref([
  {
    id: 1,
    title: '祖先祭拜',
    description: '虚拟祭拜祖先，表达敬意',
    icon: 'heroicons:heart',
    isNew: false
  },
  {
    id: 2,
    title: '家族展览',
    description: '展示家族历史文物和照片',
    icon: 'heroicons:photo',
    isNew: true
  },
  {
    id: 3,
    title: '族人聚会',
    description: '举办虚拟家族聚会',
    icon: 'heroicons:users',
    isNew: false
  },
  {
    id: 4,
    title: '文化传承',
    description: '学习和传承家族文化',
    icon: 'heroicons:academic-cap',
    isNew: true
  }
])

const nftCategories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '家族文物', value: 'artifact', icon: 'heroicons:archive-box' },
  { label: '历史照片', value: 'photo', icon: 'heroicons:photo' },
  { label: '家谱文档', value: 'document', icon: 'heroicons:document-text' },
  { label: '纪念品', value: 'memorial', icon: 'heroicons:gift' }
])

const nfts = ref([
  {
    id: 1,
    name: '张氏族谱古籍',
    description: '明代手抄张氏族谱，珍贵的家族文献',
    image: '/nft/genealogy-book.jpg',
    category: 'document',
    rarity: 'legendary',
    price: 0.5,
    isOwned: true,
    creator: {
      id: 1,
      name: '张长老',
      avatar: '/avatars/elder.jpg'
    }
  },
  {
    id: 2,
    name: '祖宅老照片',
    description: '1920年代的张氏祖宅珍贵照片',
    image: '/nft/old-house.jpg',
    category: 'photo',
    rarity: 'rare',
    price: 0,
    isOwned: false,
    creator: {
      id: 2,
      name: '张小明',
      avatar: '/avatars/xiaoming.jpg'
    }
  }
])

const virtualEvents = ref([
  {
    id: 1,
    title: '张氏家族新春庆典',
    description: '在虚拟祠堂举办的新春庆典活动',
    image: '/events/spring-festival.jpg',
    status: 'upcoming',
    startTime: new Date('2024-02-10 19:00'),
    participantCount: 45,
    platform: 'VRChat',
    isJoined: false
  }
])

const vrExperiences = ref([
  {
    id: 1,
    title: '穿越时空回到祖宅',
    description: '通过VR技术重现百年前的张氏祖宅',
    preview: '/vr/ancestral-home.jpg',
    duration: 15,
    hasVR: true,
    hasAR: false,
    interactive: true,
    rating: 4.8,
    reviewCount: 156
  }
])

// 计算属性
const filteredNfts = computed(() => {
  if (currentNftCategory.value === 'all') {
    return nfts.value
  }
  return nfts.value.filter(nft => nft.category === currentNftCategory.value)
})

const shouldShowEmpty = computed(() => {
  if (currentFunction.value === 'nft') return filteredNfts.value.length === 0
  if (currentFunction.value === 'events') return virtualEvents.value.length === 0
  if (currentFunction.value === 'vr') return vrExperiences.value.length === 0
  return false
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    // 加载元宇宙数据
    console.log('加载元宇宙数据')
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  }
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const setNftCategory = (category: string) => {
  currentNftCategory.value = category
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const enterShrine = () => {
  // 检查设备支持
  if (window.DeviceOrientationEvent) {
    router.push(`/genealogy/${genealogyId.value}/metaverse/shrine`)
  } else {
    appStore.showToast('您的设备不支持VR功能', 'error')
  }
}

const useFeature = (feature: any) => {
  router.push(`/genealogy/${genealogyId.value}/shrine/${feature.id}`)
}

const getRarityText = (rarity: string) => {
  const rarityMap = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return rarityMap[rarity] || rarity
}

const viewNftDetail = (nft: any) => {
  router.push(`/genealogy/${genealogyId.value}/nft/${nft.id}`)
}

const createNft = () => {
  router.push(`/genealogy/${genealogyId.value}/nft/create`)
}

const getEventStatusText = (status: string) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束'
  }
  return statusMap[status] || status
}

const viewEventDetail = (event: any) => {
  router.push(`/genealogy/${genealogyId.value}/virtual-event/${event.id}`)
}

const joinEvent = async (event: any) => {
  try {
    event.isJoined = true
    event.participantCount += 1
    appStore.showToast('已报名参加活动', 'success')
  } catch (error) {
    appStore.showToast('报名失败', 'error')
  }
}

const enterEvent = (event: any) => {
  router.push(`/genealogy/${genealogyId.value}/virtual-event/${event.id}/enter`)
}

const shareEvent = (event: any) => {
  if (navigator.share) {
    navigator.share({
      title: event.title,
      text: event.description,
      url: window.location.href + `/virtual-event/${event.id}`
    })
  } else {
    appStore.showToast('分享功能开发中', 'info')
  }
}

const startVrExperience = (experience: any) => {
  if (experience.hasVR && !window.DeviceOrientationEvent) {
    appStore.showToast('您的设备不支持VR功能', 'error')
    return
  }
  router.push(`/genealogy/${genealogyId.value}/vr-experience/${experience.id}`)
}

const getEmptyIcon = () => {
  const iconMap = {
    shrine: 'heroicons:building-library',
    nft: 'heroicons:photo',
    events: 'heroicons:calendar-days',
    vr: 'heroicons:eye'
  }
  return iconMap[currentFunction.value] || 'heroicons:exclamation-triangle'
}

const getEmptyTitle = () => {
  const titleMap = {
    shrine: '虚拟祠堂建设中',
    nft: '暂无数字藏品',
    events: '暂无虚拟活动',
    vr: '暂无VR体验'
  }
  return titleMap[currentFunction.value] || '暂无数据'
}

const getEmptyDesc = () => {
  const descMap = {
    shrine: '虚拟祠堂正在建设中，敬请期待',
    nft: '该分类下暂无数字藏品',
    events: '还没有举办虚拟活动',
    vr: 'VR体验内容即将上线'
  }
  return descMap[currentFunction.value] || '请稍后再试'
}
</script>

<style scoped>
.metaverse-integration-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 功能标签 */
.function-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
}

.function-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.function-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.function-tab span {
  font-size: 11px;
  font-weight: 500;
}

/* 主要内容 */
.metaverse-content {
  padding: 16px;
}

/* 服务介绍 */
.shrine-intro,
.nft-intro,
.events-intro,
.vr-intro {
  margin-bottom: 20px;
}

.intro-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: white;
}

.intro-icon {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.intro-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.intro-card p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 虚拟祠堂 */
.shrine-preview {
  margin-bottom: 20px;
}

.preview-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.preview-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-card:hover .preview-overlay {
  opacity: 1;
}

.enter-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.enter-btn:hover {
  background: white;
  transform: translateY(-2px);
}

.preview-info {
  padding: 16px;
}

.preview-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.preview-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.shrine-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.shrine-features h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  color: #07c160;
  margin-bottom: 8px;
}

.feature-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.feature-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.new-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff3b30;
  color: white;
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: bold;
}

/* 数字藏品 */
.nft-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.nft-categories::-webkit-scrollbar {
  display: none;
}

.nft-category {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.nft-category.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.nft-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.nft-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nft-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.nft-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nft-rarity {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.nft-rarity.common {
  background: #999;
}

.nft-rarity.rare {
  background: #4A90E2;
}

.nft-rarity.epic {
  background: #9B59B6;
}

.nft-rarity.legendary {
  background: #F39C12;
}

.owned-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #07c160;
}

.nft-info {
  padding: 12px;
}

.nft-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.nft-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nft-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nft-creator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nft-creator img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.nft-creator span {
  font-size: 10px;
  color: #666;
}

.nft-price .free {
  color: #07c160;
  font-weight: 600;
  font-size: 12px;
}

.nft-price .paid {
  color: #ff9500;
  font-weight: 600;
  font-size: 12px;
}

.create-nft {
  text-align: center;
}

.create-nft-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.create-nft-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 虚拟活动 */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.event-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.event-status.upcoming {
  background: #07c160;
}

.event-status.ongoing {
  background: #ff9500;
}

.event-status.completed {
  background: #999;
}

.event-info {
  padding: 16px;
}

.event-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.event-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* VR体验 */
.vr-experiences {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vr-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.vr-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vr-preview {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.vr-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.vr-card:hover .vr-overlay {
  opacity: 1;
}

.vr-overlay span {
  font-size: 12px;
}

.vr-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.vr-info {
  padding: 16px;
}

.vr-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.vr-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.vr-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  color: white;
}

.feature-tag.vr {
  background: #E74C3C;
}

.feature-tag.ar {
  background: #3498DB;
}

.feature-tag.interactive {
  background: #9B59B6;
}

.vr-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-stars iconify-icon {
  color: #ddd;
}

.rating-stars iconify-icon.filled {
  color: #FFD700;
}

.rating-text {
  font-size: 12px;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .nft-grid {
    grid-template-columns: 1fr;
  }

  .function-tab {
    padding: 10px 4px;
  }

  .function-tab span {
    font-size: 10px;
  }

  .event-meta {
    gap: 4px;
  }

  .action-btn {
    padding: 10px;
    font-size: 11px;
  }
}
</style>

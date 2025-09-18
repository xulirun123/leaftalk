<template>
  <div class="online-search-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="线上寻亲" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canPublish" @click="publishSearch" class="publish-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
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
          <span v-if="tab.count > 0" class="count-badge">{{ tab.count }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="search-content">
      <!-- 寻亲信息列表 -->
      <div v-if="currentFunction === 'search'" class="search-section">
        <!-- 搜索筛选 -->
        <div class="search-filters">
          <div class="filter-row">
            <select v-model="searchFilters.province" @change="onProvinceChange" class="filter-select">
              <option value="">选择省份</option>
              <option v-for="province in provinces" :key="province" :value="province">{{ province }}</option>
            </select>
            <select v-model="searchFilters.city" class="filter-select">
              <option value="">选择城市</option>
              <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
            </select>
          </div>
          <div class="filter-row">
            <input
              v-model="searchFilters.surname"
              type="text"
              placeholder="输入姓氏"
              class="filter-input"
            />
            <input
              v-model="searchFilters.generation"
              type="text"
              placeholder="输入世代"
              class="filter-input"
            />
          </div>
        </div>

        <div class="search-list">
          <div 
            v-for="search in filteredSearches" 
            :key="search.id"
            class="search-card"
            @click="viewSearchDetail(search)"
          >
            <div class="search-header">
              <div class="search-info">
                <h4>{{ search.title }}</h4>
                <div class="search-meta">
                  <span class="search-type" :class="search.type">
                    {{ getSearchTypeText(search.type) }}
                  </span>
                  <span class="search-status" :class="search.status">
                    {{ getStatusText(search.status) }}
                  </span>
                </div>
              </div>
              <div class="search-urgency" :class="search.urgency">
                {{ getUrgencyText(search.urgency) }}
              </div>
            </div>
            
            <div class="search-details">
              <div class="detail-item">
                <iconify-icon icon="heroicons:user" width="14"></iconify-icon>
                <span>寻找：{{ search.targetName }}</span>
              </div>
              <div class="detail-item">
                <iconify-icon icon="heroicons:map-pin" width="14"></iconify-icon>
                <span>地区：{{ search.location }}</span>
              </div>
              <div class="detail-item">
                <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                <span>年代：{{ search.timeRange }}</span>
              </div>
              <div class="detail-item">
                <iconify-icon icon="heroicons:identification" width="14"></iconify-icon>
                <span>姓氏：{{ search.surname }}</span>
              </div>
            </div>
            
            <div class="search-description">
              {{ search.description }}
            </div>
            
            <div class="search-contact">
              <div class="contact-info">
                <img :src="search.publisher.avatar || '/default-avatar.png'" :alt="search.publisher.name" />
                <div class="contact-details">
                  <span class="contact-name">{{ search.publisher.name }}</span>
                  <span class="contact-relation">{{ search.publisher.relation }}</span>
                </div>
              </div>
              <div class="search-stats">
                <span class="publish-time">{{ formatDate(search.publishTime) }}</span>
                <span class="view-count">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  {{ search.viewCount }}
                </span>
              </div>
            </div>
            
            <div class="search-actions">
              <button @click.stop="contactPublisher(search)" class="action-btn primary">
                <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
                联系发布者
              </button>
              <button @click.stop="provideClue(search)" class="action-btn">
                <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
                提供线索
              </button>
              <button @click.stop="shareSearch(search)" class="action-btn">
                <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的寻亲 -->
      <div v-if="currentFunction === 'my'" class="my-section">
        <div class="my-searches">
          <div 
            v-for="search in mySearches" 
            :key="search.id"
            class="my-search-card"
            @click="viewMySearchDetail(search)"
          >
            <div class="my-search-header">
              <h4>{{ search.title }}</h4>
              <div class="search-status" :class="search.status">
                {{ getStatusText(search.status) }}
              </div>
            </div>
            
            <div class="my-search-stats">
              <div class="stat-item">
                <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                <span>{{ search.viewCount }}次浏览</span>
              </div>
              <div class="stat-item">
                <iconify-icon icon="heroicons:chat-bubble-left-right" width="14"></iconify-icon>
                <span>{{ search.responseCount }}条回复</span>
              </div>
              <div class="stat-item">
                <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                <span>{{ formatDate(search.publishTime) }}</span>
              </div>
            </div>
            
            <div class="my-search-actions">
              <button @click.stop="editSearch(search)" class="action-btn">
                <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
                编辑
              </button>
              <button @click.stop="viewResponses(search)" class="action-btn primary">
                <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
                查看回复
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 成功案例 -->
      <div v-if="currentFunction === 'success'" class="success-section">
        <div class="success-list">
          <div 
            v-for="success in successCases" 
            :key="success.id"
            class="success-card"
            @click="viewSuccessDetail(success)"
          >
            <div class="success-header">
              <iconify-icon icon="heroicons:check-circle" width="24" class="success-icon"></iconify-icon>
              <div class="success-info">
                <h4>{{ success.title }}</h4>
                <p class="success-summary">{{ success.summary }}</p>
              </div>
            </div>
            
            <div class="success-details">
              <div class="detail-item">
                <span class="label">寻亲时长：</span>
                <span>{{ success.duration }}</span>
              </div>
              <div class="detail-item">
                <span class="label">成功时间：</span>
                <span>{{ formatDate(success.successTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">帮助人数：</span>
                <span>{{ success.helpCount }}人</span>
              </div>
            </div>
            
            <div class="success-story">
              {{ success.story }}
            </div>
          </div>
        </div>
      </div>

      <!-- 寻亲指南 -->
      <div v-if="currentFunction === 'guide'" class="guide-section">
        <div class="guide-cards">
          <div 
            v-for="guide in searchGuides" 
            :key="guide.id"
            class="guide-card"
            @click="viewGuide(guide)"
          >
            <div class="guide-icon">
              <iconify-icon :icon="guide.icon" width="32"></iconify-icon>
            </div>
            <div class="guide-info">
              <h4>{{ guide.title }}</h4>
              <p>{{ guide.description }}</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="shouldShowEmpty" class="empty-state">
        <iconify-icon :icon="getEmptyIcon()" width="48" class="empty-icon"></iconify-icon>
        <h3>{{ getEmptyTitle() }}</h3>
        <p>{{ getEmptyDesc() }}</p>
        <button v-if="canPublish && currentFunction === 'search'" @click="publishSearch" class="publish-search-btn">
          发布寻亲信息
        </button>
      </div>
    </div>

    <!-- 发布寻亲弹窗 -->
    <div v-if="showPublishModal" class="modal-overlay" @click="closePublishModal">
      <div class="publish-modal" @click.stop>
        <div class="modal-header">
          <h3>发布寻亲信息</h3>
          <button @click="closePublishModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitSearch" class="publish-form">
            <div class="form-group">
              <label>寻亲标题</label>
              <input 
                v-model="newSearch.title"
                type="text"
                placeholder="请输入寻亲标题"
                required
              />
            </div>
            <div class="form-group">
              <label>寻找对象姓名</label>
              <input 
                v-model="newSearch.targetName"
                type="text"
                placeholder="请输入要寻找的人的姓名"
                required
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>寻亲类型</label>
                <select v-model="newSearch.type" required>
                  <option value="">请选择</option>
                  <option value="ancestor">寻找祖先</option>
                  <option value="descendant">寻找后代</option>
                  <option value="relative">寻找亲属</option>
                  <option value="branch">寻找分支</option>
                </select>
              </div>
              <div class="form-group">
                <label>紧急程度</label>
                <select v-model="newSearch.urgency" required>
                  <option value="">请选择</option>
                  <option value="urgent">紧急</option>
                  <option value="normal">一般</option>
                  <option value="low">不急</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>姓氏</label>
                <input 
                  v-model="newSearch.surname"
                  type="text"
                  placeholder="请输入姓氏"
                  required
                />
              </div>
              <div class="form-group">
                <label>年代范围</label>
                <input 
                  v-model="newSearch.timeRange"
                  type="text"
                  placeholder="如：1950-1980年"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label>地区信息</label>
              <input 
                v-model="newSearch.location"
                type="text"
                placeholder="请输入相关地区信息"
                required
              />
            </div>
            <div class="form-group">
              <label>详细描述</label>
              <textarea 
                v-model="newSearch.description"
                placeholder="请详细描述寻亲信息，包括已知线索、特征等"
                rows="4"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label>联系方式</label>
              <input 
                v-model="newSearch.contact"
                type="text"
                placeholder="请输入联系方式"
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="closePublishModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                发布寻亲
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 联系发布者弹窗 -->
    <div v-if="showContactModal" class="modal-overlay" @click="closeContactModal">
      <div class="contact-modal" @click.stop>
        <div class="modal-header">
          <h3>联系发布者</h3>
          <button @click="closeContactModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="contact-info-section">
          <div class="publisher-info">
            <img :src="selectedSearch?.publisher?.avatar || '/default-avatar.png'" :alt="selectedSearch?.publisher?.name" />
            <div class="publisher-details">
              <h4>{{ selectedSearch?.publisher?.name }}</h4>
              <p>{{ selectedSearch?.publisher?.relation }}</p>
            </div>
          </div>

          <div class="search-summary">
            <h5>寻找：{{ selectedSearch?.targetName }}</h5>
            <p>{{ selectedSearch?.description?.substring(0, 50) }}...</p>
          </div>
        </div>

        <div class="contact-methods">
          <button @click="contactViaChat" class="contact-method">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="24"></iconify-icon>
            <span>发起聊天</span>
            <p>通过叶语聊天功能联系</p>
          </button>

          <button @click="contactViaPhone" class="contact-method">
            <iconify-icon icon="heroicons:phone" width="24"></iconify-icon>
            <span>电话联系</span>
            <p>直接拨打发布者电话</p>
          </button>

          <button @click="shareToMoments" class="contact-method">
            <iconify-icon icon="heroicons:share" width="24"></iconify-icon>
            <span>分享扩散</span>
            <p>分享到朋友圈帮助寻找</p>
          </button>
        </div>

        <div class="contact-tips">
          <div class="tip-item">
            <iconify-icon icon="heroicons:shield-check" width="16"></iconify-icon>
            <span>请注意保护个人隐私信息</span>
          </div>
          <div class="tip-item">
            <iconify-icon icon="heroicons:exclamation-triangle" width="16"></iconify-icon>
            <span>谨防诈骗，核实身份后再提供信息</span>
          </div>
        </div>
      </div>
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
const genealogyId = ref(route.params.id)
const currentFunction = ref('search')
const showPublishModal = ref(false)

const functionTabs = ref([
  { label: '寻亲信息', value: 'search', icon: 'heroicons:magnifying-glass', count: 0 },
  { label: '我的寻亲', value: 'my', icon: 'heroicons:user', count: 2 },
  { label: '成功案例', value: 'success', icon: 'heroicons:check-circle', count: 0 },
  { label: '寻亲指南', value: 'guide', icon: 'heroicons:book-open', count: 0 }
])

const searchFilters = ref({
  province: '',
  city: '',
  surname: '',
  generation: ''
})

const provinces = ref(['北京', '上海', '广东', '浙江', '江苏', '山东', '河南', '四川'])
const cities = ref([])
const commonSurnames = ref(['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'])
const generations = ref(['第一代', '第二代', '第三代', '第四代', '第五代'])

const searches = ref([
  {
    id: 1,
    title: '寻找张氏家族失散多年的三叔',
    targetName: '张建国',
    type: 'relative',
    status: 'active',
    urgency: 'urgent',
    location: '河南省郑州市',
    timeRange: '1960-1970年',
    surname: '张',
    description: '我三叔张建国，1965年出生，因为历史原因与家族失去联系已有30多年...',
    publisher: {
      id: 1,
      name: '张小明',
      avatar: '/avatars/xiaoming.jpg',
      relation: '侄子'
    },
    publishTime: new Date('2024-01-15'),
    viewCount: 256,
    responseCount: 8
  }
])

const mySearches = ref([
  {
    id: 1,
    title: '寻找张氏家族失散多年的三叔',
    status: 'active',
    viewCount: 256,
    responseCount: 8,
    publishTime: new Date('2024-01-15')
  }
])

const successCases = ref([
  {
    id: 1,
    title: '30年后终于找到失散的兄弟',
    summary: '通过线上寻亲平台，成功找到失散30年的兄弟',
    duration: '3个月',
    successTime: new Date('2023-12-20'),
    helpCount: 15,
    story: '经过3个月的努力，在众多热心网友的帮助下，终于找到了失散30年的兄弟...'
  }
])

const searchGuides = ref([
  {
    id: 1,
    title: '如何发布有效的寻亲信息',
    description: '学习如何撰写详细、准确的寻亲信息',
    icon: 'heroicons:pencil-square'
  },
  {
    id: 2,
    title: '寻亲线索收集技巧',
    description: '掌握收集和整理寻亲线索的方法',
    icon: 'heroicons:magnifying-glass'
  }
])

const newSearch = ref({
  title: '',
  targetName: '',
  type: '',
  urgency: '',
  surname: '',
  timeRange: '',
  location: '',
  description: '',
  contact: ''
})

// 计算属性
const canPublish = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin' || authStore.user?.role === 'member'
})

const filteredSearches = computed(() => {
  let filtered = searches.value
  
  if (searchFilters.value.surname) {
    filtered = filtered.filter(search => search.surname === searchFilters.value.surname)
  }
  
  if (searchFilters.value.province) {
    filtered = filtered.filter(search => search.location.includes(searchFilters.value.province))
  }
  
  return filtered
})

const shouldShowEmpty = computed(() => {
  if (currentFunction.value === 'search') return filteredSearches.value.length === 0
  if (currentFunction.value === 'my') return mySearches.value.length === 0
  if (currentFunction.value === 'success') return successCases.value.length === 0
  if (currentFunction.value === 'guide') return searchGuides.value.length === 0
  return false
})

// 生命周期
onMounted(() => {
  loadData()
  updateTabCounts()
})

// 方法
const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    // 加载寻亲数据
    console.log('加载寻亲数据')
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  }
}

const updateTabCounts = () => {
  functionTabs.value.forEach(tab => {
    if (tab.value === 'search') {
      tab.count = searches.value.length
    } else if (tab.value === 'my') {
      tab.count = mySearches.value.length
    } else if (tab.value === 'success') {
      tab.count = successCases.value.length
    } else if (tab.value === 'guide') {
      tab.count = searchGuides.value.length
    }
  })
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const onProvinceChange = () => {
  // 根据省份更新城市列表
  const cityMap = {
    '北京': ['东城区', '西城区', '朝阳区', '海淀区'],
    '上海': ['黄浦区', '徐汇区', '长宁区', '静安区'],
    '广东': ['广州市', '深圳市', '珠海市', '佛山市']
  }
  cities.value = cityMap[searchFilters.value.province] || []
  searchFilters.value.city = ''
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const getSearchTypeText = (type: string) => {
  const typeMap = {
    ancestor: '寻找祖先',
    descendant: '寻找后代',
    relative: '寻找亲属',
    branch: '寻找分支'
  }
  return typeMap[type] || type
}

const getStatusText = (status: string) => {
  const statusMap = {
    active: '寻找中',
    found: '已找到',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const getUrgencyText = (urgency: string) => {
  const urgencyMap = {
    urgent: '紧急',
    normal: '一般',
    low: '不急'
  }
  return urgencyMap[urgency] || urgency
}

const getEmptyIcon = () => {
  const iconMap = {
    search: 'heroicons:magnifying-glass',
    my: 'heroicons:user',
    success: 'heroicons:check-circle',
    guide: 'heroicons:book-open'
  }
  return iconMap[currentFunction.value] || 'heroicons:exclamation-triangle'
}

const getEmptyTitle = () => {
  const titleMap = {
    search: '暂无寻亲信息',
    my: '暂无我的寻亲',
    success: '暂无成功案例',
    guide: '暂无寻亲指南'
  }
  return titleMap[currentFunction.value] || '暂无数据'
}

const getEmptyDesc = () => {
  const descMap = {
    search: '还没有任何寻亲信息',
    my: '您还没有发布过寻亲信息',
    success: '还没有成功案例',
    guide: '寻亲指南即将上线'
  }
  return descMap[currentFunction.value] || '请稍后再试'
}

const viewSearchDetail = (search: any) => {
  router.push(`/genealogy/${genealogyId.value}/search/${search.id}`)
}

const contactPublisher = (search: any) => {
  // 显示联系方式选择弹窗
  showContactModal.value = true
  selectedSearch.value = search
}

// 联系发布者相关
const showContactModal = ref(false)
const selectedSearch = ref(null)

const closeContactModal = () => {
  showContactModal.value = false
  selectedSearch.value = null
}

const contactViaChat = () => {
  // 跳转到聊天页面
  appStore.showToast('正在打开聊天窗口...', 'info')
  closeContactModal()
  // 这里可以跳转到聊天页面
  // router.push(`/chat/${selectedSearch.value.publisher.id}`)
}

const contactViaPhone = () => {
  // 拨打电话
  if (selectedSearch.value?.publisher?.phone) {
    window.location.href = `tel:${selectedSearch.value.publisher.phone}`
  } else {
    appStore.showToast('发布者未提供电话号码', 'info')
  }
  closeContactModal()
}

const shareToMoments = () => {
  appStore.showToast('正在分享到叶语朋友圈...', 'info')
  closeContactModal()
  // 跳转到朋友圈发布页面
  setTimeout(() => {
    const content = `帮助寻找：${selectedSearch.value?.targetName}，如有线索请联系我！`
    router.push(`/moments/publish?content=${encodeURIComponent(content)}&type=search`)
  }, 1000)
}

const provideClue = (search: any) => {
  router.push(`/genealogy/${genealogyId.value}/search/${search.id}/clue`)
}

const shareSearch = (search: any) => {
  if (navigator.share) {
    navigator.share({
      title: search.title,
      text: search.description,
      url: window.location.href + `/${search.id}`
    })
  } else {
    appStore.showToast('分享功能开发中', 'info')
  }
}

const viewMySearchDetail = (search: any) => {
  router.push(`/genealogy/${genealogyId.value}/my-search/${search.id}`)
}

const editSearch = (search: any) => {
  router.push(`/genealogy/${genealogyId.value}/my-search/${search.id}/edit`)
}

const viewResponses = (search: any) => {
  router.push(`/genealogy/${genealogyId.value}/my-search/${search.id}/responses`)
}

const viewSuccessDetail = (success: any) => {
  router.push(`/genealogy/${genealogyId.value}/success-case/${success.id}`)
}

const viewGuide = (guide: any) => {
  router.push(`/genealogy/${genealogyId.value}/search-guide/${guide.id}`)
}

const publishSearch = () => {
  showPublishModal.value = true
}

const closePublishModal = () => {
  showPublishModal.value = false
  resetForm()
}

const resetForm = () => {
  newSearch.value = {
    title: '',
    targetName: '',
    type: '',
    urgency: '',
    surname: '',
    timeRange: '',
    location: '',
    description: '',
    contact: ''
  }
}

const submitSearch = async () => {
  try {
    appStore.showToast('发布中...', 'info')
    // 实现发布寻亲逻辑
    const search = {
      id: Date.now(),
      ...newSearch.value,
      status: 'active',
      publisher: {
        id: authStore.user?.id,
        name: authStore.user?.name,
        avatar: authStore.user?.avatar,
        relation: '发布者'
      },
      publishTime: new Date(),
      viewCount: 0,
      responseCount: 0
    }
    searches.value.unshift(search)
    mySearches.value.unshift(search)
    updateTabCounts()
    appStore.showToast('寻亲信息发布成功', 'success')
    closePublishModal()
  } catch (error) {
    appStore.showToast('发布失败', 'error')
  }
}
</script>

<style scoped>
.online-search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.publish-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.publish-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 功能标签 */
.function-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
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
  position: relative;
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

.count-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff3b30;
  color: white;
  border-radius: 8px;
  padding: 1px 4px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

/* 主要内容 */
.search-content {
  padding: 16px;
}

/* 搜索筛选 */
.search-filters {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-select,
.filter-input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  background: white;
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #07c160;
}

/* 选择框下拉列表滚动条样式 */
.filter-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
}

/* 寻亲信息列表 */
.search-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.search-info h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.search-meta {
  display: flex;
  gap: 8px;
}

.search-type {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.search-type.ancestor {
  background: #4A90E2;
}

.search-type.descendant {
  background: #9B59B6;
}

.search-type.relative {
  background: #F39C12;
}

.search-type.branch {
  background: #E74C3C;
}

.search-status {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.search-status.active {
  background: #07c160;
}

.search-status.found {
  background: #ff9500;
}

.search-status.closed {
  background: #999;
}

.search-urgency {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.search-urgency.urgent {
  background: #ff3b30;
}

.search-urgency.normal {
  background: #ff9500;
}

.search-urgency.low {
  background: #999;
}

.search-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.search-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-contact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-info img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-name {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.contact-relation {
  font-size: 10px;
  color: #666;
}

.search-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.publish-time,
.view-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #999;
}

.search-actions {
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

/* 我的寻亲 */
.my-searches {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.my-search-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.my-search-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.my-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.my-search-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  flex: 1;
  margin-right: 12px;
}

.my-search-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.my-search-actions {
  display: flex;
  gap: 8px;
}

/* 成功案例 */
.success-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.success-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.success-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.success-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.success-icon {
  color: #07c160;
  flex-shrink: 0;
  margin-top: 2px;
}

.success-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.success-summary {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.success-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.success-details .detail-item {
  display: flex;
  font-size: 12px;
  color: #666;
}

.success-details .label {
  font-weight: 500;
  margin-right: 4px;
}

.success-story {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 寻亲指南 */
.guide-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.guide-icon {
  color: #07c160;
  flex-shrink: 0;
}

.guide-info {
  flex: 1;
}

.guide-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.guide-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.arrow-icon {
  color: #ccc;
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
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
}

.publish-search-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
}

/* 发布寻亲弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
  max-height: 200px;
  overflow-y: auto;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #07c160;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}

.submit-btn:hover {
  background: #06a552;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .search-details {
    grid-template-columns: 1fr;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .function-tab {
    padding: 10px 4px;
  }

  .function-tab span {
    font-size: 10px;
  }

  .search-actions {
    flex-direction: column;
  }

  .action-btn {
    padding: 10px;
  }

  .my-search-stats {
    flex-direction: column;
    gap: 8px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* 联系发布者弹窗样式 */
.contact-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.contact-info-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.publisher-info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.publisher-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.publisher-details p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.search-summary {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.search-summary h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.search-summary p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.contact-methods {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.contact-method:hover {
  background: #e9ecef;
}

.contact-method iconify-icon {
  color: #07C160;
  flex-shrink: 0;
}

.contact-method span {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.contact-method p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.contact-method > div {
  flex: 1;
}

.contact-tips {
  padding: 16px 20px;
  background: #fff3e0;
  border-top: 1px solid #f0f0f0;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item iconify-icon {
  color: #ff9500;
  flex-shrink: 0;
}

.tip-item span {
  font-size: 12px;
  color: #f57c00;
  line-height: 1.4;
}
</style>

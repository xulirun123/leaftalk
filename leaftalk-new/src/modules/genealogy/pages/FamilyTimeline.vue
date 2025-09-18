<template>
  <div class="family-timeline">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">家族时间轴</h1>
      <button @click="showFilters = true" class="filter-btn">
        <iconify-icon icon="heroicons:funnel" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 时间轴控制器 -->
    <div class="timeline-controls">
      <div class="controls-header">
        <h3>时间范围</h3>
        <div class="timeline-stats">{{ filteredEvents.length }}个事件</div>
      </div>
      
      <div class="time-range-selector">
        <div class="range-slider">
          <input 
            type="range" 
            v-model="timeRange.start" 
            :min="minYear" 
            :max="maxYear"
            @input="updateTimelineView"
            class="range-input start-range"
          />
          <input 
            type="range" 
            v-model="timeRange.end" 
            :min="minYear" 
            :max="maxYear"
            @input="updateTimelineView"
            class="range-input end-range"
          />
          <div class="range-track">
            <div 
              class="range-fill"
              :style="{ 
                left: ((timeRange.start - minYear) / (maxYear - minYear) * 100) + '%',
                width: ((timeRange.end - timeRange.start) / (maxYear - minYear) * 100) + '%'
              }"
            ></div>
          </div>
        </div>
        
        <div class="range-labels">
          <span class="range-label start">{{ timeRange.start }}年</span>
          <span class="range-label end">{{ timeRange.end }}年</span>
        </div>
      </div>
      
      <div class="quick-ranges">
        <button 
          v-for="range in quickRanges" 
          :key="range.id"
          @click="setQuickRange(range)"
          class="quick-range-btn"
          :class="{ active: isActiveRange(range) }"
        >
          {{ range.name }}
        </button>
      </div>
    </div>

    <!-- 时间轴视图模式 -->
    <div class="timeline-view-modes">
      <div class="mode-selector">
        <button 
          v-for="mode in viewModes" 
          :key="mode.id"
          @click="currentViewMode = mode.id"
          :class="{ active: currentViewMode === mode.id }"
          class="mode-btn"
        >
          <iconify-icon :icon="mode.icon" width="16"></iconify-icon>
          <span>{{ mode.name }}</span>
        </button>
      </div>
    </div>

    <!-- 时间轴主体 -->
    <div class="timeline-container" :class="currentViewMode">
      <!-- 垂直时间轴视图 -->
      <div v-if="currentViewMode === 'vertical'" class="vertical-timeline">
        <div class="timeline-line"></div>
        
        <div 
          v-for="(event, index) in filteredEvents" 
          :key="event.id"
          class="timeline-event"
          :class="{ 
            left: index % 2 === 0, 
            right: index % 2 === 1,
            [event.type]: true 
          }"
          @click="selectEvent(event)"
        >
          <div class="event-marker">
            <div class="marker-dot" :style="{ backgroundColor: getEventColor(event.type) }">
              <iconify-icon :icon="getEventIcon(event.type)" width="16"></iconify-icon>
            </div>
            <div class="marker-line"></div>
          </div>
          
          <div class="event-card">
            <div class="event-header">
              <div class="event-date">{{ formatEventDate(event.date) }}</div>
              <div class="event-type-badge" :class="event.type">{{ getEventTypeName(event.type) }}</div>
            </div>
            
            <div class="event-content">
              <h4 class="event-title">{{ event.title }}</h4>
              <p class="event-description">{{ event.description }}</p>
              
              <div v-if="event.participants && event.participants.length > 0" class="event-participants">
                <div class="participants-label">相关人员：</div>
                <div class="participants-list">
                  <div 
                    v-for="participant in event.participants.slice(0, 3)" 
                    :key="participant.id"
                    class="participant-avatar"
                    :title="participant.name"
                  >
                    <img :src="participant.avatar || '/default-avatar.png'" :alt="participant.name" />
                  </div>
                  <div v-if="event.participants.length > 3" class="more-participants">
                    +{{ event.participants.length - 3 }}
                  </div>
                </div>
              </div>
              
              <div v-if="event.location" class="event-location">
                <iconify-icon icon="heroicons:map-pin" width="14"></iconify-icon>
                <span>{{ event.location }}</span>
              </div>
            </div>
            
            <div v-if="event.images && event.images.length > 0" class="event-images">
              <div 
                v-for="(image, imgIndex) in event.images.slice(0, 3)" 
                :key="imgIndex"
                class="event-image"
                @click="previewImage(event.images, imgIndex)"
              >
                <img :src="image.thumbnail || image.url" :alt="image.title" />
              </div>
              <div v-if="event.images.length > 3" class="more-images" @click="viewAllImages(event)">
                +{{ event.images.length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 水平时间轴视图 -->
      <div v-if="currentViewMode === 'horizontal'" class="horizontal-timeline">
        <div class="timeline-scroll" ref="horizontalScroll">
          <div class="timeline-track" :style="{ width: timelineWidth + 'px' }">
            <div class="timeline-axis"></div>
            
            <!-- 年份标记 -->
            <div 
              v-for="year in yearMarkers" 
              :key="year"
              class="year-marker"
              :style="{ left: getYearPosition(year) + 'px' }"
            >
              <div class="year-line"></div>
              <div class="year-label">{{ year }}</div>
            </div>
            
            <!-- 事件点 -->
            <div 
              v-for="event in filteredEvents" 
              :key="event.id"
              class="timeline-point"
              :class="event.type"
              :style="{ left: getEventPosition(event) + 'px' }"
              @click="selectEvent(event)"
            >
              <div class="point-marker" :style="{ backgroundColor: getEventColor(event.type) }">
                <iconify-icon :icon="getEventIcon(event.type)" width="12"></iconify-icon>
              </div>
              <div class="point-tooltip">
                <div class="tooltip-title">{{ event.title }}</div>
                <div class="tooltip-date">{{ formatEventDate(event.date) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="timeline-controls-horizontal">
          <button @click="scrollTimeline('left')" class="scroll-btn">
            <iconify-icon icon="heroicons:chevron-left" width="16"></iconify-icon>
          </button>
          <button @click="scrollTimeline('right')" class="scroll-btn">
            <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
          </button>
          <button @click="zoomTimeline('in')" class="zoom-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          </button>
          <button @click="zoomTimeline('out')" class="zoom-btn">
            <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
          </button>
        </div>
      </div>
      
      <!-- 网格时间轴视图 -->
      <div v-if="currentViewMode === 'grid'" class="grid-timeline">
        <div class="grid-header">
          <div class="grid-years">
            <div 
              v-for="year in gridYears" 
              :key="year"
              class="grid-year"
              :class="{ active: selectedYear === year }"
              @click="selectedYear = year"
            >
              {{ year }}
            </div>
          </div>
        </div>
        
        <div class="grid-content">
          <div class="grid-months">
            <div 
              v-for="month in 12" 
              :key="month"
              class="grid-month"
            >
              <div class="month-header">{{ month }}月</div>
              <div class="month-events">
                <div 
                  v-for="event in getMonthEvents(selectedYear, month)" 
                  :key="event.id"
                  class="grid-event"
                  :class="event.type"
                  @click="selectEvent(event)"
                >
                  <div class="grid-event-marker" :style="{ backgroundColor: getEventColor(event.type) }"></div>
                  <div class="grid-event-title">{{ event.title }}</div>
                  <div class="grid-event-date">{{ formatShortDate(event.date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件详情弹窗 -->
    <div v-if="selectedEvent" class="modal-overlay" @click="closeEventDetail">
      <div class="event-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedEvent.title }}</h3>
          <button @click="closeEventDetail" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="event-detail">
            <div class="detail-header">
              <div class="detail-date">
                <iconify-icon icon="heroicons:calendar" width="16"></iconify-icon>
                <span>{{ formatEventDate(selectedEvent.date) }}</span>
              </div>
              <div class="detail-type" :class="selectedEvent.type">
                {{ getEventTypeName(selectedEvent.type) }}
              </div>
            </div>
            
            <div v-if="selectedEvent.location" class="detail-location">
              <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
              <span>{{ selectedEvent.location }}</span>
            </div>
            
            <div class="detail-description">
              {{ selectedEvent.description }}
            </div>
            
            <div v-if="selectedEvent.participants && selectedEvent.participants.length > 0" class="detail-participants">
              <h4>相关人员</h4>
              <div class="participants-grid">
                <div 
                  v-for="participant in selectedEvent.participants" 
                  :key="participant.id"
                  class="participant-card"
                  @click="viewMemberDetail(participant)"
                >
                  <img :src="participant.avatar || '/default-avatar.png'" :alt="participant.name" />
                  <div class="participant-info">
                    <div class="participant-name">{{ participant.name }}</div>
                    <div class="participant-role">{{ participant.role || '家族成员' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedEvent.images && selectedEvent.images.length > 0" class="detail-images">
              <h4>相关图片</h4>
              <div class="images-grid">
                <div 
                  v-for="(image, index) in selectedEvent.images" 
                  :key="index"
                  class="detail-image"
                  @click="previewImage(selectedEvent.images, index)"
                >
                  <img :src="image.thumbnail || image.url" :alt="image.title" />
                </div>
              </div>
            </div>
            
            <div v-if="selectedEvent.relatedEvents && selectedEvent.relatedEvents.length > 0" class="detail-related">
              <h4>相关事件</h4>
              <div class="related-events">
                <div 
                  v-for="relatedEvent in selectedEvent.relatedEvents" 
                  :key="relatedEvent.id"
                  class="related-event"
                  @click="selectEvent(relatedEvent)"
                >
                  <div class="related-event-marker" :style="{ backgroundColor: getEventColor(relatedEvent.type) }"></div>
                  <div class="related-event-info">
                    <div class="related-event-title">{{ relatedEvent.title }}</div>
                    <div class="related-event-date">{{ formatEventDate(relatedEvent.date) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="editEvent(selectedEvent)" class="edit-btn">
            <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
            <span>编辑</span>
          </button>
          <button @click="shareEvent(selectedEvent)" class="share-btn">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <div v-if="showFilters" class="modal-overlay" @click="showFilters = false">
      <div class="filters-modal" @click.stop>
        <div class="modal-header">
          <h3>筛选条件</h3>
          <button @click="showFilters = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="filter-groups">
            <div class="filter-group">
              <h4>事件类型</h4>
              <div class="filter-options">
                <label v-for="type in eventTypes" :key="type.id" class="filter-option">
                  <input type="checkbox" v-model="filters.types" :value="type.id" />
                  <div class="option-content">
                    <div class="option-color" :style="{ backgroundColor: type.color }"></div>
                    <span>{{ type.name }}</span>
                  </div>
                </label>
              </div>
            </div>
            
            <div class="filter-group">
              <h4>时间范围</h4>
              <div class="date-inputs">
                <input type="date" v-model="filters.startDate" />
                <input type="date" v-model="filters.endDate" />
              </div>
            </div>
            
            <div class="filter-group">
              <h4>相关人员</h4>
              <div class="member-search">
                <input 
                  type="text" 
                  v-model="memberSearchQuery"
                  placeholder="搜索家族成员..."
                  @input="searchMembers"
                />
                <div v-if="searchResults.length > 0" class="search-results">
                  <div 
                    v-for="member in searchResults" 
                    :key="member.id"
                    class="search-result"
                    @click="toggleMemberFilter(member)"
                  >
                    <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" />
                    <span>{{ member.name }}</span>
                    <iconify-icon 
                      v-if="filters.members.includes(member.id)"
                      icon="heroicons:check" 
                      width="16"
                    ></iconify-icon>
                  </div>
                </div>
              </div>
              
              <div v-if="filters.members.length > 0" class="selected-members">
                <div 
                  v-for="memberId in filters.members" 
                  :key="memberId"
                  class="selected-member"
                >
                  <img :src="getMemberById(memberId)?.avatar || '/default-avatar.png'" :alt="getMemberById(memberId)?.name" />
                  <span>{{ getMemberById(memberId)?.name }}</span>
                  <button @click="removeMemberFilter(memberId)" class="remove-btn">
                    <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="resetFilters" class="reset-btn">重置</button>
          <button @click="applyFilters" class="apply-btn">应用筛选</button>
        </div>
      </div>
    </div>

    <!-- 添加事件按钮 -->
    <button @click="showAddEvent = true" class="add-event-btn">
      <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
    </button>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在加载时间轴...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// DOM引用
const horizontalScroll = ref(null)

// 状态
const isLoading = ref(false)
const showFilters = ref(false)
const showAddEvent = ref(false)
const selectedEvent = ref(null)
const currentViewMode = ref('vertical')
const selectedYear = ref(new Date().getFullYear())
const memberSearchQuery = ref('')
const searchResults = ref([])

// 时间范围
const timeRange = reactive({
  start: 1900,
  end: new Date().getFullYear()
})

// 水平时间轴设置
const timelineWidth = ref(2000)
const timelineZoom = ref(1)

// 筛选器
const filters = reactive({
  types: [],
  startDate: '',
  endDate: '',
  members: []
})

// 视图模式
const viewModes = ref([
  { id: 'vertical', name: '垂直视图', icon: 'heroicons:bars-3' },
  { id: 'horizontal', name: '水平视图', icon: 'heroicons:minus' },
  { id: 'grid', name: '网格视图', icon: 'heroicons:squares-2x2' }
])

// 快速时间范围
const quickRanges = ref([
  { id: 'recent', name: '近10年', years: 10 },
  { id: 'generation', name: '近30年', years: 30 },
  { id: 'century', name: '近100年', years: 100 },
  { id: 'all', name: '全部', years: null }
])

// 事件类型
const eventTypes = ref([
  { id: 'birth', name: '出生', color: '#4CAF50', icon: 'heroicons:gift' },
  { id: 'death', name: '逝世', color: '#9E9E9E', icon: 'heroicons:heart' },
  { id: 'marriage', name: '结婚', color: '#E91E63', icon: 'heroicons:heart' },
  { id: 'education', name: '教育', color: '#2196F3', icon: 'heroicons:academic-cap' },
  { id: 'career', name: '职业', color: '#FF9800', icon: 'heroicons:briefcase' },
  { id: 'migration', name: '迁移', color: '#9C27B0', icon: 'heroicons:map-pin' },
  { id: 'achievement', name: '成就', color: '#FFD700', icon: 'heroicons:trophy' },
  { id: 'family', name: '家族事件', color: '#607D8B', icon: 'heroicons:users' }
])

// 家族事件数据
const familyEvents = ref([
  {
    id: 1,
    title: '叶德华出生',
    description: '祖父叶德华在广东梅州出生，是家族第一代移居城市的成员',
    date: '1920-01-15',
    type: 'birth',
    location: '广东省梅州市',
    participants: [
      { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg', role: '本人' }
    ],
    images: [
      { url: '/timeline-birth-1.jpg', thumbnail: '/timeline-birth-1-thumb.jpg', title: '出生证明' }
    ]
  },
  {
    id: 2,
    title: '叶德华与王秀英结婚',
    description: '祖父叶德华与祖母王秀英在梅州举行传统婚礼',
    date: '1945-03-20',
    type: 'marriage',
    location: '广东省梅州市',
    participants: [
      { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg', role: '新郎' },
      { id: 2, name: '王秀英', avatar: '/mock-avatar-5.jpg', role: '新娘' }
    ],
    images: [
      { url: '/timeline-wedding-1.jpg', thumbnail: '/timeline-wedding-1-thumb.jpg', title: '婚礼照片' },
      { url: '/timeline-wedding-2.jpg', thumbnail: '/timeline-wedding-2-thumb.jpg', title: '结婚证书' }
    ]
  },
  {
    id: 3,
    title: '叶建国出生',
    description: '父亲叶建国出生，是家族第二代',
    date: '1950-06-10',
    type: 'birth',
    location: '广东省广州市',
    participants: [
      { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg', role: '本人' },
      { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg', role: '父亲' },
      { id: 2, name: '王秀英', avatar: '/mock-avatar-5.jpg', role: '母亲' }
    ]
  },
  {
    id: 4,
    title: '叶德华从事教育工作',
    description: '祖父叶德华开始在当地小学担任教师，从事教育工作30余年',
    date: '1950-09-01',
    type: 'career',
    location: '广东省广州市',
    participants: [
      { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg', role: '教师' }
    ]
  },
  {
    id: 5,
    title: '叶建国大学毕业',
    description: '父亲叶建国从华南理工大学机械工程专业毕业',
    date: '1972-07-01',
    type: 'education',
    location: '广东省广州市',
    participants: [
      { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg', role: '毕业生' }
    ],
    images: [
      { url: '/timeline-graduation-1.jpg', thumbnail: '/timeline-graduation-1-thumb.jpg', title: '毕业照' }
    ]
  },
  {
    id: 6,
    title: '叶建国与李美华结婚',
    description: '父亲叶建国与母亲李美华结婚',
    date: '1975-10-01',
    type: 'marriage',
    location: '广东省深圳市',
    participants: [
      { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg', role: '新郎' },
      { id: 4, name: '李美华', avatar: '/mock-avatar-7.jpg', role: '新娘' }
    ]
  },
  {
    id: 7,
    title: '叶小明出生',
    description: '本人出生，是家族第三代',
    date: '1980-12-05',
    type: 'birth',
    location: '广东省深圳市',
    participants: [
      { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg', role: '本人' },
      { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg', role: '父亲' },
      { id: 4, name: '李美华', avatar: '/mock-avatar-7.jpg', role: '母亲' }
    ]
  },
  {
    id: 8,
    title: '家族迁居北京',
    description: '叶小明大学毕业后在北京工作，开始家族北京分支',
    date: '2005-08-15',
    type: 'migration',
    location: '北京市朝阳区',
    participants: [
      { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg', role: '迁移者' }
    ]
  },
  {
    id: 9,
    title: '叶德华逝世',
    description: '祖父叶德华安详离世，享年75岁',
    date: '1995-12-31',
    type: 'death',
    location: '广东省广州市',
    participants: [
      { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg', role: '逝者' }
    ]
  },
  {
    id: 10,
    title: '叶小明获得技术专利',
    description: '叶小明在软件开发领域获得重要技术专利',
    date: '2015-05-20',
    type: 'achievement',
    location: '北京市',
    participants: [
      { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg', role: '获奖者' }
    ],
    images: [
      { url: '/timeline-patent-1.jpg', thumbnail: '/timeline-patent-1-thumb.jpg', title: '专利证书' }
    ]
  }
])

// 家族成员数据
const familyMembers = ref([
  { id: 1, name: '叶德华', avatar: '/mock-avatar-1.jpg' },
  { id: 2, name: '王秀英', avatar: '/mock-avatar-5.jpg' },
  { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg' },
  { id: 4, name: '李美华', avatar: '/mock-avatar-7.jpg' },
  { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg' },
  { id: 6, name: '叶小红', avatar: '/mock-avatar-4.jpg' }
])

// 计算属性
const minYear = computed(() => {
  const years = familyEvents.value.map(event => new Date(event.date).getFullYear())
  return Math.min(...years, 1900)
})

const maxYear = computed(() => {
  const years = familyEvents.value.map(event => new Date(event.date).getFullYear())
  return Math.max(...years, new Date().getFullYear())
})

const filteredEvents = computed(() => {
  let events = familyEvents.value.filter(event => {
    const eventYear = new Date(event.date).getFullYear()

    // 时间范围筛选
    if (eventYear < timeRange.start || eventYear > timeRange.end) {
      return false
    }

    // 事件类型筛选
    if (filters.types.length > 0 && !filters.types.includes(event.type)) {
      return false
    }

    // 日期范围筛选
    if (filters.startDate && event.date < filters.startDate) {
      return false
    }
    if (filters.endDate && event.date > filters.endDate) {
      return false
    }

    // 相关人员筛选
    if (filters.members.length > 0) {
      const eventMemberIds = event.participants?.map(p => p.id) || []
      if (!filters.members.some(memberId => eventMemberIds.includes(memberId))) {
        return false
      }
    }

    return true
  })

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const yearMarkers = computed(() => {
  const years = []
  const startYear = Math.floor(timeRange.start / 10) * 10
  const endYear = Math.ceil(timeRange.end / 10) * 10

  for (let year = startYear; year <= endYear; year += 10) {
    years.push(year)
  }

  return years
})

const gridYears = computed(() => {
  const years = []
  for (let year = maxYear.value; year >= minYear.value; year--) {
    years.push(year)
  }
  return years
})

// 生命周期
onMounted(() => {
  loadTimelineData()
  initializeFilters()
})

// 方法
const loadTimelineData = async () => {
  isLoading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/timeline`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        familyEvents.value = result.data.events || familyEvents.value
        familyMembers.value = result.data.members || familyMembers.value
      }
    }
  } catch (error) {
    console.error('加载时间轴数据失败:', error)
    // 使用模拟数据
  } finally {
    isLoading.value = false
  }
}

const initializeFilters = () => {
  // 默认选择所有事件类型
  filters.types = eventTypes.value.map(type => type.id)
}

const updateTimelineView = () => {
  // 更新时间轴视图
  if (currentViewMode.value === 'horizontal') {
    nextTick(() => {
      updateHorizontalTimeline()
    })
  }
}

const updateHorizontalTimeline = () => {
  const yearSpan = timeRange.end - timeRange.start
  timelineWidth.value = Math.max(yearSpan * 50 * timelineZoom.value, 1000)
}

const setQuickRange = (range) => {
  if (range.years === null) {
    timeRange.start = minYear.value
    timeRange.end = maxYear.value
  } else {
    timeRange.end = maxYear.value
    timeRange.start = Math.max(maxYear.value - range.years, minYear.value)
  }
  updateTimelineView()
}

const isActiveRange = (range) => {
  if (range.years === null) {
    return timeRange.start === minYear.value && timeRange.end === maxYear.value
  } else {
    return timeRange.end === maxYear.value &&
           timeRange.start === Math.max(maxYear.value - range.years, minYear.value)
  }
}

const getYearPosition = (year) => {
  const yearSpan = timeRange.end - timeRange.start
  const position = ((year - timeRange.start) / yearSpan) * timelineWidth.value
  return Math.max(0, position)
}

const getEventPosition = (event) => {
  const eventYear = new Date(event.date).getFullYear()
  const eventMonth = new Date(event.date).getMonth()
  const yearWithMonth = eventYear + eventMonth / 12

  const yearSpan = timeRange.end - timeRange.start
  const position = ((yearWithMonth - timeRange.start) / yearSpan) * timelineWidth.value
  return Math.max(0, position)
}

const getMonthEvents = (year, month) => {
  return filteredEvents.value.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month
  })
}

const scrollTimeline = (direction) => {
  if (!horizontalScroll.value) return

  const scrollAmount = 200
  const currentScroll = horizontalScroll.value.scrollLeft

  if (direction === 'left') {
    horizontalScroll.value.scrollTo({
      left: currentScroll - scrollAmount,
      behavior: 'smooth'
    })
  } else {
    horizontalScroll.value.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: 'smooth'
    })
  }
}

const zoomTimeline = (direction) => {
  if (direction === 'in') {
    timelineZoom.value = Math.min(timelineZoom.value * 1.5, 5)
  } else {
    timelineZoom.value = Math.max(timelineZoom.value / 1.5, 0.5)
  }
  updateHorizontalTimeline()
}

const selectEvent = (event) => {
  selectedEvent.value = event
}

const closeEventDetail = () => {
  selectedEvent.value = null
}

const searchMembers = () => {
  if (!memberSearchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchResults.value = familyMembers.value.filter(member =>
    member.name.toLowerCase().includes(memberSearchQuery.value.toLowerCase())
  ).slice(0, 5)
}

const toggleMemberFilter = (member) => {
  const index = filters.members.indexOf(member.id)
  if (index > -1) {
    filters.members.splice(index, 1)
  } else {
    filters.members.push(member.id)
  }
}

const removeMemberFilter = (memberId) => {
  const index = filters.members.indexOf(memberId)
  if (index > -1) {
    filters.members.splice(index, 1)
  }
}

const getMemberById = (id) => {
  return familyMembers.value.find(member => member.id === id)
}

const resetFilters = () => {
  filters.types = eventTypes.value.map(type => type.id)
  filters.startDate = ''
  filters.endDate = ''
  filters.members = []
  memberSearchQuery.value = ''
  searchResults.value = []
}

const applyFilters = () => {
  showFilters.value = false
  // 筛选逻辑已在计算属性中实现
}

const editEvent = (event) => {
  // 编辑事件逻辑
  appStore.showToast('编辑功能开发中', 'info')
}

const shareEvent = (event) => {
  // 分享事件逻辑
  if (navigator.share) {
    navigator.share({
      title: event.title,
      text: event.description,
      url: window.location.href
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(`${event.title}: ${event.description}`)
    appStore.showToast('事件信息已复制到剪贴板', 'success')
  }
}

const viewMemberDetail = (member) => {
  router.push(`/genealogy/${genealogyId.value}/members/${member.id}`)
}

const previewImage = (images, index) => {
  // 图片预览逻辑
  appStore.showToast('图片预览功能开发中', 'info')
}

const viewAllImages = (event) => {
  // 查看所有图片逻辑
  appStore.showToast('查看所有图片功能开发中', 'info')
}

// 辅助方法
const getEventColor = (type) => {
  return eventTypes.value.find(t => t.id === type)?.color || '#999'
}

const getEventIcon = (type) => {
  return eventTypes.value.find(t => t.id === type)?.icon || 'heroicons:calendar'
}

const getEventTypeName = (type) => {
  return eventTypes.value.find(t => t.id === type)?.name || '未知'
}

const formatEventDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatShortDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.family-timeline {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
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

.back-btn, .filter-btn {
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

.filter-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 通用区域样式 */
.timeline-controls,
.timeline-view-modes {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.controls-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.timeline-stats {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

/* 时间范围选择器 */
.time-range-selector {
  margin-bottom: 16px;
}

.range-slider {
  position: relative;
  height: 40px;
  margin-bottom: 8px;
}

.range-input {
  position: absolute;
  width: 100%;
  height: 6px;
  background: none;
  pointer-events: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.range-input::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #07c160;
  cursor: pointer;
  pointer-events: all;
  -webkit-appearance: none;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.range-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #07c160;
  cursor: pointer;
  pointer-events: all;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.range-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  transform: translateY(-50%);
}

.range-fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: #07c160;
  border-radius: 3px;
}

.range-labels {
  display: flex;
  justify-content: space-between;
}

.range-label {
  font-size: 12px;
  color: #666;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.quick-ranges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-range-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-range-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.quick-range-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 视图模式选择器 */
.mode-selector {
  display: flex;
  gap: 8px;
}

.mode-btn {
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
}

.mode-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.mode-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 时间轴容器 */
.timeline-container {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 垂直时间轴 */
.vertical-timeline {
  position: relative;
  padding: 20px;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
  transform: translateX(-50%);
}

.timeline-event {
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: flex-start;
}

.timeline-event.left {
  flex-direction: row;
}

.timeline-event.right {
  flex-direction: row-reverse;
}

.event-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.marker-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.marker-line {
  position: absolute;
  top: 50%;
  width: 40px;
  height: 2px;
  background: #e0e0e0;
  transform: translateY(-50%);
}

.timeline-event.left .marker-line {
  left: 100%;
}

.timeline-event.right .marker-line {
  right: 100%;
}

.event-card {
  flex: 1;
  max-width: calc(50% - 40px);
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.timeline-event.left .event-card {
  margin-right: 40px;
}

.timeline-event.right .event-card {
  margin-left: 40px;
}

.event-card:hover {
  background: #f0f0f0;
  border-color: #07c160;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-date {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.event-type-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.event-type-badge.birth { background: #4CAF50; }
.event-type-badge.death { background: #9E9E9E; }
.event-type-badge.marriage { background: #E91E63; }
.event-type-badge.education { background: #2196F3; }
.event-type-badge.career { background: #FF9800; }
.event-type-badge.migration { background: #9C27B0; }
.event-type-badge.achievement { background: #FFD700; color: #333; }
.event-type-badge.family { background: #607D8B; }

.event-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.event-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.event-participants {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.participants-label {
  font-size: 11px;
  color: #999;
}

.participants-list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.participant-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid white;
}

.participant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-participants {
  font-size: 10px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 8px;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.event-images {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.event-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-images {
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  cursor: pointer;
}

/* 水平时间轴 */
.horizontal-timeline {
  position: relative;
  height: 300px;
}

.timeline-scroll {
  width: 100%;
  height: 200px;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.timeline-track {
  position: relative;
  height: 100%;
  min-width: 100%;
}

.timeline-axis {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #e0e0e0;
  transform: translateY(-50%);
}

.year-marker {
  position: absolute;
  top: 50%;
  transform: translateX(-50%);
}

.year-line {
  width: 1px;
  height: 20px;
  background: #ccc;
  margin: 0 auto;
  transform: translateY(-50%);
}

.year-label {
  font-size: 10px;
  color: #666;
  text-align: center;
  margin-top: 8px;
}

.timeline-point {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.point-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.point-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  margin-bottom: 8px;
}

.timeline-point:hover .point-tooltip {
  opacity: 1;
}

.tooltip-title {
  font-weight: 500;
}

.tooltip-date {
  opacity: 0.8;
}

.timeline-controls-horizontal {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.scroll-btn, .zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 网格时间轴 */
.grid-timeline {
  padding: 20px;
}

.grid-header {
  margin-bottom: 20px;
}

.grid-years {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.grid-year {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.grid-year:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.grid-year.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.grid-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.grid-month {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.month-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.month-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.grid-event:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
}

.grid-event-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.grid-event-title {
  flex: 1;
  font-size: 11px;
  color: #333;
  font-weight: 500;
}

.grid-event-date {
  font-size: 10px;
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

.event-detail-modal,
.filters-modal {
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

/* 事件详情 */
.event-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.detail-type {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.detail-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.detail-description {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.detail-participants h4,
.detail-images h4,
.detail-related h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.participant-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.participant-card:hover {
  background: #f0f0f0;
}

.participant-card img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-info {
  text-align: center;
}

.participant-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 2px;
}

.participant-role {
  font-size: 10px;
  color: #999;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.detail-image {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.related-event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.related-event:hover {
  background: #f0f0f0;
}

.related-event-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.related-event-info {
  flex: 1;
}

.related-event-title {
  font-size: 12px;
  color: #333;
  margin-bottom: 2px;
}

.related-event-date {
  font-size: 10px;
  color: #999;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.edit-btn, .share-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.share-btn {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 筛选器 */
.filter-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.filter-option input[type="checkbox"] {
  accent-color: #07c160;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.option-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.date-inputs {
  display: flex;
  gap: 8px;
}

.date-inputs input {
  flex: 1;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 14px;
}

.member-search input {
  width: 100%;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}

.search-results {
  margin-top: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.search-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-result:hover {
  background: #f0f0f0;
}

.search-result img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.selected-member {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
}

.selected-member img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.remove-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: #ccc;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.apply-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* 添加事件按钮 */
.add-event-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: #07c160;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
  z-index: 50;
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
  .timeline-event {
    flex-direction: column !important;
    align-items: center;
  }

  .event-marker {
    position: relative;
    left: auto;
    transform: none;
    margin-bottom: 12px;
  }

  .marker-line {
    display: none;
  }

  .event-card {
    max-width: 100%;
    margin: 0 !important;
  }

  .timeline-line {
    display: none;
  }

  .grid-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .participants-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .images-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

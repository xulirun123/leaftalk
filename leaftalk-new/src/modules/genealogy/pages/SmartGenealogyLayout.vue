<template>
  <div class="smart-genealogy-layout">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">智能族谱布局</h1>
      <button @click="showLayoutSettings = true" class="settings-btn">
        <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 布局控制面板 -->
    <div class="layout-controls">
      <div class="controls-header">
        <h3>布局设置</h3>
        <div class="layout-info">{{ currentMembers.length }}位成员</div>
      </div>
      
      <div class="control-groups">
        <!-- 布局算法选择 -->
        <div class="control-group">
          <label>布局算法</label>
          <select v-model="layoutAlgorithm" @change="applyLayout">
            <option value="hierarchical">层次布局</option>
            <option value="force-directed">力导向布局</option>
            <option value="circular">环形布局</option>
            <option value="tree">树形布局</option>
            <option value="grid">网格布局</option>
            <option value="radial">辐射布局</option>
          </select>
        </div>
        
        <!-- 地域风格选择 -->
        <div class="control-group">
          <label>地域风格</label>
          <select v-model="regionalStyle" @change="applyRegionalStyle">
            <option value="traditional">传统中式</option>
            <option value="guangdong">广东客家</option>
            <option value="fujian">福建闽南</option>
            <option value="jiangnan">江南水乡</option>
            <option value="northern">北方传统</option>
            <option value="modern">现代简约</option>
          </select>
        </div>
        
        <!-- 显示选项 -->
        <div class="control-group">
          <label>显示选项</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="showOptions.photos" @change="updateDisplay" />
              <span>显示头像</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="showOptions.dates" @change="updateDisplay" />
              <span>显示日期</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="showOptions.locations" @change="updateDisplay" />
              <span>显示地址</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="showOptions.relationships" @change="updateDisplay" />
              <span>显示关系线</span>
            </label>
          </div>
        </div>
        
        <!-- 布局参数 -->
        <div class="control-group">
          <label>布局参数</label>
          <div class="slider-group">
            <div class="slider-item">
              <label>节点间距</label>
              <input 
                type="range" 
                v-model="layoutParams.nodeSpacing" 
                min="50" 
                max="200" 
                @input="applyLayout"
              />
              <span>{{ layoutParams.nodeSpacing }}px</span>
            </div>
            <div class="slider-item">
              <label>层级间距</label>
              <input 
                type="range" 
                v-model="layoutParams.levelSpacing" 
                min="80" 
                max="300" 
                @input="applyLayout"
              />
              <span>{{ layoutParams.levelSpacing }}px</span>
            </div>
            <div class="slider-item">
              <label>缩放比例</label>
              <input 
                type="range" 
                v-model="layoutParams.scale" 
                min="0.5" 
                max="2" 
                step="0.1" 
                @input="updateScale"
              />
              <span>{{ (layoutParams.scale * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="control-actions">
        <button @click="autoOptimize" class="optimize-btn">
          <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
          <span>智能优化</span>
        </button>
        <button @click="resetLayout" class="reset-btn">
          <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
          <span>重置布局</span>
        </button>
      </div>
    </div>

    <!-- 族谱画布 -->
    <div class="genealogy-canvas-container" :class="regionalStyle">
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <button @click="zoomIn" class="tool-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          </button>
          <button @click="zoomOut" class="tool-btn">
            <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
          </button>
          <button @click="fitToScreen" class="tool-btn">
            <iconify-icon icon="heroicons:arrows-pointing-out" width="16"></iconify-icon>
          </button>
        </div>
        
        <div class="toolbar-center">
          <div class="generation-navigator">
            <button 
              v-for="generation in visibleGenerations" 
              :key="generation"
              @click="focusGeneration(generation)"
              :class="{ active: focusedGeneration === generation }"
              class="generation-btn"
            >
              {{ getGenerationName(generation) }}
            </button>
          </div>
        </div>
        
        <div class="toolbar-right">
          <button @click="exportLayout" class="tool-btn">
            <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
          </button>
          <button @click="shareLayout" class="tool-btn">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
          </button>
        </div>
      </div>
      
      <div 
        class="genealogy-canvas"
        ref="canvasContainer"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <svg 
          ref="svgCanvas"
          :width="canvasSize.width"
          :height="canvasSize.height"
          :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
          class="genealogy-svg"
        >
          <!-- 背景网格 -->
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" stroke-width="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" v-if="showOptions.grid" />
          
          <!-- 关系连线 -->
          <g class="relationships-layer" v-if="showOptions.relationships">
            <path 
              v-for="relationship in relationships" 
              :key="relationship.id"
              :d="relationship.path"
              :class="['relationship-line', relationship.type]"
              :stroke="getRelationshipColor(relationship.type)"
              :stroke-width="getRelationshipWidth(relationship.type)"
              fill="none"
              :marker-end="relationship.hasArrow ? 'url(#arrowhead)' : ''"
            />
          </g>
          
          <!-- 家族成员节点 -->
          <g class="members-layer">
            <g 
              v-for="member in positionedMembers" 
              :key="member.id"
              :transform="`translate(${member.x}, ${member.y})`"
              :class="['member-node', member.gender, { 
                selected: selectedMember?.id === member.id,
                highlighted: highlightedMembers.includes(member.id),
                deceased: member.deathDate 
              }]"
              @click="selectMember(member)"
              @mouseenter="highlightRelated(member)"
              @mouseleave="clearHighlight"
            >
              <!-- 节点背景 -->
              <rect 
                :width="nodeSize.width"
                :height="nodeSize.height"
                :rx="getNodeRadius()"
                :class="['node-background', regionalStyle]"
                :fill="getNodeColor(member)"
                :stroke="getNodeBorder(member)"
                :stroke-width="getNodeBorderWidth(member)"
              />
              
              <!-- 头像 -->
              <image 
                v-if="showOptions.photos && member.avatar"
                :href="member.avatar"
                :x="nodeSize.padding"
                :y="nodeSize.padding"
                :width="nodeSize.avatarSize"
                :height="nodeSize.avatarSize"
                :clip-path="'url(#avatarClip)'"
                class="member-avatar"
              />
              
              <!-- 默认头像图标 -->
              <g v-else-if="showOptions.photos" class="default-avatar">
                <circle 
                  :cx="nodeSize.padding + nodeSize.avatarSize / 2"
                  :cy="nodeSize.padding + nodeSize.avatarSize / 2"
                  :r="nodeSize.avatarSize / 2"
                  fill="#e0e0e0"
                />
                <text 
                  :x="nodeSize.padding + nodeSize.avatarSize / 2"
                  :y="nodeSize.padding + nodeSize.avatarSize / 2 + 4"
                  text-anchor="middle"
                  font-size="12"
                  fill="#999"
                >
                  {{ member.name.charAt(0) }}
                </text>
              </g>
              
              <!-- 姓名 -->
              <text 
                :x="nodeSize.width / 2"
                :y="showOptions.photos ? nodeSize.padding + nodeSize.avatarSize + 20 : nodeSize.height / 2"
                text-anchor="middle"
                :class="['member-name', regionalStyle]"
                :font-size="getNameFontSize()"
                :fill="getNameColor(member)"
              >
                {{ member.name }}
              </text>
              
              <!-- 生卒年份 -->
              <text 
                v-if="showOptions.dates && (member.birthDate || member.deathDate)"
                :x="nodeSize.width / 2"
                :y="showOptions.photos ? nodeSize.padding + nodeSize.avatarSize + 35 : nodeSize.height / 2 + 15"
                text-anchor="middle"
                class="member-dates"
                font-size="10"
                fill="#666"
              >
                {{ formatDateRange(member.birthDate, member.deathDate) }}
              </text>
              
              <!-- 地址信息 -->
              <text 
                v-if="showOptions.locations && member.location"
                :x="nodeSize.width / 2"
                :y="showOptions.photos ? nodeSize.padding + nodeSize.avatarSize + 50 : nodeSize.height / 2 + 30"
                text-anchor="middle"
                class="member-location"
                font-size="9"
                fill="#999"
              >
                {{ member.location }}
              </text>
              
              <!-- 世代标记 -->
              <circle 
                :cx="nodeSize.width - 10"
                :cy="10"
                r="8"
                :class="['generation-badge', regionalStyle]"
                :fill="getGenerationColor(member.generation)"
              />
              <text 
                :x="nodeSize.width - 10"
                :y="14"
                text-anchor="middle"
                font-size="8"
                fill="white"
                font-weight="bold"
              >
                {{ member.generation }}
              </text>
              
              <!-- 特殊标记 -->
              <g v-if="member.isPatriarch" class="patriarch-crown">
                <path 
                  d="M 5 5 L 10 0 L 15 5 L 12 8 L 8 8 Z"
                  fill="#FFD700"
                  stroke="#FFA000"
                  stroke-width="1"
                />
              </g>
              
              <g v-if="member.deathDate" class="deceased-mark">
                <rect 
                  x="2" 
                  y="2" 
                  width="16" 
                  height="16" 
                  fill="rgba(0,0,0,0.7)" 
                  rx="2"
                />
                <text 
                  x="10" 
                  y="12" 
                  text-anchor="middle" 
                  font-size="8" 
                  fill="white"
                >
                  逝
                </text>
              </g>
            </g>
          </g>
          
          <!-- 箭头标记定义 -->
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
            
            <clipPath id="avatarClip">
              <circle :cx="nodeSize.avatarSize / 2" :cy="nodeSize.avatarSize / 2" :r="nodeSize.avatarSize / 2" />
            </clipPath>
          </defs>
        </svg>
        
        <!-- 成员详情悬浮卡片 -->
        <div 
          v-if="hoveredMember" 
          class="member-tooltip"
          :style="{ 
            left: tooltipPosition.x + 'px', 
            top: tooltipPosition.y + 'px' 
          }"
        >
          <div class="tooltip-header">
            <img :src="hoveredMember.avatar || '/default-avatar.png'" :alt="hoveredMember.name" />
            <div class="tooltip-info">
              <div class="tooltip-name">{{ hoveredMember.name }}</div>
              <div class="tooltip-generation">第{{ hoveredMember.generation }}世</div>
            </div>
          </div>
          <div class="tooltip-details">
            <div v-if="hoveredMember.birthDate" class="tooltip-item">
              <iconify-icon icon="heroicons:calendar" width="12"></iconify-icon>
              <span>{{ formatDate(hoveredMember.birthDate) }}</span>
            </div>
            <div v-if="hoveredMember.location" class="tooltip-item">
              <iconify-icon icon="heroicons:map-pin" width="12"></iconify-icon>
              <span>{{ hoveredMember.location }}</span>
            </div>
            <div v-if="hoveredMember.occupation" class="tooltip-item">
              <iconify-icon icon="heroicons:briefcase" width="12"></iconify-icon>
              <span>{{ hoveredMember.occupation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 布局设置弹窗 -->
    <div v-if="showLayoutSettings" class="modal-overlay" @click="showLayoutSettings = false">
      <div class="layout-settings-modal" @click.stop>
        <div class="modal-header">
          <h3>高级布局设置</h3>
          <button @click="showLayoutSettings = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="settings-sections">
            <!-- 算法参数 -->
            <div class="settings-section">
              <h4>算法参数</h4>
              <div class="parameter-grid">
                <div class="parameter-item">
                  <label>迭代次数</label>
                  <input type="number" v-model="algorithmParams.iterations" min="10" max="1000" />
                </div>
                <div class="parameter-item">
                  <label>收敛阈值</label>
                  <input type="number" v-model="algorithmParams.threshold" min="0.1" max="10" step="0.1" />
                </div>
                <div class="parameter-item">
                  <label>弹簧强度</label>
                  <input type="number" v-model="algorithmParams.springStrength" min="0.1" max="2" step="0.1" />
                </div>
                <div class="parameter-item">
                  <label>排斥力</label>
                  <input type="number" v-model="algorithmParams.repulsionForce" min="100" max="2000" step="100" />
                </div>
              </div>
            </div>
            
            <!-- 视觉样式 -->
            <div class="settings-section">
              <h4>视觉样式</h4>
              <div class="style-options">
                <div class="style-group">
                  <label>节点形状</label>
                  <select v-model="visualStyle.nodeShape">
                    <option value="rectangle">矩形</option>
                    <option value="circle">圆形</option>
                    <option value="hexagon">六边形</option>
                    <option value="diamond">菱形</option>
                  </select>
                </div>
                <div class="style-group">
                  <label>连线样式</label>
                  <select v-model="visualStyle.lineStyle">
                    <option value="straight">直线</option>
                    <option value="curved">曲线</option>
                    <option value="orthogonal">直角</option>
                    <option value="bezier">贝塞尔</option>
                  </select>
                </div>
                <div class="style-group">
                  <label>颜色主题</label>
                  <select v-model="visualStyle.colorTheme">
                    <option value="traditional">传统</option>
                    <option value="modern">现代</option>
                    <option value="elegant">典雅</option>
                    <option value="vibrant">鲜艳</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- 性能设置 -->
            <div class="settings-section">
              <h4>性能设置</h4>
              <div class="performance-options">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="performanceSettings.enableAnimation" />
                  <span>启用动画效果</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="performanceSettings.enableShadows" />
                  <span>启用阴影效果</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="performanceSettings.enableAntialiasing" />
                  <span>启用抗锯齿</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="performanceSettings.enableLOD" />
                  <span>启用细节层次</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="resetToDefaults" class="reset-btn">恢复默认</button>
          <button @click="applyAdvancedSettings" class="apply-btn">应用设置</button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLayouting" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在计算布局...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// DOM引用
const canvasContainer = ref(null)
const svgCanvas = ref(null)

// 状态
const isLayouting = ref(false)
const showLayoutSettings = ref(false)
const selectedMember = ref(null)
const hoveredMember = ref(null)
const highlightedMembers = ref([])
const focusedGeneration = ref(null)

// 布局设置
const layoutAlgorithm = ref('hierarchical')
const regionalStyle = ref('traditional')

// 显示选项
const showOptions = reactive({
  photos: true,
  dates: true,
  locations: false,
  relationships: true,
  grid: false
})

// 布局参数
const layoutParams = reactive({
  nodeSpacing: 120,
  levelSpacing: 150,
  scale: 1.0
})

// 算法参数
const algorithmParams = reactive({
  iterations: 100,
  threshold: 1.0,
  springStrength: 0.5,
  repulsionForce: 500
})

// 视觉样式
const visualStyle = reactive({
  nodeShape: 'rectangle',
  lineStyle: 'curved',
  colorTheme: 'traditional'
})

// 性能设置
const performanceSettings = reactive({
  enableAnimation: true,
  enableShadows: true,
  enableAntialiasing: true,
  enableLOD: false
})

// 画布设置
const canvasSize = reactive({
  width: 2000,
  height: 1500
})

const viewBox = reactive({
  x: 0,
  y: 0,
  width: 800,
  height: 600
})

const nodeSize = reactive({
  width: 100,
  height: 80,
  padding: 8,
  avatarSize: 32
})

// 交互状态
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const tooltipPosition = reactive({ x: 0, y: 0 })

// 家族成员数据
const familyMembers = ref([
  {
    id: 1,
    name: '叶德华',
    gender: 'male',
    generation: 1,
    birthDate: '1920-01-15',
    deathDate: '1995-12-31',
    location: '广东梅州',
    occupation: '教师',
    avatar: '/mock-avatar-1.jpg',
    isPatriarch: true,
    fatherId: null,
    motherId: null,
    spouseIds: [2]
  },
  {
    id: 2,
    name: '王秀英',
    gender: 'female',
    generation: 1,
    birthDate: '1925-03-20',
    deathDate: '2000-08-15',
    location: '广东梅州',
    occupation: '家庭主妇',
    avatar: '/mock-avatar-5.jpg',
    isPatriarch: false,
    fatherId: null,
    motherId: null,
    spouseIds: [1]
  },
  {
    id: 3,
    name: '叶建国',
    gender: 'male',
    generation: 2,
    birthDate: '1950-06-10',
    deathDate: null,
    location: '广东广州',
    occupation: '工程师',
    avatar: '/mock-avatar-2.jpg',
    isPatriarch: false,
    fatherId: 1,
    motherId: 2,
    spouseIds: [4]
  },
  {
    id: 4,
    name: '李美华',
    gender: 'female',
    generation: 2,
    birthDate: '1955-10-01',
    deathDate: null,
    location: '广东深圳',
    occupation: '护士',
    avatar: '/mock-avatar-7.jpg',
    isPatriarch: false,
    fatherId: null,
    motherId: null,
    spouseIds: [3]
  },
  {
    id: 5,
    name: '叶小明',
    gender: 'male',
    generation: 3,
    birthDate: '1980-12-05',
    deathDate: null,
    location: '北京朝阳',
    occupation: '软件工程师',
    avatar: '/mock-avatar-3.jpg',
    isPatriarch: false,
    fatherId: 3,
    motherId: 4,
    spouseIds: []
  },
  {
    id: 6,
    name: '叶小红',
    gender: 'female',
    generation: 3,
    birthDate: '1985-05-20',
    deathDate: null,
    location: '上海浦东',
    occupation: '医生',
    avatar: '/mock-avatar-4.jpg',
    isPatriarch: false,
    fatherId: 3,
    motherId: 4,
    spouseIds: []
  }
])

// 关系数据
const relationships = ref([])

// 定位后的成员数据
const positionedMembers = ref([])

// 计算属性
const currentMembers = computed(() => {
  return familyMembers.value
})

const visibleGenerations = computed(() => {
  const generations = [...new Set(familyMembers.value.map(m => m.generation))]
  return generations.sort((a, b) => a - b)
})

// 生命周期
onMounted(() => {
  loadGenealogyData()
  initializeCanvas()
  applyLayout()
})

// 监听器
watch([layoutAlgorithm, layoutParams], () => {
  applyLayout()
}, { deep: true })

// 方法
const loadGenealogyData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/smart-layout`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        familyMembers.value = result.data.members || familyMembers.value
      }
    }
  } catch (error) {
    console.error('加载族谱数据失败:', error)
    // 使用模拟数据
  }
}

const initializeCanvas = () => {
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    viewBox.width = rect.width
    viewBox.height = rect.height
  }
}

const applyLayout = async () => {
  if (isLayouting.value) return

  isLayouting.value = true

  try {
    await nextTick()

    switch (layoutAlgorithm.value) {
      case 'hierarchical':
        await applyHierarchicalLayout()
        break
      case 'force-directed':
        await applyForceDirectedLayout()
        break
      case 'circular':
        await applyCircularLayout()
        break
      case 'tree':
        await applyTreeLayout()
        break
      case 'grid':
        await applyGridLayout()
        break
      case 'radial':
        await applyRadialLayout()
        break
    }

    generateRelationships()
  } finally {
    isLayouting.value = false
  }
}

const applyHierarchicalLayout = async () => {
  const generations = {}

  // 按世代分组
  familyMembers.value.forEach(member => {
    if (!generations[member.generation]) {
      generations[member.generation] = []
    }
    generations[member.generation].push(member)
  })

  const positioned = []
  const generationKeys = Object.keys(generations).sort((a, b) => parseInt(a) - parseInt(b))

  generationKeys.forEach((gen, genIndex) => {
    const members = generations[gen]
    const y = genIndex * layoutParams.levelSpacing + 100

    members.forEach((member, memberIndex) => {
      const totalWidth = members.length * layoutParams.nodeSpacing
      const startX = (canvasSize.width - totalWidth) / 2
      const x = startX + memberIndex * layoutParams.nodeSpacing

      positioned.push({
        ...member,
        x,
        y
      })
    })
  })

  positionedMembers.value = positioned
}

const applyForceDirectedLayout = async () => {
  const nodes = familyMembers.value.map(member => ({
    ...member,
    x: Math.random() * canvasSize.width,
    y: Math.random() * canvasSize.height,
    vx: 0,
    vy: 0
  }))

  // 力导向算法迭代
  for (let i = 0; i < algorithmParams.iterations; i++) {
    // 计算排斥力
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const dx = nodes[k].x - nodes[j].x
        const dy = nodes[k].y - nodes[j].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        const force = algorithmParams.repulsionForce / (distance * distance)
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force

        nodes[j].vx -= fx
        nodes[j].vy -= fy
        nodes[k].vx += fx
        nodes[k].vy += fy
      }
    }

    // 计算吸引力（基于家族关系）
    nodes.forEach(node => {
      if (node.fatherId || node.motherId) {
        const father = nodes.find(n => n.id === node.fatherId)
        const mother = nodes.find(n => n.id === node.motherId)

        if (father) {
          const dx = father.x - node.x
          const dy = father.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = algorithmParams.springStrength * distance
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          node.vx += fx * 0.1
          node.vy += fy * 0.1
          father.vx -= fx * 0.1
          father.vy -= fy * 0.1
        }

        if (mother) {
          const dx = mother.x - node.x
          const dy = mother.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = algorithmParams.springStrength * distance
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          node.vx += fx * 0.1
          node.vy += fy * 0.1
          mother.vx -= fx * 0.1
          mother.vy -= fy * 0.1
        }
      }
    })

    // 更新位置
    nodes.forEach(node => {
      node.x += node.vx * 0.1
      node.y += node.vy * 0.1
      node.vx *= 0.9
      node.vy *= 0.9

      // 边界约束
      node.x = Math.max(nodeSize.width, Math.min(canvasSize.width - nodeSize.width, node.x))
      node.y = Math.max(nodeSize.height, Math.min(canvasSize.height - nodeSize.height, node.y))
    })

    // 检查收敛
    const totalVelocity = nodes.reduce((sum, node) =>
      sum + Math.sqrt(node.vx * node.vx + node.vy * node.vy), 0)

    if (totalVelocity < algorithmParams.threshold) {
      break
    }
  }

  positionedMembers.value = nodes
}

const applyCircularLayout = async () => {
  const centerX = canvasSize.width / 2
  const centerY = canvasSize.height / 2
  const radius = Math.min(centerX, centerY) - 100

  const positioned = familyMembers.value.map((member, index) => {
    const angle = (index / familyMembers.value.length) * 2 * Math.PI
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    return {
      ...member,
      x,
      y
    }
  })

  positionedMembers.value = positioned
}

const applyTreeLayout = async () => {
  // 找到根节点（族长）
  const root = familyMembers.value.find(m => m.isPatriarch) || familyMembers.value[0]

  const buildTree = (nodeId, level = 0) => {
    const node = familyMembers.value.find(m => m.id === nodeId)
    if (!node) return null

    const children = familyMembers.value.filter(m => m.fatherId === nodeId || m.motherId === nodeId)

    return {
      ...node,
      level,
      children: children.map(child => buildTree(child.id, level + 1)).filter(Boolean)
    }
  }

  const tree = buildTree(root.id)
  const positioned = []

  const positionNode = (node, x, y, width) => {
    positioned.push({
      ...node,
      x,
      y
    })

    if (node.children && node.children.length > 0) {
      const childWidth = width / node.children.length
      node.children.forEach((child, index) => {
        const childX = x - width / 2 + (index + 0.5) * childWidth
        const childY = y + layoutParams.levelSpacing
        positionNode(child, childX, childY, childWidth)
      })
    }
  }

  positionNode(tree, canvasSize.width / 2, 100, canvasSize.width - 200)
  positionedMembers.value = positioned
}

const applyGridLayout = async () => {
  const cols = Math.ceil(Math.sqrt(familyMembers.value.length))
  const rows = Math.ceil(familyMembers.value.length / cols)

  const positioned = familyMembers.value.map((member, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)

    const x = (col + 1) * (canvasSize.width / (cols + 1))
    const y = (row + 1) * (canvasSize.height / (rows + 1))

    return {
      ...member,
      x,
      y
    }
  })

  positionedMembers.value = positioned
}

const applyRadialLayout = async () => {
  // 找到中心节点
  const center = familyMembers.value.find(m => m.isPatriarch) || familyMembers.value[0]
  const centerX = canvasSize.width / 2
  const centerY = canvasSize.height / 2

  const positioned = []
  const processed = new Set()

  // 中心节点
  positioned.push({
    ...center,
    x: centerX,
    y: centerY
  })
  processed.add(center.id)

  // 按层级放置
  let currentLevel = [center]
  let radius = 150

  while (currentLevel.length > 0) {
    const nextLevel = []

    currentLevel.forEach(parent => {
      const children = familyMembers.value.filter(m =>
        (m.fatherId === parent.id || m.motherId === parent.id) && !processed.has(m.id)
      )

      children.forEach((child, index) => {
        const angle = (index / children.length) * 2 * Math.PI
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        positioned.push({
          ...child,
          x,
          y
        })
        processed.add(child.id)
        nextLevel.push(child)
      })
    })

    currentLevel = nextLevel
    radius += 120
  }

  positionedMembers.value = positioned
}

const generateRelationships = () => {
  const relations = []

  positionedMembers.value.forEach(member => {
    // 父子关系
    if (member.fatherId) {
      const father = positionedMembers.value.find(m => m.id === member.fatherId)
      if (father) {
        relations.push({
          id: `father-${father.id}-${member.id}`,
          type: 'parent',
          from: father,
          to: member,
          path: generatePath(father, member),
          hasArrow: true
        })
      }
    }

    if (member.motherId) {
      const mother = positionedMembers.value.find(m => m.id === member.motherId)
      if (mother) {
        relations.push({
          id: `mother-${mother.id}-${member.id}`,
          type: 'parent',
          from: mother,
          to: member,
          path: generatePath(mother, member),
          hasArrow: true
        })
      }
    }

    // 夫妻关系
    member.spouseIds?.forEach(spouseId => {
      const spouse = positionedMembers.value.find(m => m.id === spouseId)
      if (spouse && member.id < spouse.id) { // 避免重复
        relations.push({
          id: `spouse-${member.id}-${spouse.id}`,
          type: 'spouse',
          from: member,
          to: spouse,
          path: generatePath(member, spouse),
          hasArrow: false
        })
      }
    })
  })

  relationships.value = relations
}

const generatePath = (from, to) => {
  const startX = from.x + nodeSize.width / 2
  const startY = from.y + nodeSize.height / 2
  const endX = to.x + nodeSize.width / 2
  const endY = to.y + nodeSize.height / 2

  if (visualStyle.lineStyle === 'straight') {
    return `M ${startX} ${startY} L ${endX} ${endY}`
  } else if (visualStyle.lineStyle === 'curved') {
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2 - 30
    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`
  } else if (visualStyle.lineStyle === 'orthogonal') {
    const midY = (startY + endY) / 2
    return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`
  } else {
    // bezier
    const cp1X = startX + (endX - startX) * 0.3
    const cp1Y = startY
    const cp2X = startX + (endX - startX) * 0.7
    const cp2Y = endY
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`
  }
}

const applyRegionalStyle = () => {
  // 应用地域风格
  updateDisplay()
}

const updateDisplay = () => {
  // 更新显示
  nextTick(() => {
    generateRelationships()
  })
}

const updateScale = () => {
  // 更新缩放
}

const autoOptimize = async () => {
  isLayouting.value = true

  try {
    // 智能优化算法
    const memberCount = familyMembers.value.length

    if (memberCount <= 10) {
      layoutAlgorithm.value = 'hierarchical'
      layoutParams.nodeSpacing = 150
      layoutParams.levelSpacing = 120
    } else if (memberCount <= 30) {
      layoutAlgorithm.value = 'tree'
      layoutParams.nodeSpacing = 120
      layoutParams.levelSpacing = 100
    } else {
      layoutAlgorithm.value = 'force-directed'
      layoutParams.nodeSpacing = 100
      layoutParams.levelSpacing = 80
    }

    await applyLayout()
    appStore.showToast('布局已自动优化', 'success')
  } finally {
    isLayouting.value = false
  }
}

const resetLayout = () => {
  layoutParams.nodeSpacing = 120
  layoutParams.levelSpacing = 150
  layoutParams.scale = 1.0
  layoutAlgorithm.value = 'hierarchical'
  applyLayout()
}

// 交互方法
const zoomIn = () => {
  layoutParams.scale = Math.min(layoutParams.scale * 1.2, 3)
  updateScale()
}

const zoomOut = () => {
  layoutParams.scale = Math.max(layoutParams.scale / 1.2, 0.3)
  updateScale()
}

const fitToScreen = () => {
  layoutParams.scale = 1.0
  viewBox.x = 0
  viewBox.y = 0
  updateScale()
}

const focusGeneration = (generation) => {
  focusedGeneration.value = generation
  const generationMembers = positionedMembers.value.filter(m => m.generation === generation)

  if (generationMembers.length > 0) {
    const avgX = generationMembers.reduce((sum, m) => sum + m.x, 0) / generationMembers.length
    const avgY = generationMembers.reduce((sum, m) => sum + m.y, 0) / generationMembers.length

    viewBox.x = avgX - viewBox.width / 2
    viewBox.y = avgY - viewBox.height / 2
  }
}

const selectMember = (member) => {
  selectedMember.value = member
}

const highlightRelated = (member) => {
  const related = []

  // 添加父母
  if (member.fatherId) related.push(member.fatherId)
  if (member.motherId) related.push(member.motherId)

  // 添加配偶
  if (member.spouseIds) related.push(...member.spouseIds)

  // 添加子女
  const children = familyMembers.value.filter(m =>
    m.fatherId === member.id || m.motherId === member.id
  )
  related.push(...children.map(c => c.id))

  highlightedMembers.value = related
  hoveredMember.value = member
}

const clearHighlight = () => {
  highlightedMembers.value = []
  hoveredMember.value = null
}

const exportLayout = () => {
  // 导出布局为图片
  appStore.showToast('导出功能开发中', 'info')
}

const shareLayout = () => {
  // 分享布局
  appStore.showToast('分享功能开发中', 'info')
}

// 鼠标事件
const handleMouseDown = (event) => {
  isDragging.value = true
  dragStart.x = event.clientX
  dragStart.y = event.clientY
}

const handleMouseMove = (event) => {
  if (isDragging.value) {
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y

    viewBox.x -= dx / layoutParams.scale
    viewBox.y -= dy / layoutParams.y

    dragStart.x = event.clientX
    dragStart.y = event.clientY
  }

  // 更新tooltip位置
  tooltipPosition.x = event.clientX + 10
  tooltipPosition.y = event.clientY + 10
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  layoutParams.scale = Math.max(0.3, Math.min(3, layoutParams.scale * delta))
  updateScale()
}

// 触摸事件
const handleTouchStart = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    dragStart.x = touch.clientX
    dragStart.y = touch.clientY
    isDragging.value = true
  }
}

const handleTouchMove = (event) => {
  if (isDragging.value && event.touches.length === 1) {
    const touch = event.touches[0]
    const dx = touch.clientX - dragStart.x
    const dy = touch.clientY - dragStart.y

    viewBox.x -= dx / layoutParams.scale
    viewBox.y -= dy / layoutParams.scale

    dragStart.x = touch.clientX
    dragStart.y = touch.clientY
  }
}

const handleTouchEnd = () => {
  isDragging.value = false
}

// 高级设置
const resetToDefaults = () => {
  Object.assign(algorithmParams, {
    iterations: 100,
    threshold: 1.0,
    springStrength: 0.5,
    repulsionForce: 500
  })

  Object.assign(visualStyle, {
    nodeShape: 'rectangle',
    lineStyle: 'curved',
    colorTheme: 'traditional'
  })

  Object.assign(performanceSettings, {
    enableAnimation: true,
    enableShadows: true,
    enableAntialiasing: true,
    enableLOD: false
  })
}

const applyAdvancedSettings = () => {
  applyLayout()
  showLayoutSettings.value = false
  appStore.showToast('设置已应用', 'success')
}

// 辅助方法
const getNodeRadius = () => {
  return visualStyle.nodeShape === 'circle' ? nodeSize.width / 2 : 8
}

const getNodeColor = (member) => {
  const colors = {
    traditional: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
    modern: member.gender === 'male' ? '#F3E5F5' : '#E8F5E8',
    elegant: member.gender === 'male' ? '#FFF3E0' : '#F1F8E9',
    vibrant: member.gender === 'male' ? '#E0F2F1' : '#FFF8E1'
  }
  return colors[visualStyle.colorTheme] || colors.traditional
}

const getNodeBorder = (member) => {
  if (selectedMember.value?.id === member.id) return '#07c160'
  if (highlightedMembers.value.includes(member.id)) return '#ff9800'
  return member.gender === 'male' ? '#2196F3' : '#E91E63'
}

const getNodeBorderWidth = (member) => {
  if (selectedMember.value?.id === member.id) return 3
  if (highlightedMembers.value.includes(member.id)) return 2
  return 1
}

const getNameFontSize = () => {
  return Math.max(10, 14 / layoutParams.scale)
}

const getNameColor = (member) => {
  return member.deathDate ? '#999' : '#333'
}

const getGenerationColor = (generation) => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4']
  return colors[(generation - 1) % colors.length]
}

const getGenerationName = (generation) => {
  const names = ['一世', '二世', '三世', '四世', '五世', '六世', '七世', '八世']
  return names[generation - 1] || `${generation}世`
}

const getRelationshipColor = (type) => {
  return type === 'spouse' ? '#e91e63' : '#666'
}

const getRelationshipWidth = (type) => {
  return type === 'spouse' ? 3 : 2
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateRange = (birthDate, deathDate) => {
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : ''
  return death ? `${birth}-${death}` : `${birth}-`
}

// 生命周期 - 清理资源防止内存泄漏
onUnmounted(() => {
  // 清理所有定时器
  const timers = [layoutAnimationTimer, performanceTimer, autoSaveTimer]
  timers.forEach(timer => {
    if (timer) {
      clearInterval(timer)
      clearTimeout(timer)
    }
  })

  // 清理事件监听器
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('beforeunload', handleBeforeUnload)

  // 清理Canvas上下文
  if (canvasContext) {
    canvasContext.clearRect(0, 0, canvasSize.width, canvasSize.height)
  }

  // 清理大型数据结构
  currentMembers.value = []
  layoutCache.clear()

  console.log('🧹 SmartGenealogyLayout 资源已清理')
})

// 定义可能的定时器变量
let layoutAnimationTimer: number | null = null
let performanceTimer: number | null = null
let autoSaveTimer: number | null = null
let canvasContext: CanvasRenderingContext2D | null = null

// 添加窗口事件处理
const handleResize = () => {
  // 处理窗口大小变化
}

const handleBeforeUnload = () => {
  // 页面卸载前保存状态
}
</script>

<style scoped>
.smart-genealogy-layout {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
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

.back-btn, .settings-btn {
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

.settings-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 布局控制面板 */
.layout-controls {
  background: white;
  margin: 16px;
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

.layout-info {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

.control-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  accent-color: #07c160;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-item label {
  min-width: 60px;
  font-size: 11px;
}

.slider-item input[type="range"] {
  flex: 1;
  accent-color: #07c160;
}

.slider-item span {
  min-width: 40px;
  font-size: 11px;
  color: #666;
  text-align: right;
}

.control-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.optimize-btn, .reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.optimize-btn {
  background: #07c160;
  color: white;
}

.optimize-btn:hover {
  background: #06a552;
}

.reset-btn {
  background: #f0f0f0;
  color: #666;
}

.reset-btn:hover {
  background: #e0e0e0;
}

/* 族谱画布容器 */
.genealogy-canvas-container {
  flex: 1;
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 地域风格 */
.genealogy-canvas-container.traditional {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.genealogy-canvas-container.guangdong {
  background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%);
}

.genealogy-canvas-container.fujian {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.genealogy-canvas-container.jiangnan {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.genealogy-canvas-container.northern {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
}

.genealogy-canvas-container.modern {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
}

/* 画布工具栏 */
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #eee;
  backdrop-filter: blur(10px);
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 8px;
}

.tool-btn {
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
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #07c160;
  color: #07c160;
}

.generation-navigator {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  max-width: 300px;
}

.generation-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.generation-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.generation-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 族谱画布 */
.genealogy-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.genealogy-canvas:active {
  cursor: grabbing;
}

.genealogy-svg {
  width: 100%;
  height: 100%;
  user-select: none;
}

/* 关系连线 */
.relationship-line {
  transition: stroke-width 0.2s;
}

.relationship-line:hover {
  stroke-width: 4 !important;
}

.relationship-line.parent {
  stroke-dasharray: none;
}

.relationship-line.spouse {
  stroke-dasharray: 5,5;
}

/* 家族成员节点 */
.member-node {
  cursor: pointer;
  transition: all 0.2s;
}

.member-node:hover {
  transform: scale(1.05);
}

.member-node.selected {
  filter: drop-shadow(0 0 8px rgba(7, 193, 96, 0.5));
}

.member-node.highlighted {
  filter: drop-shadow(0 0 6px rgba(255, 152, 0, 0.5));
}

.member-node.deceased {
  opacity: 0.8;
}

.node-background {
  transition: all 0.2s;
}

.node-background.traditional {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
}

.node-background.guangdong {
  filter: drop-shadow(2px 2px 4px rgba(255, 193, 7, 0.2));
}

.node-background.fujian {
  filter: drop-shadow(2px 2px 4px rgba(76, 175, 80, 0.2));
}

.node-background.jiangnan {
  filter: drop-shadow(2px 2px 4px rgba(33, 150, 243, 0.2));
}

.node-background.northern {
  filter: drop-shadow(2px 2px 4px rgba(233, 30, 99, 0.2));
}

.node-background.modern {
  filter: drop-shadow(2px 2px 4px rgba(156, 39, 176, 0.2));
}

.member-avatar {
  border-radius: 50%;
}

.member-name {
  font-weight: 500;
  dominant-baseline: middle;
}

.member-name.traditional {
  font-family: 'SimSun', serif;
}

.member-name.guangdong {
  font-family: 'KaiTi', cursive;
}

.member-name.fujian {
  font-family: 'FangSong', serif;
}

.member-name.jiangnan {
  font-family: 'LiSu', cursive;
}

.member-name.northern {
  font-family: 'YouYuan', fantasy;
}

.member-name.modern {
  font-family: 'Microsoft YaHei', sans-serif;
}

.member-dates, .member-location {
  dominant-baseline: middle;
}

.generation-badge {
  stroke: white;
  stroke-width: 1;
}

.generation-badge.traditional {
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));
}

.patriarch-crown {
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
}

.deceased-mark {
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
}

/* 成员详情悬浮卡片 */
.member-tooltip {
  position: fixed;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 200px;
  pointer-events: none;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tooltip-header img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.tooltip-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.tooltip-generation {
  font-size: 12px;
  color: #666;
}

.tooltip-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

/* 布局设置弹窗 */
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

.layout-settings-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
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

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.parameter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.parameter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.parameter-item label {
  font-size: 12px;
  color: #666;
}

.parameter-item input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.style-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.style-group label {
  font-size: 12px;
  color: #666;
}

.style-group select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.performance-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
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
  .control-groups {
    grid-template-columns: 1fr;
  }

  .parameter-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .canvas-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-center {
    order: 3;
    width: 100%;
  }

  .generation-navigator {
    max-width: 100%;
  }

  .member-tooltip {
    max-width: 150px;
    font-size: 11px;
  }
}

/* 动画效果 */
.member-node {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.relationship-line {
  animation: drawLine 0.8s ease-in-out;
}

@keyframes drawLine {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

/* 打印样式 */
@media print {
  .top-nav,
  .layout-controls,
  .canvas-toolbar {
    display: none;
  }

  .genealogy-canvas-container {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .genealogy-canvas {
    overflow: visible;
  }
}
</style>

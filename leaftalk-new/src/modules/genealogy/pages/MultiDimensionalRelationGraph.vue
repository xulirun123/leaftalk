<template>
  <div class="multi-dimensional-graph">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">多维度关系图</h1>
      <button @click="showSettings = true" class="settings-btn">
        <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 维度选择器 -->
    <div class="dimension-selector">
      <div class="selector-header">
        <h3>选择分析维度</h3>
        <div class="active-dimensions">{{ activeDimensions.length }}个维度</div>
      </div>
      
      <div class="dimension-tabs">
        <button 
          v-for="dimension in dimensions" 
          :key="dimension.id"
          @click="toggleDimension(dimension)"
          :class="{ active: activeDimensions.includes(dimension.id) }"
          class="dimension-tab"
        >
          <iconify-icon :icon="dimension.icon" width="16"></iconify-icon>
          <span>{{ dimension.name }}</span>
          <div v-if="activeDimensions.includes(dimension.id)" class="active-indicator"></div>
        </button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="graph-container">
      <div class="graph-header">
        <div class="graph-title">
          <h3>{{ getGraphTitle() }}</h3>
          <div class="node-count">{{ filteredNodes.length }}个节点</div>
        </div>
        
        <div class="graph-controls">
          <button @click="resetView" class="control-btn">
            <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
            <span>重置</span>
          </button>
          
          <button @click="toggleFullscreen" class="control-btn">
            <iconify-icon icon="heroicons:arrows-pointing-out" width="16"></iconify-icon>
            <span>全屏</span>
          </button>
          
          <button @click="exportGraph" class="control-btn">
            <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            <span>导出</span>
          </button>
        </div>
      </div>
      
      <!-- 图表画布 -->
      <div ref="graphCanvas" class="graph-canvas" :class="{ fullscreen: isFullscreen }">
        <svg 
          ref="svgElement"
          :width="canvasSize.width" 
          :height="canvasSize.height"
          @wheel="handleZoom"
          @mousedown="handlePanStart"
          @mousemove="handlePanMove"
          @mouseup="handlePanEnd"
          @mouseleave="handlePanEnd"
        >
          <!-- 定义渐变和滤镜 -->
          <defs>
            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
            </linearGradient>
            
            <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          
          <!-- 连接线 -->
          <g class="links-group" :transform="getTransform()">
            <line
              v-for="link in visibleLinks"
              :key="`${link.source.id}-${link.target.id}`"
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
              :stroke="getLinkColor(link)"
              :stroke-width="getLinkWidth(link)"
              :stroke-dasharray="getLinkDashArray(link)"
              class="link"
              @click="selectLink(link)"
            />
          </g>
          
          <!-- 节点 -->
          <g class="nodes-group" :transform="getTransform()">
            <g
              v-for="node in visibleNodes"
              :key="node.id"
              :transform="`translate(${node.x}, ${node.y})`"
              class="node-group"
              @click="selectNode(node)"
              @mouseenter="showNodeTooltip(node, $event)"
              @mouseleave="hideNodeTooltip"
            >
              <!-- 节点圆圈 -->
              <circle
                :r="getNodeRadius(node)"
                :fill="getNodeColor(node)"
                :stroke="getNodeBorderColor(node)"
                :stroke-width="getNodeBorderWidth(node)"
                :filter="selectedNode?.id === node.id ? 'url(#nodeShadow)' : ''"
                class="node-circle"
              />
              
              <!-- 节点头像 -->
              <image
                v-if="node.avatar"
                :href="node.avatar"
                :x="-getNodeRadius(node) * 0.7"
                :y="-getNodeRadius(node) * 0.7"
                :width="getNodeRadius(node) * 1.4"
                :height="getNodeRadius(node) * 1.4"
                clip-path="circle()"
                class="node-avatar"
              />
              
              <!-- 节点标签 -->
              <text
                :y="getNodeRadius(node) + 16"
                text-anchor="middle"
                :font-size="getNodeLabelSize(node)"
                :fill="getNodeLabelColor(node)"
                class="node-label"
              >
                {{ node.name }}
              </text>
              
              <!-- 维度指示器 -->
              <g v-if="showDimensionIndicators" class="dimension-indicators">
                <circle
                  v-for="(dimension, index) in getNodeDimensions(node)"
                  :key="dimension"
                  :cx="getIndicatorPosition(index, getNodeDimensions(node).length).x"
                  :cy="getIndicatorPosition(index, getNodeDimensions(node).length).y"
                  :r="3"
                  :fill="getDimensionColor(dimension)"
                  class="dimension-indicator"
                />
              </g>
            </g>
          </g>
          
          <!-- 聚类区域 -->
          <g v-if="showClusters" class="clusters-group" :transform="getTransform()">
            <path
              v-for="cluster in clusters"
              :key="cluster.id"
              :d="cluster.path"
              :fill="cluster.color"
              :fill-opacity="0.1"
              :stroke="cluster.color"
              :stroke-width="2"
              :stroke-dasharray="5,5"
              class="cluster-area"
            />
          </g>
        </svg>
        
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
          </div>
          <div class="loading-text">正在生成关系图...</div>
        </div>
      </div>
    </div>

    <!-- 节点详情面板 -->
    <div v-if="selectedNode" class="node-details-panel" :class="{ expanded: showDetailPanel }">
      <div class="panel-header">
        <div class="node-info">
          <img :src="selectedNode.avatar || '/default-avatar.png'" :alt="selectedNode.name" class="node-avatar-large" />
          <div class="node-basic-info">
            <div class="node-name">{{ selectedNode.name }}</div>
            <div class="node-relation">{{ selectedNode.relation }}</div>
          </div>
        </div>
        <div class="panel-actions">
          <button @click="showDetailPanel = !showDetailPanel" class="expand-btn">
            <iconify-icon :icon="showDetailPanel ? 'heroicons:chevron-down' : 'heroicons:chevron-up'" width="16"></iconify-icon>
          </button>
          <button @click="closeNodeDetails" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
          </button>
        </div>
      </div>
      
      <div v-if="showDetailPanel" class="panel-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">出生日期</span>
              <span class="detail-value">{{ formatDate(selectedNode.birthDate) }}</span>
            </div>
            <div class="detail-item" v-if="selectedNode.deathDate">
              <span class="detail-label">逝世日期</span>
              <span class="detail-value">{{ formatDate(selectedNode.deathDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">性别</span>
              <span class="detail-value">{{ selectedNode.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">世代</span>
              <span class="detail-value">第{{ selectedNode.generation }}世</span>
            </div>
          </div>
        </div>
        
        <!-- 地理信息 -->
        <div v-if="selectedNode.location" class="detail-section">
          <h4>地理信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">出生地</span>
              <span class="detail-value">{{ selectedNode.location.birthPlace }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">居住地</span>
              <span class="detail-value">{{ selectedNode.location.residence }}</span>
            </div>
          </div>
        </div>
        
        <!-- 职业信息 -->
        <div v-if="selectedNode.career" class="detail-section">
          <h4>职业信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">职业</span>
              <span class="detail-value">{{ selectedNode.career.profession }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">行业</span>
              <span class="detail-value">{{ selectedNode.career.industry }}</span>
            </div>
          </div>
        </div>
        
        <!-- 教育信息 -->
        <div v-if="selectedNode.education" class="detail-section">
          <h4>教育信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">学历</span>
              <span class="detail-value">{{ selectedNode.education.degree }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">专业</span>
              <span class="detail-value">{{ selectedNode.education.major }}</span>
            </div>
          </div>
        </div>
        
        <!-- 关系连接 -->
        <div class="detail-section">
          <h4>关系连接</h4>
          <div class="connections-list">
            <div 
              v-for="connection in getNodeConnections(selectedNode)"
              :key="connection.id"
              class="connection-item"
              @click="selectNode(connection.target)"
            >
              <img :src="connection.target.avatar || '/default-avatar.png'" :alt="connection.target.name" class="connection-avatar" />
              <div class="connection-info">
                <div class="connection-name">{{ connection.target.name }}</div>
                <div class="connection-relation">{{ connection.relation }}</div>
              </div>
              <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="graph-legend">
      <div class="legend-header">
        <h4>图例</h4>
        <button @click="showLegend = !showLegend" class="toggle-legend-btn">
          <iconify-icon :icon="showLegend ? 'heroicons:eye-slash' : 'heroicons:eye'" width="16"></iconify-icon>
        </button>
      </div>
      
      <div v-if="showLegend" class="legend-content">
        <!-- 节点类型 -->
        <div class="legend-section">
          <h5>节点类型</h5>
          <div class="legend-items">
            <div v-for="nodeType in nodeTypes" :key="nodeType.id" class="legend-item">
              <div class="legend-symbol">
                <circle :r="8" :fill="nodeType.color" />
              </div>
              <span class="legend-label">{{ nodeType.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 连接类型 -->
        <div class="legend-section">
          <h5>连接类型</h5>
          <div class="legend-items">
            <div v-for="linkType in linkTypes" :key="linkType.id" class="legend-item">
              <div class="legend-symbol">
                <line x1="0" y1="8" x2="16" y2="8" :stroke="linkType.color" :stroke-width="linkType.width" />
              </div>
              <span class="legend-label">{{ linkType.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 维度颜色 -->
        <div class="legend-section">
          <h5>维度颜色</h5>
          <div class="legend-items">
            <div v-for="dimension in dimensions" :key="dimension.id" class="legend-item">
              <div class="legend-symbol">
                <circle :r="6" :fill="getDimensionColor(dimension.id)" />
              </div>
              <span class="legend-label">{{ dimension.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="settings-modal" @click.stop>
        <div class="modal-header">
          <h3>图表设置</h3>
          <button @click="showSettings = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="settings-list">
            <div class="setting-group">
              <h4>显示选项</h4>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" v-model="showDimensionIndicators" />
                  <span>显示维度指示器</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" v-model="showClusters" />
                  <span>显示聚类区域</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" v-model="showNodeLabels" />
                  <span>显示节点标签</span>
                </label>
              </div>
            </div>
            
            <div class="setting-group">
              <h4>布局算法</h4>
              
              <div class="setting-item">
                <label class="setting-label">布局类型</label>
                <select v-model="layoutType" @change="updateLayout">
                  <option value="force">力导向布局</option>
                  <option value="circular">环形布局</option>
                  <option value="hierarchical">层次布局</option>
                  <option value="grid">网格布局</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">节点间距</label>
                <input type="range" v-model="nodeSpacing" min="50" max="200" @input="updateLayout" />
                <span class="range-value">{{ nodeSpacing }}px</span>
              </div>
            </div>
            
            <div class="setting-group">
              <h4>筛选条件</h4>
              
              <div class="setting-item">
                <label class="setting-label">最小世代</label>
                <input type="number" v-model="filterOptions.minGeneration" min="1" @change="applyFilters" />
              </div>
              
              <div class="setting-item">
                <label class="setting-label">最大世代</label>
                <input type="number" v-model="filterOptions.maxGeneration" min="1" @change="applyFilters" />
              </div>
              
              <div class="setting-item">
                <label class="setting-label">性别筛选</label>
                <select v-model="filterOptions.gender" @change="applyFilters">
                  <option value="">全部</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="resetSettings" class="reset-btn">重置设置</button>
          <button @click="showSettings = false" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 节点提示框 -->
    <div 
      v-if="tooltip.show" 
      class="node-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-content">
        <div class="tooltip-name">{{ tooltip.node?.name }}</div>
        <div class="tooltip-relation">{{ tooltip.node?.relation }}</div>
        <div class="tooltip-details">
          <div v-if="tooltip.node?.birthDate">生于 {{ formatDate(tooltip.node.birthDate) }}</div>
          <div v-if="tooltip.node?.career">{{ tooltip.node.career.profession }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// DOM引用
const graphCanvas = ref(null)
const svgElement = ref(null)

// 状态
const isLoading = ref(false)
const showSettings = ref(false)
const showDetailPanel = ref(false)
const showLegend = ref(true)
const isFullscreen = ref(false)
const selectedNode = ref(null)
const selectedLink = ref(null)

// 画布设置
const canvasSize = reactive({
  width: 800,
  height: 600
})

// 变换设置
const transform = reactive({
  x: 0,
  y: 0,
  scale: 1
})

// 拖拽状态
const panState = reactive({
  isPanning: false,
  startX: 0,
  startY: 0,
  startTransformX: 0,
  startTransformY: 0
})

// 提示框
const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  node: null
})

// 维度定义
const dimensions = ref([
  { id: 'generation', name: '世代', icon: 'heroicons:users', color: '#2196F3' },
  { id: 'geography', name: '地理', icon: 'heroicons:map-pin', color: '#4CAF50' },
  { id: 'career', name: '职业', icon: 'heroicons:briefcase', color: '#FF9800' },
  { id: 'education', name: '教育', icon: 'heroicons:academic-cap', color: '#9C27B0' },
  { id: 'age', name: '年龄', icon: 'heroicons:calendar', color: '#F44336' },
  { id: 'gender', name: '性别', icon: 'heroicons:user', color: '#607D8B' }
])

// 激活的维度
const activeDimensions = ref(['generation', 'geography'])

// 显示设置
const showDimensionIndicators = ref(true)
const showClusters = ref(false)
const showNodeLabels = ref(true)

// 布局设置
const layoutType = ref('force')
const nodeSpacing = ref(100)

// 筛选选项
const filterOptions = reactive({
  minGeneration: 1,
  maxGeneration: 10,
  gender: ''
})

// 原始数据
const rawNodes = ref([])
const rawLinks = ref([])

// 处理后的数据
const processedNodes = ref([])
const processedLinks = ref([])
const clusters = ref([])

// 节点和连接类型
const nodeTypes = ref([
  { id: 'male', name: '男性', color: '#2196F3' },
  { id: 'female', name: '女性', color: '#E91E63' },
  { id: 'deceased', name: '已故', color: '#9E9E9E' }
])

const linkTypes = ref([
  { id: 'parent', name: '父子关系', color: '#4CAF50', width: 3 },
  { id: 'spouse', name: '夫妻关系', color: '#E91E63', width: 2 },
  { id: 'sibling', name: '兄弟姐妹', color: '#FF9800', width: 1 }
])

// 计算属性
const filteredNodes = computed(() => {
  return processedNodes.value.filter(node => {
    if (filterOptions.minGeneration && node.generation < filterOptions.minGeneration) return false
    if (filterOptions.maxGeneration && node.generation > filterOptions.maxGeneration) return false
    if (filterOptions.gender && node.gender !== filterOptions.gender) return false
    return true
  })
})

const visibleNodes = computed(() => {
  return filteredNodes.value
})

const visibleLinks = computed(() => {
  const nodeIds = new Set(visibleNodes.value.map(n => n.id))
  return processedLinks.value.filter(link =>
    nodeIds.has(link.source.id) && nodeIds.has(link.target.id)
  )
})

// 生命周期
onMounted(() => {
  initializeCanvas()
  loadGraphData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 方法
const initializeCanvas = () => {
  if (graphCanvas.value) {
    const rect = graphCanvas.value.getBoundingClientRect()
    canvasSize.width = rect.width
    canvasSize.height = rect.height
  }
}

const loadGraphData = async () => {
  isLoading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/multi-dimensional-graph`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        rawNodes.value = result.data.nodes
        rawLinks.value = result.data.links
        processGraphData()
      }
    }
  } catch (error) {
    console.error('加载关系图数据失败:', error)
    // 使用模拟数据
    loadMockData()
  } finally {
    isLoading.value = false
  }
}

const loadMockData = () => {
  rawNodes.value = [
    {
      id: 1,
      name: '叶德华',
      avatar: '/mock-avatar-1.jpg',
      gender: 'male',
      generation: 1,
      birthDate: '1920-01-01',
      deathDate: '1995-12-31',
      relation: '祖父',
      location: {
        birthPlace: '广东省梅州市',
        residence: '广东省广州市'
      },
      career: {
        profession: '教师',
        industry: '教育'
      },
      education: {
        degree: '大学',
        major: '文学'
      }
    },
    {
      id: 2,
      name: '王秀英',
      avatar: '/mock-avatar-5.jpg',
      gender: 'female',
      generation: 1,
      birthDate: '1925-03-15',
      deathDate: '1998-08-20',
      relation: '祖母',
      location: {
        birthPlace: '广东省潮州市',
        residence: '广东省广州市'
      },
      career: {
        profession: '家庭主妇',
        industry: '家庭'
      },
      education: {
        degree: '小学',
        major: ''
      }
    },
    {
      id: 3,
      name: '叶建国',
      avatar: '/mock-avatar-2.jpg',
      gender: 'male',
      generation: 2,
      birthDate: '1950-06-10',
      relation: '父亲',
      location: {
        birthPlace: '广东省广州市',
        residence: '广东省深圳市'
      },
      career: {
        profession: '工程师',
        industry: '制造业'
      },
      education: {
        degree: '大学',
        major: '机械工程'
      }
    },
    {
      id: 4,
      name: '李美华',
      avatar: '/mock-avatar-7.jpg',
      gender: 'female',
      generation: 2,
      birthDate: '1955-09-20',
      relation: '母亲',
      location: {
        birthPlace: '湖南省长沙市',
        residence: '广东省深圳市'
      },
      career: {
        profession: '护士',
        industry: '医疗'
      },
      education: {
        degree: '中专',
        major: '护理'
      }
    },
    {
      id: 5,
      name: '叶小明',
      avatar: '/mock-avatar-3.jpg',
      gender: 'male',
      generation: 3,
      birthDate: '1980-12-05',
      relation: '本人',
      location: {
        birthPlace: '广东省深圳市',
        residence: '北京市朝阳区'
      },
      career: {
        profession: '软件工程师',
        industry: '互联网'
      },
      education: {
        degree: '硕士',
        major: '计算机科学'
      }
    }
  ]

  rawLinks.value = [
    { source: 1, target: 3, relation: 'parent', type: 'parent' },
    { source: 2, target: 3, relation: 'parent', type: 'parent' },
    { source: 1, target: 2, relation: 'spouse', type: 'spouse' },
    { source: 3, target: 5, relation: 'parent', type: 'parent' },
    { source: 4, target: 5, relation: 'parent', type: 'parent' },
    { source: 3, target: 4, relation: 'spouse', type: 'spouse' }
  ]

  processGraphData()
}

const processGraphData = () => {
  // 处理节点数据
  processedNodes.value = rawNodes.value.map(node => ({
    ...node,
    x: Math.random() * (canvasSize.width - 100) + 50,
    y: Math.random() * (canvasSize.height - 100) + 50,
    vx: 0,
    vy: 0
  }))

  // 处理连接数据
  const nodeMap = new Map(processedNodes.value.map(n => [n.id, n]))
  processedLinks.value = rawLinks.value.map(link => ({
    ...link,
    source: nodeMap.get(link.source),
    target: nodeMap.get(link.target)
  })).filter(link => link.source && link.target)

  // 应用布局算法
  updateLayout()

  // 生成聚类
  generateClusters()
}

const updateLayout = () => {
  switch (layoutType.value) {
    case 'force':
      applyForceLayout()
      break
    case 'circular':
      applyCircularLayout()
      break
    case 'hierarchical':
      applyHierarchicalLayout()
      break
    case 'grid':
      applyGridLayout()
      break
  }
}

const applyForceLayout = () => {
  // 简化的力导向布局算法
  const nodes = processedNodes.value
  const links = processedLinks.value

  for (let i = 0; i < 100; i++) {
    // 斥力
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const dx = nodes[k].x - nodes[j].x
        const dy = nodes[k].y - nodes[j].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = nodeSpacing.value / distance

        nodes[j].vx -= (dx / distance) * force * 0.1
        nodes[j].vy -= (dy / distance) * force * 0.1
        nodes[k].vx += (dx / distance) * force * 0.1
        nodes[k].vy += (dy / distance) * force * 0.1
      }
    }

    // 引力
    for (const link of links) {
      const dx = link.target.x - link.source.x
      const dy = link.target.y - link.source.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (distance - nodeSpacing.value) * 0.01

      link.source.vx += (dx / distance) * force
      link.source.vy += (dy / distance) * force
      link.target.vx -= (dx / distance) * force
      link.target.vy -= (dy / distance) * force
    }

    // 更新位置
    for (const node of nodes) {
      node.x += node.vx
      node.y += node.vy
      node.vx *= 0.9
      node.vy *= 0.9

      // 边界约束
      node.x = Math.max(50, Math.min(canvasSize.width - 50, node.x))
      node.y = Math.max(50, Math.min(canvasSize.height - 50, node.y))
    }
  }
}

const applyCircularLayout = () => {
  const nodes = processedNodes.value
  const centerX = canvasSize.width / 2
  const centerY = canvasSize.height / 2
  const radius = Math.min(canvasSize.width, canvasSize.height) / 3

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI
    node.x = centerX + Math.cos(angle) * radius
    node.y = centerY + Math.sin(angle) * radius
  })
}

const applyHierarchicalLayout = () => {
  const nodes = processedNodes.value
  const generations = new Map()

  // 按世代分组
  nodes.forEach(node => {
    if (!generations.has(node.generation)) {
      generations.set(node.generation, [])
    }
    generations.get(node.generation).push(node)
  })

  // 按世代排列
  const sortedGenerations = Array.from(generations.keys()).sort((a, b) => a - b)
  const levelHeight = canvasSize.height / (sortedGenerations.length + 1)

  sortedGenerations.forEach((generation, levelIndex) => {
    const nodesInLevel = generations.get(generation)
    const nodeWidth = canvasSize.width / (nodesInLevel.length + 1)

    nodesInLevel.forEach((node, nodeIndex) => {
      node.x = nodeWidth * (nodeIndex + 1)
      node.y = levelHeight * (levelIndex + 1)
    })
  })
}

const applyGridLayout = () => {
  const nodes = processedNodes.value
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const rows = Math.ceil(nodes.length / cols)
  const cellWidth = canvasSize.width / cols
  const cellHeight = canvasSize.height / rows

  nodes.forEach((node, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    node.x = cellWidth * (col + 0.5)
    node.y = cellHeight * (row + 0.5)
  })
}

const generateClusters = () => {
  if (!showClusters.value) return

  // 基于激活维度生成聚类
  const clusterMap = new Map()

  processedNodes.value.forEach(node => {
    const clusterKey = activeDimensions.value.map(dim => {
      switch (dim) {
        case 'generation':
          return `gen_${node.generation}`
        case 'geography':
          return `geo_${node.location?.residence || 'unknown'}`
        case 'career':
          return `career_${node.career?.industry || 'unknown'}`
        case 'education':
          return `edu_${node.education?.degree || 'unknown'}`
        case 'gender':
          return `gender_${node.gender}`
        default:
          return 'default'
      }
    }).join('_')

    if (!clusterMap.has(clusterKey)) {
      clusterMap.set(clusterKey, [])
    }
    clusterMap.get(clusterKey).push(node)
  })

  // 生成聚类路径
  clusters.value = Array.from(clusterMap.entries()).map(([key, nodes], index) => {
    if (nodes.length < 2) return null

    // 计算凸包
    const hull = computeConvexHull(nodes)
    const path = `M${hull.map(p => `${p.x},${p.y}`).join('L')}Z`

    return {
      id: key,
      path,
      color: dimensions.value[index % dimensions.value.length].color,
      nodes
    }
  }).filter(Boolean)
}

const computeConvexHull = (points) => {
  // 简化的凸包算法
  if (points.length < 3) return points

  // 找到最左下角的点
  let start = points[0]
  for (const point of points) {
    if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
      start = point
    }
  }

  // 按极角排序
  const sorted = points.slice().sort((a, b) => {
    const angleA = Math.atan2(a.y - start.y, a.x - start.x)
    const angleB = Math.atan2(b.y - start.y, b.x - start.x)
    return angleA - angleB
  })

  // 扩展边界
  return sorted.map(p => ({
    x: p.x + (p.x > start.x ? 20 : -20),
    y: p.y + (p.y > start.y ? 20 : -20)
  }))
}

const toggleDimension = (dimension) => {
  const index = activeDimensions.value.indexOf(dimension.id)
  if (index > -1) {
    activeDimensions.value.splice(index, 1)
  } else {
    activeDimensions.value.push(dimension.id)
  }

  // 重新生成聚类
  generateClusters()
}

const selectNode = (node) => {
  selectedNode.value = node
  selectedLink.value = null
  showDetailPanel.value = true
}

const selectLink = (link) => {
  selectedLink.value = link
  selectedNode.value = null
}

const closeNodeDetails = () => {
  selectedNode.value = null
  showDetailPanel.value = false
}

const showNodeTooltip = (node, event) => {
  tooltip.node = node
  tooltip.x = event.clientX + 10
  tooltip.y = event.clientY - 10
  tooltip.show = true
}

const hideNodeTooltip = () => {
  tooltip.show = false
}

const getNodeConnections = (node) => {
  return processedLinks.value
    .filter(link => link.source.id === node.id || link.target.id === node.id)
    .map(link => ({
      id: link.source.id === node.id ? link.target.id : link.source.id,
      target: link.source.id === node.id ? link.target : link.source,
      relation: link.relation
    }))
}

// 样式计算方法
const getNodeRadius = (node) => {
  const baseRadius = 20
  const connections = getNodeConnections(node).length
  return baseRadius + Math.min(connections * 2, 15)
}

const getNodeColor = (node) => {
  if (node.deathDate) return '#9E9E9E'
  return node.gender === 'male' ? '#2196F3' : '#E91E63'
}

const getNodeBorderColor = (node) => {
  return selectedNode.value?.id === node.id ? '#FFD700' : '#fff'
}

const getNodeBorderWidth = (node) => {
  return selectedNode.value?.id === node.id ? 3 : 2
}

const getNodeLabelSize = (node) => {
  return selectedNode.value?.id === node.id ? 14 : 12
}

const getNodeLabelColor = (node) => {
  return selectedNode.value?.id === node.id ? '#333' : '#666'
}

const getLinkColor = (link) => {
  const typeColor = linkTypes.value.find(t => t.id === link.type)?.color || '#999'
  return selectedLink.value === link ? '#FFD700' : typeColor
}

const getLinkWidth = (link) => {
  const typeWidth = linkTypes.value.find(t => t.id === link.type)?.width || 1
  return selectedLink.value === link ? typeWidth + 1 : typeWidth
}

const getLinkDashArray = (link) => {
  return link.type === 'spouse' ? '5,5' : 'none'
}

const getDimensionColor = (dimensionId) => {
  return dimensions.value.find(d => d.id === dimensionId)?.color || '#999'
}

const getNodeDimensions = (node) => {
  return activeDimensions.value.filter(dim => {
    switch (dim) {
      case 'generation':
        return node.generation
      case 'geography':
        return node.location
      case 'career':
        return node.career
      case 'education':
        return node.education
      case 'gender':
        return node.gender
      default:
        return false
    }
  })
}

const getIndicatorPosition = (index, total) => {
  const radius = 25
  const angle = (index / total) * 2 * Math.PI
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  }
}

const getGraphTitle = () => {
  if (activeDimensions.value.length === 0) return '家族关系图'

  const dimensionNames = activeDimensions.value.map(id =>
    dimensions.value.find(d => d.id === id)?.name
  ).join(' × ')

  return `${dimensionNames} 多维度关系图`
}

// 交互方法
const handleZoom = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(3, transform.scale * delta))

  const rect = svgElement.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const dx = (mouseX - transform.x) * (1 - delta)
  const dy = (mouseY - transform.y) * (1 - delta)

  transform.scale = newScale
  transform.x += dx
  transform.y += dy
}

const handlePanStart = (event) => {
  panState.isPanning = true
  panState.startX = event.clientX
  panState.startY = event.clientY
  panState.startTransformX = transform.x
  panState.startTransformY = transform.y
}

const handlePanMove = (event) => {
  if (!panState.isPanning) return

  const dx = event.clientX - panState.startX
  const dy = event.clientY - panState.startY

  transform.x = panState.startTransformX + dx
  transform.y = panState.startTransformY + dy
}

const handlePanEnd = () => {
  panState.isPanning = false
}

const getTransform = () => {
  return `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
}

const resetView = () => {
  transform.x = 0
  transform.y = 0
  transform.scale = 1
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  nextTick(() => {
    initializeCanvas()
    updateLayout()
  })
}

const exportGraph = () => {
  // 导出SVG
  const svgData = new XMLSerializer().serializeToString(svgElement.value)
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `家族关系图_${new Date().toISOString().split('T')[0]}.svg`
  link.click()

  URL.revokeObjectURL(url)
}

const applyFilters = () => {
  // 筛选逻辑已在计算属性中实现
  generateClusters()
}

const resetSettings = () => {
  activeDimensions.value = ['generation', 'geography']
  showDimensionIndicators.value = true
  showClusters.value = false
  showNodeLabels.value = true
  layoutType.value = 'force'
  nodeSpacing.value = 100
  filterOptions.minGeneration = 1
  filterOptions.maxGeneration = 10
  filterOptions.gender = ''

  updateLayout()
  generateClusters()
}

const handleResize = () => {
  initializeCanvas()
  updateLayout()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.multi-dimensional-graph {
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

/* 维度选择器 */
.dimension-selector {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.active-dimensions {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

.dimension-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dimension-tab {
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
  position: relative;
}

.dimension-tab:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.dimension-tab.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.active-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  border: 2px solid white;
}

/* 图表容器 */
.graph-container {
  flex: 1;
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.graph-title h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.node-count {
  font-size: 12px;
  color: #666;
}

.graph-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
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
  transition: all 0.2s;
}

.control-btn:hover {
  border-color: #07c160;
  color: #07c160;
}

/* 图表画布 */
.graph-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

.graph-canvas.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: white;
}

.graph-canvas svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.graph-canvas svg:active {
  cursor: grabbing;
}

/* SVG样式 */
.link {
  cursor: pointer;
  transition: all 0.2s;
}

.link:hover {
  stroke-width: 3 !important;
}

.node-group {
  cursor: pointer;
  transition: all 0.2s;
}

.node-group:hover .node-circle {
  stroke-width: 3;
  filter: url(#nodeShadow);
}

.node-circle {
  transition: all 0.2s;
}

.node-avatar {
  pointer-events: none;
}

.node-label {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dimension-indicator {
  stroke: white;
  stroke-width: 1;
}

.cluster-area {
  pointer-events: none;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
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

/* 节点详情面板 */
.node-details-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(calc(100% - 80px));
  transition: transform 0.3s ease;
  z-index: 200;
  max-height: 70vh;
  overflow: hidden;
}

.node-details-panel.expanded {
  transform: translateY(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.node-basic-info {
  flex: 1;
}

.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.node-relation {
  font-size: 12px;
  color: #666;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.expand-btn, .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(70vh - 80px);
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.connections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.connection-item:hover {
  background: #f0f0f0;
}

.connection-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.connection-info {
  flex: 1;
}

.connection-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.connection-relation {
  font-size: 12px;
  color: #666;
}

/* 图例 */
.graph-legend {
  position: fixed;
  top: 100px;
  right: 16px;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  z-index: 150;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.legend-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toggle-legend-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
}

.legend-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-section h5 {
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-symbol {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-symbol svg {
  width: 16px;
  height: 16px;
}

.legend-label {
  font-size: 11px;
  color: #666;
}

/* 节点提示框 */
.node-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 300;
  max-width: 200px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-name {
  font-weight: 600;
}

.tooltip-relation {
  opacity: 0.8;
}

.tooltip-details {
  margin-top: 4px;
  opacity: 0.7;
}

/* 设置弹窗 */
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

.settings-modal {
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

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  accent-color: #07c160;
}

.setting-item select,
.setting-item input[type="number"] {
  width: 120px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 14px;
}

.setting-item input[type="range"] {
  flex: 1;
  margin: 0 8px;
}

.range-value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
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

.confirm-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .graph-legend {
    position: static;
    margin: 16px;
    max-width: none;
  }

  .dimension-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .graph-controls {
    flex-wrap: wrap;
  }

  .control-btn span {
    display: none;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

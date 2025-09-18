<template>
  <div class="interactive-genealogy-tree">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">互动族谱树</h1>
      <div class="nav-actions">
        <button @click="showFilters = true" class="filter-btn">
          <iconify-icon icon="heroicons:funnel" width="20"></iconify-icon>
        </button>
        <button @click="showSettings = true" class="settings-btn">
          <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="view-controls">
        <button @click="zoomIn" class="control-btn">
          <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomOut" class="control-btn">
          <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
        </button>
        <button @click="resetView" class="control-btn">
          <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
        </button>
      </div>

      <div class="layout-controls">
        <button
          v-for="layout in layouts"
          :key="layout.id"
          @click="changeLayout(layout.id)"
          class="layout-btn"
          :class="{ active: currentLayout === layout.id }"
        >
          <iconify-icon :icon="layout.icon" width="16"></iconify-icon>
          <span>{{ layout.name }}</span>
        </button>
      </div>
    </div>

    <!-- 族谱树容器 -->
    <div class="tree-container" ref="treeContainer">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载族谱数据...</div>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!treeData || treeData.length === 0"
        type="genealogy-empty"
        @primary-action="handleCreateGenealogy"
        @secondary-action="handleJoinGenealogy"
      />

      <!-- 族谱树画布 -->
      <div
        v-else
        class="tree-canvas"
        ref="treeCanvas"
        :style="canvasStyle"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @wheel="onWheel"
        @touchstart="startTouch"
        @touchmove="onTouch"
        @touchend="endTouch"
      >
        <!-- SVG连接线 -->
        <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ccc" />
            </marker>
          </defs>

          <g v-for="connection in connections" :key="connection.id">
            <path
              :d="connection.path"
              :stroke="connection.color"
              :stroke-width="connection.width"
              fill="none"
              :marker-end="connection.hasArrow ? 'url(#arrowhead)' : ''"
              :class="connection.type"
            />
          </g>
        </svg>

        <!-- 族谱节点 -->
        <div
          v-for="node in visibleNodes"
          :key="node.id"
          class="tree-node"
          :class="[
            node.type,
            {
              selected: selectedNode?.id === node.id,
              highlighted: highlightedNodes.includes(node.id),
              collapsed: node.collapsed
            }
          ]"
          :style="getNodeStyle(node)"
          @click="selectNode(node)"
          @dblclick="toggleNodeCollapse(node)"
        >
          <!-- 节点头像 -->
          <div class="node-avatar">
            <img :src="node.avatar || '/default-avatar.png'" :alt="node.name" />
            <div v-if="node.isAlive === false" class="deceased-indicator"></div>
            <div v-if="node.children && node.children.length > 0" class="expand-indicator">
              <iconify-icon
                :icon="node.collapsed ? 'heroicons:plus' : 'heroicons:minus'"
                width="12"
              ></iconify-icon>
            </div>
          </div>

          <!-- 节点信息 -->
          <div class="node-info">
            <div class="node-name">{{ node.name }}</div>
            <div class="node-details">
              <div v-if="node.birthYear" class="node-year">{{ node.birthYear }}年</div>
              <div v-if="node.generation" class="node-generation">{{ node.generation }}世</div>
            </div>
            <div v-if="node.title" class="node-title">{{ node.title }}</div>
          </div>

          <!-- 节点统计 -->
          <div v-if="node.stats" class="node-stats">
            <div v-if="node.stats.children" class="stat-item">
              <iconify-icon icon="heroicons:users" width="12"></iconify-icon>
              <span>{{ node.stats.children }}</span>
            </div>
            <div v-if="node.stats.descendants" class="stat-item">
              <iconify-icon icon="heroicons:user-group" width="12"></iconify-icon>
              <span>{{ node.stats.descendants }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点详情面板 -->
    <div v-if="selectedNode" class="node-detail-panel" :class="{ expanded: showNodeDetail }">
      <div class="panel-header">
        <h3>{{ selectedNode.name }}</h3>
        <button @click="toggleNodeDetail" class="toggle-btn">
          <iconify-icon
            :icon="showNodeDetail ? 'heroicons:chevron-down' : 'heroicons:chevron-up'"
            width="16"
          ></iconify-icon>
        </button>
      </div>

      <div v-if="showNodeDetail" class="panel-content">
        <div class="detail-section">
          <div class="detail-avatar">
            <img :src="selectedNode.avatar || '/default-avatar.png'" :alt="selectedNode.name" />
          </div>
          <div class="detail-info">
            <div class="info-row">
              <span class="label">姓名:</span>
              <span class="value">{{ selectedNode.name }}</span>
            </div>
            <div v-if="selectedNode.gender" class="info-row">
              <span class="label">性别:</span>
              <span class="value">{{ selectedNode.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div v-if="selectedNode.birthDate" class="info-row">
              <span class="label">出生:</span>
              <span class="value">{{ formatDate(selectedNode.birthDate) }}</span>
            </div>
            <div v-if="selectedNode.deathDate" class="info-row">
              <span class="label">逝世:</span>
              <span class="value">{{ formatDate(selectedNode.deathDate) }}</span>
            </div>
            <div v-if="selectedNode.generation" class="info-row">
              <span class="label">世代:</span>
              <span class="value">第{{ selectedNode.generation }}世</span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <button @click="viewMemberDetail" class="action-btn primary">
            <iconify-icon icon="heroicons:user" width="16"></iconify-icon>
            <span>查看详情</span>
          </button>
          <button @click="focusOnNode" class="action-btn">
            <iconify-icon icon="heroicons:magnifying-glass" width="16"></iconify-icon>
            <span>聚焦</span>
          </button>
          <button @click="showRelationships" class="action-btn">
            <iconify-icon icon="heroicons:link" width="16"></iconify-icon>
            <span>关系</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="modal-overlay" @click="showFilters = false">
      <div class="filter-panel" @click.stop>
        <div class="panel-header">
          <h3>筛选条件</h3>
          <button @click="showFilters = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="filter-content">
          <div class="filter-group">
            <label>世代范围</label>
            <div class="generation-range">
              <input type="number" v-model="filters.minGeneration" placeholder="最小世代" />
              <span>-</span>
              <input type="number" v-model="filters.maxGeneration" placeholder="最大世代" />
            </div>
          </div>

          <div class="filter-group">
            <label>性别</label>
            <div class="gender-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="filters.showMale" />
                <span>男性</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="filters.showFemale" />
                <span>女性</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <label>生存状态</label>
            <div class="status-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="filters.showAlive" />
                <span>在世</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="filters.showDeceased" />
                <span>已故</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <label>年龄范围</label>
            <div class="age-range">
              <input type="number" v-model="filters.minAge" placeholder="最小年龄" />
              <span>-</span>
              <input type="number" v-model="filters.maxAge" placeholder="最大年龄" />
            </div>
          </div>

          <div class="filter-group">
            <label>搜索姓名</label>
            <input type="text" v-model="filters.nameSearch" placeholder="输入姓名关键词" />
          </div>
        </div>

        <div class="filter-actions">
          <button @click="resetFilters" class="reset-btn">重置</button>
          <button @click="applyFilters" class="apply-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="settings-panel" @click.stop>
        <div class="panel-header">
          <h3>显示设置</h3>
          <button @click="showSettings = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="settings-content">
          <div class="setting-group">
            <label>节点大小</label>
            <input type="range" v-model="settings.nodeSize" min="0.5" max="2" step="0.1" />
            <span>{{ settings.nodeSize }}x</span>
          </div>

          <div class="setting-group">
            <label>连接线样式</label>
            <select v-model="settings.connectionStyle">
              <option value="straight">直线</option>
              <option value="curved">曲线</option>
              <option value="orthogonal">直角</option>
            </select>
          </div>

          <div class="setting-group">
            <label>显示选项</label>
            <div class="display-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.showPhotos" />
                <span>显示头像</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.showDates" />
                <span>显示日期</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="settings.showStats" />
                <span>显示统计</span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <label>动画效果</label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.enableAnimations" />
              <span>启用动画</span>
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button @click="resetSettings" class="reset-btn">重置</button>
          <button @click="saveSettings" class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import EmptyState from '../../../components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// DOM引用
const treeContainer = ref<HTMLElement>()
const treeCanvas = ref<HTMLElement>()

// 状态管理
const isLoading = ref(true)
const treeData = ref([])

// 状态
const showFilters = ref(false)
const showSettings = ref(false)
const showNodeDetail = ref(false)
const selectedNode = ref(null)
const highlightedNodes = ref([])

// 视图控制
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const currentLayout = ref('tree')

// 画布尺寸
const canvasWidth = ref(2000)
const canvasHeight = ref(1500)

// 布局选项
const layouts = ref([
  { id: 'tree', name: '树形', icon: 'heroicons:squares-2x2' },
  { id: 'radial', name: '放射', icon: 'heroicons:sun' },
  { id: 'timeline', name: '时间轴', icon: 'heroicons:clock' },
  { id: 'geographic', name: '地理', icon: 'heroicons:map' }
])

// 筛选条件
const filters = reactive({
  minGeneration: null,
  maxGeneration: null,
  showMale: true,
  showFemale: true,
  showAlive: true,
  showDeceased: true,
  minAge: null,
  maxAge: null,
  nameSearch: ''
})

// 显示设置
const settings = reactive({
  nodeSize: 1,
  connectionStyle: 'curved',
  showPhotos: true,
  showDates: true,
  showStats: true,
  enableAnimations: true
})

// 族谱数据
const familyData = ref([])
const processedNodes = ref([])
const connections = ref([])

// 计算属性
const canvasStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoomLevel.value})`,
  transformOrigin: '0 0',
  transition: settings.enableAnimations ? 'transform 0.3s ease' : 'none'
}))

const visibleNodes = computed(() => {
  return processedNodes.value.filter(node => {
    // 应用筛选条件
    if (filters.minGeneration && node.generation < filters.minGeneration) return false
    if (filters.maxGeneration && node.generation > filters.maxGeneration) return false
    if (!filters.showMale && node.gender === 'male') return false
    if (!filters.showFemale && node.gender === 'female') return false
    if (!filters.showAlive && node.isAlive === true) return false
    if (!filters.showDeceased && node.isAlive === false) return false
    if (filters.nameSearch && !node.name.includes(filters.nameSearch)) return false

    // 年龄筛选
    if (filters.minAge || filters.maxAge) {
      const age = calculateAge(node.birthDate)
      if (filters.minAge && age < filters.minAge) return false
      if (filters.maxAge && age > filters.maxAge) return false
    }

    return true
  })
})

// 生命周期
onMounted(() => {
  loadFamilyData()
  setupEventListeners()
})

onUnmounted(() => {
  removeEventListeners()
})

// 方法
const loadFamilyData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/tree-data`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        familyData.value = result.data
        processTreeData()
      }
    }
  } catch (error) {
    console.error('加载族谱数据失败:', error)
    // 使用模拟数据
    familyData.value = generateMockData()
    processTreeData()
  }
}

const processTreeData = () => {
  // 根据当前布局处理数据
  switch (currentLayout.value) {
    case 'tree':
      processTreeLayout()
      break
    case 'radial':
      processRadialLayout()
      break
    case 'timeline':
      processTimelineLayout()
      break
    case 'geographic':
      processGeographicLayout()
      break
  }

  generateConnections()
}

const processTreeLayout = () => {
  const nodes = []
  const levelWidth = 200
  const levelHeight = 150

  // 递归处理节点位置
  const processNode = (node, level = 0, index = 0, parentX = 0) => {
    const x = parentX + (index - (node.siblings || 0) / 2) * levelWidth
    const y = level * levelHeight + 100

    const processedNode = {
      ...node,
      x,
      y,
      level,
      stats: {
        children: node.children?.length || 0,
        descendants: countDescendants(node)
      }
    }

    nodes.push(processedNode)

    // 处理子节点
    if (node.children) {
      node.children.forEach((child, childIndex) => {
        processNode(child, level + 1, childIndex, x)
      })
    }
  }

  // 从根节点开始处理
  familyData.value.forEach((rootNode, index) => {
    processNode(rootNode, 0, index)
  })

  processedNodes.value = nodes
}

const processRadialLayout = () => {
  const nodes = []
  const centerX = canvasWidth.value / 2
  const centerY = canvasHeight.value / 2
  const radiusStep = 120

  const processNode = (node, level = 0, angle = 0, parentX = centerX, parentY = centerY) => {
    const radius = level * radiusStep
    const x = level === 0 ? centerX : parentX + Math.cos(angle) * radius
    const y = level === 0 ? centerY : parentY + Math.sin(angle) * radius

    const processedNode = {
      ...node,
      x,
      y,
      level,
      stats: {
        children: node.children?.length || 0,
        descendants: countDescendants(node)
      }
    }

    nodes.push(processedNode)

    // 处理子节点
    if (node.children) {
      const angleStep = (2 * Math.PI) / node.children.length
      node.children.forEach((child, index) => {
        const childAngle = angle + (index - node.children.length / 2) * angleStep
        processNode(child, level + 1, childAngle, x, y)
      })
    }
  }

  familyData.value.forEach(rootNode => {
    processNode(rootNode)
  })

  processedNodes.value = nodes
}

const processTimelineLayout = () => {
  const nodes = []
  const timelineY = canvasHeight.value / 2
  const yearWidth = 50
  const baseYear = 1900

  familyData.value.forEach(node => {
    const birthYear = node.birthYear || new Date(node.birthDate).getFullYear()
    const x = (birthYear - baseYear) * yearWidth + 100
    const y = timelineY + (Math.random() - 0.5) * 200 // 随机偏移避免重叠

    nodes.push({
      ...node,
      x,
      y,
      stats: {
        children: node.children?.length || 0,
        descendants: countDescendants(node)
      }
    })
  })

  processedNodes.value = nodes
}

const processGeographicLayout = () => {
  // 基于地理位置的布局（简化版）
  const nodes = []
  const regions = {
    '北京': { x: 400, y: 200 },
    '上海': { x: 500, y: 300 },
    '广州': { x: 450, y: 400 },
    '深圳': { x: 460, y: 420 },
    '其他': { x: 300, y: 300 }
  }

  familyData.value.forEach((node, index) => {
    const region = node.address ? extractRegion(node.address) : '其他'
    const basePos = regions[region] || regions['其他']

    const x = basePos.x + (Math.random() - 0.5) * 100
    const y = basePos.y + (Math.random() - 0.5) * 100

    nodes.push({
      ...node,
      x,
      y,
      region,
      stats: {
        children: node.children?.length || 0,
        descendants: countDescendants(node)
      }
    })
  })

  processedNodes.value = nodes
}

const generateConnections = () => {
  const newConnections = []

  processedNodes.value.forEach(node => {
    if (node.children) {
      node.children.forEach(child => {
        const childNode = processedNodes.value.find(n => n.id === child.id)
        if (childNode) {
          newConnections.push({
            id: `${node.id}-${child.id}`,
            from: node,
            to: childNode,
            path: generateConnectionPath(node, childNode),
            color: getConnectionColor(node, childNode),
            width: 2,
            type: 'parent-child',
            hasArrow: true
          })
        }
      })
    }

    // 配偶关系
    if (node.spouse) {
      const spouseNode = processedNodes.value.find(n => n.id === node.spouse.id)
      if (spouseNode) {
        newConnections.push({
          id: `${node.id}-spouse-${node.spouse.id}`,
          from: node,
          to: spouseNode,
          path: generateConnectionPath(node, spouseNode),
          color: '#e91e63',
          width: 3,
          type: 'spouse',
          hasArrow: false
        })
      }
    }
  })

  connections.value = newConnections
}

const generateConnectionPath = (from, to) => {
  const startX = from.x + 50 // 节点中心偏移
  const startY = from.y + 25
  const endX = to.x + 50
  const endY = to.y + 25

  switch (settings.connectionStyle) {
    case 'straight':
      return `M ${startX} ${startY} L ${endX} ${endY}`

    case 'curved':
      const midX = (startX + endX) / 2
      const midY = (startY + endY) / 2 - 30
      return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`

    case 'orthogonal':
      const cornerX = startX
      const cornerY = endY
      return `M ${startX} ${startY} L ${cornerX} ${cornerY} L ${endX} ${endY}`

    default:
      return `M ${startX} ${startY} L ${endX} ${endY}`
  }
}

const getConnectionColor = (from, to) => {
  if (from.generation === to.generation) return '#e91e63' // 配偶关系
  if (from.generation < to.generation) return '#2196f3' // 父子关系
  return '#ff9800' // 其他关系
}

// 视图控制方法
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.3)
}

const resetView = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const changeLayout = (layoutId) => {
  currentLayout.value = layoutId
  processTreeData()
}

// 拖拽控制
const startDrag = (event) => {
  isDragging.value = true
  dragStart.value = { x: event.clientX - panX.value, y: event.clientY - panY.value }
}

const onDrag = (event) => {
  if (!isDragging.value) return
  panX.value = event.clientX - dragStart.value.x
  panY.value = event.clientY - dragStart.value.y
}

const endDrag = () => {
  isDragging.value = false
}

// 触摸控制
const startTouch = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    startDrag({ clientX: touch.clientX, clientY: touch.clientY })
  }
}

const onTouch = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    onDrag({ clientX: touch.clientX, clientY: touch.clientY })
  }
}

const endTouch = () => {
  endDrag()
}

// 滚轮缩放
const onWheel = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  zoomLevel.value = Math.max(0.3, Math.min(3, zoomLevel.value * delta))
}

// 节点操作
const selectNode = (node) => {
  selectedNode.value = node
  showNodeDetail.value = true
}

const toggleNodeCollapse = (node) => {
  node.collapsed = !node.collapsed
  processTreeData()
}

const toggleNodeDetail = () => {
  showNodeDetail.value = !showNodeDetail.value
}

const getNodeStyle = (node) => ({
  left: node.x + 'px',
  top: node.y + 'px',
  transform: `scale(${settings.nodeSize})`,
  opacity: node.collapsed ? 0.6 : 1
})

const focusOnNode = () => {
  if (!selectedNode.value) return

  const containerRect = treeContainer.value.getBoundingClientRect()
  const targetX = containerRect.width / 2 - selectedNode.value.x * zoomLevel.value
  const targetY = containerRect.height / 2 - selectedNode.value.y * zoomLevel.value

  panX.value = targetX
  panY.value = targetY
}

const viewMemberDetail = () => {
  if (selectedNode.value) {
    router.push(`/genealogy/${genealogyId.value}/members/${selectedNode.value.id}`)
  }
}

const showRelationships = () => {
  if (!selectedNode.value) return

  // 高亮相关节点
  const relatedIds = []

  // 添加父母
  if (selectedNode.value.parents) {
    relatedIds.push(...selectedNode.value.parents.map(p => p.id))
  }

  // 添加子女
  if (selectedNode.value.children) {
    relatedIds.push(...selectedNode.value.children.map(c => c.id))
  }

  // 添加配偶
  if (selectedNode.value.spouse) {
    relatedIds.push(selectedNode.value.spouse.id)
  }

  highlightedNodes.value = relatedIds

  // 3秒后清除高亮
  setTimeout(() => {
    highlightedNodes.value = []
  }, 3000)
}

// 筛选和设置
const applyFilters = () => {
  showFilters.value = false
  // 筛选逻辑在 visibleNodes 计算属性中处理
}

const resetFilters = () => {
  Object.assign(filters, {
    minGeneration: null,
    maxGeneration: null,
    showMale: true,
    showFemale: true,
    showAlive: true,
    showDeceased: true,
    minAge: null,
    maxAge: null,
    nameSearch: ''
  })
}

const saveSettings = () => {
  showSettings.value = false
  processTreeData() // 重新处理数据以应用新设置
}

const resetSettings = () => {
  Object.assign(settings, {
    nodeSize: 1,
    connectionStyle: 'curved',
    showPhotos: true,
    showDates: true,
    showStats: true,
    enableAnimations: true
  })
}

// 辅助方法
const countDescendants = (node) => {
  if (!node.children) return 0
  return node.children.length + node.children.reduce((sum, child) => sum + countDescendants(child), 0)
}

const calculateAge = (birthDate) => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  return now.getFullYear() - birth.getFullYear()
}

const extractRegion = (address) => {
  if (address.includes('北京')) return '北京'
  if (address.includes('上海')) return '上海'
  if (address.includes('广州')) return '广州'
  if (address.includes('深圳')) return '深圳'
  return '其他'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}



// 空状态处理方法
const handleCreateGenealogy = () => {
  router.push('/genealogy/create')
}

const handleJoinGenealogy = () => {
  router.push('/genealogy/join')
}

// 模拟数据加载
const loadTreeData = async () => {
  try {
    isLoading.value = true
    // 这里应该调用真实的API
    // const response = await genealogyAPI.getTreeData(genealogyId.value)
    // treeData.value = response.data

    // 暂时模拟加载过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 如果没有数据，保持空数组状态
    treeData.value = []
  } catch (error) {
    console.error('加载族谱数据失败:', error)
    treeData.value = []
  } finally {
    isLoading.value = false
  }
}

const setupEventListeners = () => {
  // 设置事件监听器
}

const removeEventListeners = () => {
  // 移除事件监听器
}

// 生命周期
onMounted(() => {
  loadTreeData()
})
</script>

<style scoped>
.interactive-genealogy-tree {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.back-btn {
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

.nav-actions {
  display: flex;
  gap: 8px;
}

.filter-btn, .settings-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.layout-controls {
  display: flex;
  gap: 4px;
}

.layout-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 10px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 族谱树容器 */
.tree-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fafafa;
}

.tree-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.tree-canvas:active {
  cursor: grabbing;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connections-layer path {
  transition: stroke-width 0.2s;
}

.connections-layer path.parent-child {
  stroke: #2196f3;
}

.connections-layer path.spouse {
  stroke: #e91e63;
  stroke-dasharray: 5,5;
}

/* 族谱节点 */
.tree-node {
  position: absolute;
  width: 100px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
  padding: 8px;
}

.tree-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.tree-node.selected {
  border: 2px solid #07c160;
  box-shadow: 0 4px 16px rgba(7, 193, 96, 0.3);
}

.tree-node.highlighted {
  border: 2px solid #ff9800;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
}

.tree-node.collapsed {
  opacity: 0.6;
}

.node-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  margin: 0 auto 8px;
}

.node-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.deceased-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #666;
  border: 2px solid white;
  border-radius: 50%;
}

.expand-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #07c160;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 8px;
}

.node-info {
  text-align: center;
}

.node-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-details {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.node-year, .node-generation {
  font-size: 10px;
  color: #666;
}

.node-title {
  font-size: 10px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-stats {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #666;
}

/* 节点详情面板 */
.node-detail-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eee;
  border-radius: 16px 16px 0 0;
  transform: translateY(calc(100% - 60px));
  transition: transform 0.3s ease;
  z-index: 200;
}

.node-detail-panel.expanded {
  transform: translateY(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.panel-content {
  padding: 20px;
}

.detail-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-avatar {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.detail-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.detail-info {
  flex: 1;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row .label {
  width: 60px;
  font-size: 14px;
  color: #666;
}

.info-row .value {
  font-size: 14px;
  color: #333;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
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

.filter-panel,
.settings-panel {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.filter-content,
.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.filter-group,
.setting-group {
  margin-bottom: 20px;
}

.filter-group label,
.setting-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.generation-range,
.age-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.generation-range input,
.age-range input {
  flex: 1;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}

.gender-options,
.status-options,
.display-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  accent-color: #07c160;
}

.filter-actions,
.settings-actions {
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

.apply-btn,
.save-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.setting-group input[type="range"] {
  width: 100%;
  margin: 8px 0;
}

.setting-group select {
  width: 100%;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}
</style>
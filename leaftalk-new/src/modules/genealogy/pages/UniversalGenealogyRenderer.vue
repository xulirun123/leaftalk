<template>
  <div class="universal-genealogy-renderer">

    <!-- 布局切换器 -->
    <div class="layout-switcher">
      <div class="current-layout-info">
        <div class="layout-name">{{ getCurrentLayoutName() }}</div>
        <div class="member-count">{{ familyMembers.length }}位成员</div>
      </div>
      
      <div class="layout-tabs">
        <button 
          v-for="layout in availableLayouts" 
          :key="layout.id"
          @click="switchLayout(layout.id)"
          :class="{ active: currentLayout === layout.id }"
          class="layout-tab"
        >
          <iconify-icon :icon="layout.icon" width="16"></iconify-icon>
          <span>{{ layout.name }}</span>
        </button>
      </div>
    </div>

    <!-- 族谱渲染区域 -->
    <div class="genealogy-container" ref="genealogyContainer">
      <div class="genealogy-canvas" 
           :class="[currentLayout, `generation-${maxGeneration}`]"
           :style="canvasStyle">
        
        <!-- 欧式排版 -->
        <div v-if="currentLayout === 'european'" class="european-layout">
          <div 
            v-for="(generation, genIndex) in renderedGenerations" 
            :key="genIndex"
            class="generation-row"
            :style="getGenerationRowStyle(genIndex)"
          >
            <div class="generation-label" v-if="showGenerationLabels">
              {{ getGenerationLabel(genIndex + 1) }}
            </div>
            <div class="members-row">
              <div 
                v-for="member in generation" 
                :key="member.id"
                class="member-node"
                :class="getMemberClasses(member)"
                :style="getMemberStyle(member)"
                @click="selectMember(member)"
              >
                <MemberCard 
                  :member="member" 
                  :layout="currentLayout"
                  :customization="layoutCustomization"
                  @member-click="selectMember"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 苏式排版 -->
        <div v-else-if="currentLayout === 'suzhou'" class="suzhou-layout">
          <div class="ancestor-section">
            <div 
              v-for="ancestor in getAncestors()" 
              :key="ancestor.id"
              class="ancestor-node"
            >
              <MemberCard 
                :member="ancestor" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
          
          <div class="branches-section">
            <div 
              v-for="branch in getFamilyBranches()" 
              :key="branch.id"
              class="family-branch"
              :style="getBranchStyle(branch)"
            >
              <div class="branch-header">
                <div class="branch-title">{{ branch.name }}</div>
                <div class="branch-count">{{ branch.members.length }}人</div>
              </div>
              
              <div class="branch-members">
                <div 
                  v-for="member in branch.members" 
                  :key="member.id"
                  class="member-node"
                  :class="getMemberClasses(member)"
                >
                  <MemberCard 
                    :member="member" 
                    :layout="currentLayout"
                    :customization="layoutCustomization"
                    @member-click="selectMember"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 宝塔式排版 -->
        <div v-else-if="currentLayout === 'pagoda'" class="pagoda-layout">
          <div 
            v-for="(level, levelIndex) in getPagodaLevels()" 
            :key="levelIndex"
            class="pagoda-level"
            :class="`level-${levelIndex + 1}`"
            :style="getPagodaLevelStyle(levelIndex, level.length)"
          >
            <div 
              v-for="member in level" 
              :key="member.id"
              class="member-node"
              :class="getMemberClasses(member)"
              :style="getPagodaMemberStyle(levelIndex, level.length)"
            >
              <MemberCard 
                :member="member" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
        </div>

        <!-- 扇形排版 -->
        <div v-else-if="currentLayout === 'fan'" class="fan-layout">
          <div class="fan-center">
            <div 
              v-for="centerMember in getCenterMembers()" 
              :key="centerMember.id"
              class="center-member"
            >
              <MemberCard 
                :member="centerMember" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
          
          <div class="fan-rings">
            <div 
              v-for="(ring, ringIndex) in getFanRings()" 
              :key="ringIndex"
              class="fan-ring"
              :style="getFanRingStyle(ringIndex)"
            >
              <div 
                v-for="(member, memberIndex) in ring" 
                :key="member.id"
                class="fan-member"
                :style="getFanMemberStyle(ringIndex, memberIndex, ring.length)"
              >
                <MemberCard 
                  :member="member" 
                  :layout="currentLayout"
                  :customization="layoutCustomization"
                  @member-click="selectMember"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 树形排版 -->
        <div v-else-if="currentLayout === 'tree'" class="tree-layout">
          <div class="tree-root">
            <div 
              v-for="rootMember in getRootMembers()" 
              :key="rootMember.id"
              class="root-member"
            >
              <MemberCard 
                :member="rootMember" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
          
          <div class="tree-branches">
            <TreeBranch 
              v-for="branch in getTreeBranches()" 
              :key="branch.id"
              :branch="branch"
              :layout="currentLayout"
              :customization="layoutCustomization"
              @member-click="selectMember"
            />
          </div>
        </div>

        <!-- 环形排版 -->
        <div v-else-if="currentLayout === 'circular'" class="circular-layout">
          <div class="circle-center">
            <div 
              v-for="centerMember in getCenterMembers()" 
              :key="centerMember.id"
              class="center-member"
            >
              <MemberCard 
                :member="centerMember" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
          
          <div 
            v-for="(circle, circleIndex) in getCircularRings()" 
            :key="circleIndex"
            class="circular-ring"
            :style="getCircularRingStyle(circleIndex)"
          >
            <div 
              v-for="(member, memberIndex) in circle" 
              :key="member.id"
              class="circular-member"
              :style="getCircularMemberStyle(circleIndex, memberIndex, circle.length)"
            >
              <MemberCard 
                :member="member" 
                :layout="currentLayout"
                :customization="layoutCustomization"
                @member-click="selectMember"
              />
            </div>
          </div>
        </div>

        <!-- 关系连线 -->
        <svg class="relationship-lines" v-if="showRelationshipLines">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" :fill="layoutCustomization.connections.lineColor" />
            </marker>
          </defs>
          
          <path 
            v-for="connection in getRenderedConnections()" 
            :key="connection.id"
            :d="connection.path"
            :stroke="layoutCustomization.connections.lineColor"
            :stroke-width="layoutCustomization.connections.lineWidth"
            :stroke-dasharray="getStrokeDashArray()"
            fill="none"
            :marker-end="layoutCustomization.connections.showArrows ? 'url(#arrowhead)' : ''"
            :class="connection.type"
          />
        </svg>
      </div>
    </div>

    <!-- 成员详情面板 -->
    <MemberDetailPanel 
      v-if="selectedMember"
      :member="selectedMember"
      :genealogy-id="genealogyId"
      @close="selectedMember = null"
      @edit="editMember"
    />

    <!-- 布局选择器弹窗 -->
    <div v-if="showLayoutSelector" class="modal-overlay" @click="showLayoutSelector = false">
      <div class="layout-selector-modal" @click.stop>
        <div class="modal-header">
          <h3>选择排版布局</h3>
          <button @click="showLayoutSelector = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="layout-grid">
            <div 
              v-for="layout in availableLayouts" 
              :key="layout.id"
              @click="switchLayout(layout.id)"
              :class="{ active: currentLayout === layout.id }"
              class="layout-option"
            >
              <div class="layout-preview" :class="layout.id">
                <div class="preview-demo">
                  <!-- 简化的布局预览 -->
                  <div v-if="layout.id === 'european'" class="demo-european">
                    <div class="demo-row">
                      <div class="demo-node"></div>
                    </div>
                    <div class="demo-row">
                      <div class="demo-node"></div>
                      <div class="demo-node"></div>
                    </div>
                  </div>
                  
                  <div v-else-if="layout.id === 'suzhou'" class="demo-suzhou">
                    <div class="demo-ancestor"></div>
                    <div class="demo-branches">
                      <div class="demo-branch"></div>
                      <div class="demo-branch"></div>
                    </div>
                  </div>
                  
                  <div v-else-if="layout.id === 'pagoda'" class="demo-pagoda">
                    <div class="demo-level">
                      <div class="demo-node"></div>
                    </div>
                    <div class="demo-level">
                      <div class="demo-node"></div>
                      <div class="demo-node"></div>
                    </div>
                    <div class="demo-level">
                      <div class="demo-node"></div>
                      <div class="demo-node"></div>
                      <div class="demo-node"></div>
                    </div>
                  </div>
                  
                  <div v-else-if="layout.id === 'fan'" class="demo-fan">
                    <div class="demo-center"></div>
                    <div class="demo-fan-branches">
                      <div class="demo-fan-node" style="transform: rotate(0deg) translateY(-30px)"></div>
                      <div class="demo-fan-node" style="transform: rotate(120deg) translateY(-30px)"></div>
                      <div class="demo-fan-node" style="transform: rotate(240deg) translateY(-30px)"></div>
                    </div>
                  </div>
                  
                  <div v-else-if="layout.id === 'tree'" class="demo-tree">
                    <div class="demo-trunk"></div>
                    <div class="demo-tree-branches">
                      <div class="demo-tree-node"></div>
                      <div class="demo-tree-node"></div>
                    </div>
                  </div>
                  
                  <div v-else-if="layout.id === 'circular'" class="demo-circular">
                    <div class="demo-center"></div>
                    <div class="demo-circle">
                      <div class="demo-circle-node" style="transform: rotate(0deg) translateY(-25px)"></div>
                      <div class="demo-circle-node" style="transform: rotate(90deg) translateY(-25px)"></div>
                      <div class="demo-circle-node" style="transform: rotate(180deg) translateY(-25px)"></div>
                      <div class="demo-circle-node" style="transform: rotate(270deg) translateY(-25px)"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="layout-info">
                <div class="layout-name">{{ layout.name }}</div>
                <div class="layout-description">{{ layout.description }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showLayoutSelector = false" class="cancel-btn">取消</button>
          <button @click="applyLayoutChange" class="apply-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在切换布局...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MemberCard from '../../../components/genealogy/MemberCard.vue'
import MemberDetailPanel from '../../../components/genealogy/MemberDetailPanel.vue'
import TreeBranch from '../../../components/genealogy/TreeBranch.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// 状态管理
const isLoading = ref(false)
const showLayoutSelector = ref(false)
const selectedMember = ref(null)
const currentLayout = ref('european')
const showGenerationLabels = ref(true)
const showRelationshipLines = ref(true)

// 族谱信息
const genealogyInfo = ref({
  id: genealogyId.value,
  name: '叶氏家族族谱',
  description: '传承千年的叶氏家族血脉',
  createdAt: '2023-01-01',
  memberCount: 0
})

// 可用布局
const availableLayouts = ref([
  {
    id: 'european',
    name: '欧式排版',
    description: '横向展开，层次分明',
    icon: 'heroicons:bars-3-bottom-left'
  },
  {
    id: 'suzhou',
    name: '苏式排版',
    description: '纵向展开，分房明确',
    icon: 'heroicons:bars-3-center-left'
  },
  {
    id: 'pagoda',
    name: '宝塔式排版',
    description: '塔形结构，层层递进',
    icon: 'heroicons:triangle-up'
  },
  {
    id: 'fan',
    name: '扇形排版',
    description: '扇形展开，辐射分布',
    icon: 'heroicons:chart-pie'
  },
  {
    id: 'tree',
    name: '树形排版',
    description: '树状结构，自然生长',
    icon: 'heroicons:tree'
  },
  {
    id: 'circular',
    name: '环形排版',
    description: '环形分布，循环展示',
    icon: 'heroicons:arrow-path-rounded-square'
  }
])

// 布局定制化设置
const layoutCustomization = reactive({
  avatars: {
    size: 'medium',
    showAvatars: true,
    showNames: true,
    showDates: true,
    showTitles: false
  },
  spacing: {
    memberSpacing: 80,
    generationSpacing: 120,
    branchSpacing: 100,
    marginSize: 40
  },
  connections: {
    lineStyle: 'solid',
    lineWidth: 2,
    lineColor: '#666666',
    showArrows: false,
    connectionType: 'orthogonal'
  },
  decorations: {
    showBorders: true,
    borderStyle: 'solid',
    showShadows: true,
    shadowIntensity: 0.3,
    showGenerationLabels: true,
    showPatriarchCrown: true,
    backgroundPattern: 'none'
  }
})

// 家族成员数据
const familyMembers = ref([
  {
    id: 1,
    name: '叶德华',
    gender: 'male',
    generation: 1,
    birthDate: '1920-01-15',
    deathDate: '1995-12-20',
    avatar: '/mock-avatar-1.jpg',
    isPatriarch: true,
    isAlive: false,
    fatherId: null,
    motherId: null,
    spouseIds: [2],
    childrenIds: [3, 4],
    title: '始祖',
    location: '广东梅州',
    occupation: '农民',
    branchId: 'main'
  },
  {
    id: 2,
    name: '王秀英',
    gender: 'female',
    generation: 1,
    birthDate: '1925-03-10',
    deathDate: '2000-08-15',
    avatar: '/mock-avatar-5.jpg',
    isPatriarch: false,
    isAlive: false,
    fatherId: null,
    motherId: null,
    spouseIds: [1],
    childrenIds: [3, 4],
    title: '始祖母',
    location: '广东梅州',
    occupation: '家庭主妇',
    branchId: 'main'
  },
  {
    id: 3,
    name: '叶建国',
    gender: 'male',
    generation: 2,
    birthDate: '1950-05-20',
    deathDate: null,
    avatar: '/mock-avatar-2.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 1,
    motherId: 2,
    spouseIds: [8],
    childrenIds: [5, 6],
    title: '长子',
    location: '广东深圳',
    occupation: '工程师',
    branchId: 'branch1'
  },
  {
    id: 4,
    name: '叶建华',
    gender: 'male',
    generation: 2,
    birthDate: '1952-08-12',
    deathDate: null,
    avatar: '/mock-avatar-3.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 1,
    motherId: 2,
    spouseIds: [9],
    childrenIds: [7],
    title: '次子',
    location: '广东广州',
    occupation: '医生',
    branchId: 'branch2'
  },
  {
    id: 5,
    name: '叶小明',
    gender: 'male',
    generation: 3,
    birthDate: '1980-02-14',
    deathDate: null,
    avatar: '/mock-avatar-4.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 3,
    motherId: 8,
    spouseIds: [10],
    childrenIds: [11, 12],
    title: '长孙',
    location: '北京',
    occupation: '软件工程师',
    branchId: 'branch1'
  },
  {
    id: 6,
    name: '叶小红',
    gender: 'female',
    generation: 3,
    birthDate: '1985-07-22',
    deathDate: null,
    avatar: '/mock-avatar-6.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 3,
    motherId: 8,
    spouseIds: [],
    childrenIds: [],
    title: '孙女',
    location: '上海',
    occupation: '设计师',
    branchId: 'branch1'
  },
  {
    id: 7,
    name: '叶小华',
    gender: 'male',
    generation: 3,
    birthDate: '1983-11-05',
    deathDate: null,
    avatar: '/mock-avatar-7.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 4,
    motherId: 9,
    spouseIds: [],
    childrenIds: [],
    title: '次孙',
    location: '广东广州',
    occupation: '律师',
    branchId: 'branch2'
  },
  {
    id: 8,
    name: '李美丽',
    gender: 'female',
    generation: 2,
    birthDate: '1955-12-03',
    deathDate: null,
    avatar: '/mock-avatar-8.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: null,
    motherId: null,
    spouseIds: [3],
    childrenIds: [5, 6],
    title: '长媳',
    location: '广东深圳',
    occupation: '教师',
    branchId: 'branch1'
  },
  {
    id: 9,
    name: '张丽华',
    gender: 'female',
    generation: 2,
    birthDate: '1958-04-18',
    deathDate: null,
    avatar: '/mock-avatar-9.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: null,
    motherId: null,
    spouseIds: [4],
    childrenIds: [7],
    title: '次媳',
    location: '广东广州',
    occupation: '护士',
    branchId: 'branch2'
  },
  {
    id: 10,
    name: '陈雅琪',
    gender: 'female',
    generation: 3,
    birthDate: '1985-09-30',
    deathDate: null,
    avatar: '/mock-avatar-10.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: null,
    motherId: null,
    spouseIds: [5],
    childrenIds: [11, 12],
    title: '长孙媳',
    location: '北京',
    occupation: '会计师',
    branchId: 'branch1'
  },
  {
    id: 11,
    name: '叶天宇',
    gender: 'male',
    generation: 4,
    birthDate: '2010-06-15',
    deathDate: null,
    avatar: '/mock-avatar-11.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 5,
    motherId: 10,
    spouseIds: [],
    childrenIds: [],
    title: '曾孙',
    location: '北京',
    occupation: '学生',
    branchId: 'branch1'
  },
  {
    id: 12,
    name: '叶心怡',
    gender: 'female',
    generation: 4,
    birthDate: '2012-12-08',
    deathDate: null,
    avatar: '/mock-avatar-12.jpg',
    isPatriarch: false,
    isAlive: true,
    fatherId: 5,
    motherId: 10,
    spouseIds: [],
    childrenIds: [],
    title: '曾孙女',
    location: '北京',
    occupation: '学生',
    branchId: 'branch1'
  }
])

// 计算属性
const maxGeneration = computed(() => {
  return Math.max(...familyMembers.value.map(m => m.generation))
})

const renderedGenerations = computed(() => {
  const generations = {}
  familyMembers.value.forEach(member => {
    if (!generations[member.generation]) {
      generations[member.generation] = []
    }
    generations[member.generation].push(member)
  })

  return Object.keys(generations)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(gen => generations[gen])
})

const canvasStyle = computed(() => {
  return {
    '--member-spacing': layoutCustomization.spacing.memberSpacing + 'px',
    '--generation-spacing': layoutCustomization.spacing.generationSpacing + 'px',
    '--branch-spacing': layoutCustomization.spacing.branchSpacing + 'px',
    '--margin-size': layoutCustomization.spacing.marginSize + 'px'
  }
})

// 生命周期
onMounted(() => {
  loadGenealogyData()
  loadLayoutSettings()
})

// 监听布局变化
watch(currentLayout, (newLayout) => {
  nextTick(() => {
    renderConnections()
  })
})

// 方法
const loadGenealogyData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        familyMembers.value = result.data
        genealogyInfo.value.memberCount = result.data.length
      }
    }
  } catch (error) {
    console.error('加载族谱数据失败:', error)
  }
}

const loadLayoutSettings = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/layout`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        currentLayout.value = result.data.layout || 'european'
        Object.assign(layoutCustomization, result.data.customization || layoutCustomization)
      }
    }
  } catch (error) {
    console.error('加载布局设置失败:', error)
  }
}

const switchLayout = async (layoutId) => {
  if (layoutId === currentLayout.value) return

  isLoading.value = true

  try {
    // 保存当前布局设置
    await saveLayoutSettings(layoutId)

    // 切换布局
    currentLayout.value = layoutId

    // 等待DOM更新后重新渲染连接线
    await nextTick()
    renderConnections()

    appStore.showToast(`已切换到${getCurrentLayoutName()}`, 'success')
  } catch (error) {
    console.error('切换布局失败:', error)
    appStore.showToast('切换布局失败', 'error')
  } finally {
    isLoading.value = false
    showLayoutSelector.value = false
  }
}

const saveLayoutSettings = async (layoutId) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/apply-layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        layout: layoutId,
        customization: layoutCustomization
      })
    })

    if (!response.ok) {
      throw new Error('保存布局设置失败')
    }
  } catch (error) {
    console.error('保存布局设置失败:', error)
    throw error
  }
}

const getCurrentLayoutName = () => {
  const layout = availableLayouts.value.find(l => l.id === currentLayout.value)
  return layout ? layout.name : '未知布局'
}

const selectMember = (member) => {
  selectedMember.value = member
}

const editMember = (member) => {
  router.push(`/genealogy/${genealogyId.value}/members/${member.id}/edit`)
}

const applyLayoutChange = () => {
  showLayoutSelector.value = false
}

// 布局适配方法

// 获取祖先成员（用于苏式布局）
const getAncestors = () => {
  return familyMembers.value.filter(member =>
    member.generation === 1 && member.isPatriarch
  )
}

// 获取家族分支（用于苏式布局）
const getFamilyBranches = () => {
  const branches = {}

  familyMembers.value.forEach(member => {
    if (member.generation >= 2) {
      if (!branches[member.branchId]) {
        branches[member.branchId] = {
          id: member.branchId,
          name: getBranchName(member.branchId),
          members: []
        }
      }
      branches[member.branchId].members.push(member)
    }
  })

  return Object.values(branches)
}

// 获取分支名称
const getBranchName = (branchId) => {
  const branchNames = {
    'main': '主支',
    'branch1': '长房',
    'branch2': '二房',
    'branch3': '三房',
    'branch4': '四房'
  }
  return branchNames[branchId] || branchId
}

// 获取宝塔层级（用于宝塔式布局）
const getPagodaLevels = () => {
  const levels = []
  for (let gen = 1; gen <= maxGeneration.value; gen++) {
    const levelMembers = familyMembers.value.filter(member => member.generation === gen)
    if (levelMembers.length > 0) {
      levels.push(levelMembers)
    }
  }
  return levels
}

// 获取中心成员（用于扇形和环形布局）
const getCenterMembers = () => {
  return familyMembers.value.filter(member =>
    member.generation === 1 || member.isPatriarch
  )
}

// 获取扇形环（用于扇形布局）
const getFanRings = () => {
  const rings = []
  for (let gen = 2; gen <= maxGeneration.value; gen++) {
    const ringMembers = familyMembers.value.filter(member => member.generation === gen)
    if (ringMembers.length > 0) {
      rings.push(ringMembers)
    }
  }
  return rings
}

// 获取根成员（用于树形布局）
const getRootMembers = () => {
  return familyMembers.value.filter(member =>
    !member.fatherId && !member.motherId
  )
}

// 获取树形分支（用于树形布局）
const getTreeBranches = () => {
  const branches = []
  const rootMembers = getRootMembers()

  rootMembers.forEach(root => {
    const branch = buildTreeBranch(root)
    if (branch.children.length > 0) {
      branches.push(branch)
    }
  })

  return branches
}

// 构建树形分支
const buildTreeBranch = (member) => {
  const children = familyMembers.value.filter(m =>
    m.fatherId === member.id || m.motherId === member.id
  )

  return {
    id: member.id,
    member: member,
    children: children.map(child => buildTreeBranch(child))
  }
}

// 获取环形环（用于环形布局）
const getCircularRings = () => {
  const rings = []
  for (let gen = 2; gen <= maxGeneration.value; gen++) {
    const ringMembers = familyMembers.value.filter(member => member.generation === gen)
    if (ringMembers.length > 0) {
      rings.push(ringMembers)
    }
  }
  return rings
}

// 样式计算方法

// 获取成员样式类
const getMemberClasses = (member) => {
  return [
    member.gender,
    {
      patriarch: member.isPatriarch,
      deceased: !member.isAlive,
      selected: selectedMember.value?.id === member.id
    }
  ]
}

// 获取成员样式
const getMemberStyle = (member) => {
  return {
    margin: `${layoutCustomization.spacing.memberSpacing / 4}px`
  }
}

// 获取世代行样式
const getGenerationRowStyle = (genIndex) => {
  return {
    marginBottom: layoutCustomization.spacing.generationSpacing + 'px'
  }
}

// 获取分支样式
const getBranchStyle = (branch) => {
  return {
    marginRight: layoutCustomization.spacing.branchSpacing + 'px'
  }
}

// 获取宝塔层级样式
const getPagodaLevelStyle = (levelIndex, memberCount) => {
  const baseWidth = 60 * memberCount
  return {
    width: baseWidth + 'px',
    marginBottom: layoutCustomization.spacing.generationSpacing + 'px'
  }
}

// 获取宝塔成员样式
const getPagodaMemberStyle = (levelIndex, memberCount) => {
  return {
    margin: `0 ${layoutCustomization.spacing.memberSpacing / 2}px`
  }
}

// 获取扇形环样式
const getFanRingStyle = (ringIndex) => {
  const radius = 80 + (ringIndex * 60)
  return {
    width: radius * 2 + 'px',
    height: radius * 2 + 'px'
  }
}

// 获取扇形成员样式
const getFanMemberStyle = (ringIndex, memberIndex, totalMembers) => {
  const radius = 80 + (ringIndex * 60)
  const angle = (360 / totalMembers) * memberIndex
  const radian = (angle * Math.PI) / 180
  const x = Math.cos(radian) * radius
  const y = Math.sin(radian) * radius

  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
  }
}

// 获取环形环样式
const getCircularRingStyle = (ringIndex) => {
  const radius = 60 + (ringIndex * 50)
  return {
    width: radius * 2 + 'px',
    height: radius * 2 + 'px'
  }
}

// 获取环形成员样式
const getCircularMemberStyle = (ringIndex, memberIndex, totalMembers) => {
  const radius = 60 + (ringIndex * 50)
  const angle = (360 / totalMembers) * memberIndex
  const radian = (angle * Math.PI) / 180
  const x = Math.cos(radian) * radius
  const y = Math.sin(radian) * radius

  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
  }
}

// 获取世代标签
const getGenerationLabel = (generation) => {
  const labels = ['一世', '二世', '三世', '四世', '五世', '六世', '七世', '八世']
  return labels[generation - 1] || `${generation}世`
}

// 连接线相关方法

// 获取渲染的连接线
const getRenderedConnections = () => {
  const connections = []

  switch (currentLayout.value) {
    case 'european':
      connections.push(...getEuropeanConnections())
      break
    case 'suzhou':
      connections.push(...getSuzhouConnections())
      break
    case 'pagoda':
      connections.push(...getPagodaConnections())
      break
    case 'tree':
      connections.push(...getTreeConnections())
      break
    case 'fan':
      connections.push(...getFanConnections())
      break
    case 'circular':
      connections.push(...getCircularConnections())
      break
  }

  return connections
}

// 获取欧式布局连接线
const getEuropeanConnections = () => {
  const connections = []

  familyMembers.value.forEach(member => {
    // 父子关系连线
    if (member.fatherId) {
      const father = familyMembers.value.find(m => m.id === member.fatherId)
      if (father) {
        connections.push({
          id: `father-${father.id}-${member.id}`,
          type: 'parent-child',
          path: calculateEuropeanPath(father, member)
        })
      }
    }

    // 夫妻关系连线
    if (member.spouseIds && member.spouseIds.length > 0) {
      member.spouseIds.forEach(spouseId => {
        const spouse = familyMembers.value.find(m => m.id === spouseId)
        if (spouse && member.id < spouse.id) { // 避免重复连线
          connections.push({
            id: `spouse-${member.id}-${spouse.id}`,
            type: 'spouse',
            path: calculateSpousePath(member, spouse)
          })
        }
      })
    }
  })

  return connections
}

// 计算欧式布局路径
const calculateEuropeanPath = (parent, child) => {
  // 这里需要根据实际DOM元素位置计算路径
  // 简化版本，实际应该获取元素的真实位置
  return `M 100 50 L 100 100 L 150 100`
}

// 计算配偶连线路径
const calculateSpousePath = (member1, member2) => {
  // 简化版本的配偶连线
  return `M 100 75 L 200 75`
}

// 其他布局的连接线方法（简化实现）
const getSuzhouConnections = () => []
const getPagodaConnections = () => []
const getTreeConnections = () => []
const getFanConnections = () => []
const getCircularConnections = () => []

// 渲染连接线
const renderConnections = () => {
  // 在实际实现中，这里会重新计算所有连接线的路径
  console.log('重新渲染连接线')
}

// 获取线条样式
const getStrokeDashArray = () => {
  switch (layoutCustomization.connections.lineStyle) {
    case 'dashed':
      return '5,5'
    case 'dotted':
      return '2,2'
    default:
      return 'none'
  }
}
</script>

<style scoped>
.universal-genealogy-renderer {
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

.back-btn, .layout-btn {
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

.layout-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 布局切换器 */
.layout-switcher {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.current-layout-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.layout-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.member-count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

.layout-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.layout-tab {
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
}

.layout-tab:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.layout-tab.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 族谱容器 */
.genealogy-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.genealogy-canvas {
  min-height: 100%;
  position: relative;
  padding: var(--margin-size, 40px);
  transition: all 0.3s ease;
}

/* 欧式布局 */
.european-layout {
  display: flex;
  flex-direction: column;
  gap: var(--generation-spacing, 120px);
  align-items: center;
}

.generation-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.generation-label {
  background: #07c160;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.members-row {
  display: flex;
  gap: var(--member-spacing, 80px);
  flex-wrap: wrap;
  justify-content: center;
}

/* 苏式布局 */
.suzhou-layout {
  display: flex;
  flex-direction: column;
  gap: var(--generation-spacing, 120px);
}

.ancestor-section {
  display: flex;
  justify-content: center;
  gap: var(--member-spacing, 80px);
}

.branches-section {
  display: flex;
  gap: var(--branch-spacing, 100px);
  justify-content: space-around;
  flex-wrap: wrap;
}

.family-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 200px;
}

.branch-header {
  text-align: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.branch-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.branch-count {
  font-size: 12px;
  color: #666;
}

.branch-members {
  display: flex;
  flex-direction: column;
  gap: var(--member-spacing, 80px);
  align-items: center;
}

/* 宝塔布局 */
.pagoda-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--generation-spacing, 120px);
}

.pagoda-level {
  display: flex;
  justify-content: center;
  gap: var(--member-spacing, 80px);
  flex-wrap: wrap;
}

.pagoda-level.level-1 {
  transform: scale(1.2);
}

.pagoda-level.level-2 {
  transform: scale(1.1);
}

/* 扇形布局 */
.fan-layout {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fan-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.fan-rings {
  position: relative;
}

.fan-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed #ddd;
}

.fan-member {
  position: absolute;
}

/* 树形布局 */
.tree-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--generation-spacing, 120px);
}

.tree-root {
  display: flex;
  justify-content: center;
  gap: var(--member-spacing, 80px);
}

.tree-branches {
  display: flex;
  gap: var(--branch-spacing, 100px);
  justify-content: center;
  flex-wrap: wrap;
}

/* 环形布局 */
.circular-layout {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.circular-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed #ddd;
}

.circular-member {
  position: absolute;
}

/* 成员节点 */
.member-node {
  transition: all 0.3s ease;
  cursor: pointer;
}

.member-node:hover {
  transform: scale(1.05);
  z-index: 5;
}

.member-node.selected {
  transform: scale(1.1);
  z-index: 10;
}

/* 关系连线 */
.relationship-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.relationship-lines path {
  transition: all 0.3s ease;
}

.relationship-lines path.spouse {
  stroke-width: 3;
}

.relationship-lines path.parent-child {
  stroke-width: 2;
}

/* 布局选择器弹窗 */
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

.layout-selector-modal {
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

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.layout-option {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.layout-option:hover {
  border-color: #07c160;
  background: #f9f9f9;
}

.layout-option.active {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.layout-preview {
  height: 120px;
  border-radius: 8px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.preview-demo {
  height: 100%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 演示布局样式 */
.demo-european {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.demo-row {
  display: flex;
  gap: 16px;
}

.demo-node {
  width: 20px;
  height: 20px;
  background: #07c160;
  border-radius: 4px;
}

.demo-suzhou {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.demo-ancestor {
  width: 24px;
  height: 24px;
  background: #ffd700;
  border-radius: 50%;
}

.demo-branches {
  display: flex;
  gap: 20px;
}

.demo-branch {
  width: 16px;
  height: 40px;
  background: #07c160;
  border-radius: 2px;
}

.demo-pagoda {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.demo-level {
  display: flex;
  gap: 8px;
}

.demo-fan {
  position: relative;
  width: 80px;
  height: 80px;
}

.demo-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #ffd700;
  border-radius: 50%;
}

.demo-fan-branches {
  position: relative;
  width: 100%;
  height: 100%;
}

.demo-fan-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  width: 12px;
  height: 12px;
  background: #07c160;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.demo-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.demo-trunk {
  width: 20px;
  height: 20px;
  background: #8B4513;
  border-radius: 50%;
}

.demo-tree-branches {
  display: flex;
  gap: 24px;
}

.demo-tree-node {
  width: 16px;
  height: 16px;
  background: #228B22;
  border-radius: 50%;
}

.demo-circular {
  position: relative;
  width: 80px;
  height: 80px;
}

.demo-circle {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px dashed #ddd;
  border-radius: 50%;
}

.demo-circle-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  width: 10px;
  height: 10px;
  background: #07c160;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.layout-info {
  text-align: center;
}

.layout-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.layout-description {
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
  .layout-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .members-row {
    gap: calc(var(--member-spacing, 80px) / 2);
  }

  .branches-section {
    flex-direction: column;
    align-items: center;
    gap: calc(var(--branch-spacing, 100px) / 2);
  }

  .layout-grid {
    grid-template-columns: 1fr;
  }

  .fan-layout,
  .circular-layout {
    min-height: 400px;
  }

  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .genealogy-canvas {
    padding: calc(var(--margin-size, 40px) / 2);
  }

  .members-row {
    gap: calc(var(--member-spacing, 80px) / 3);
  }

  .generation-row {
    gap: 8px;
  }

  .pagoda-level {
    gap: calc(var(--member-spacing, 80px) / 3);
  }
}
</style>

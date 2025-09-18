<template>
  <div class="smart-recommendation">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">智能推荐</h1>
      <button @click="refreshRecommendations" class="refresh-btn">
        <iconify-icon icon="heroicons:arrow-path" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 推荐概览 -->
    <div class="recommendation-overview">
      <div class="overview-header">
        <h3>推荐概览</h3>
        <div class="last-update">最后更新：{{ formatTime(lastUpdateTime) }}</div>
      </div>
      
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:users" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ recommendations.members.length }}</div>
            <div class="stat-label">推荐成员</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:link" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ recommendations.relationships.length }}</div>
            <div class="stat-label">推荐关系</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:puzzle-piece" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ recommendations.missing.length }}</div>
            <div class="stat-label">缺失信息</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:exclamation-triangle" width="24"></iconify-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ recommendations.conflicts.length }}</div>
            <div class="stat-label">数据冲突</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐分类 -->
    <div class="recommendation-categories">
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.id"
          @click="activeCategory = category.id"
          :class="{ active: activeCategory === category.id }"
          class="category-tab"
        >
          <iconify-icon :icon="category.icon" width="16"></iconify-icon>
          <span>{{ category.name }}</span>
          <div v-if="getCategoryCount(category.id) > 0" class="count-badge">
            {{ getCategoryCount(category.id) }}
          </div>
        </button>
      </div>
    </div>

    <!-- 推荐内容 -->
    <div class="recommendation-content">
      <!-- 成员推荐 -->
      <div v-if="activeCategory === 'members'" class="member-recommendations">
        <div class="section-header">
          <h4>推荐成员</h4>
          <div class="section-description">基于姓名、年龄、地址等信息推荐可能的家族成员</div>
        </div>
        
        <div class="recommendation-list">
          <div 
            v-for="member in recommendations.members" 
            :key="member.id"
            class="recommendation-item member-item"
            :class="{ accepted: member.accepted, rejected: member.rejected }"
          >
            <div class="item-header">
              <div class="member-info">
                <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" />
                <div class="member-details">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-meta">
                    <span v-if="member.age">{{ member.age }}岁</span>
                    <span v-if="member.location">{{ member.location }}</span>
                  </div>
                </div>
              </div>
              
              <div class="confidence-score" :class="getConfidenceLevel(member.confidence)">
                <div class="score-value">{{ (member.confidence * 100).toFixed(0) }}%</div>
                <div class="score-label">匹配度</div>
              </div>
            </div>
            
            <div class="item-content">
              <div class="recommendation-reason">
                <h5>推荐理由</h5>
                <ul>
                  <li v-for="reason in member.reasons" :key="reason">{{ reason }}</li>
                </ul>
              </div>
              
              <div class="suggested-relationship">
                <h5>建议关系</h5>
                <div class="relationship-options">
                  <button 
                    v-for="relation in member.suggestedRelations" 
                    :key="relation.type"
                    @click="selectRelation(member, relation)"
                    :class="{ selected: member.selectedRelation === relation.type }"
                    class="relation-btn"
                  >
                    {{ relation.label }}
                    <span class="relation-confidence">({{ (relation.confidence * 100).toFixed(0) }}%)</span>
                  </button>
                </div>
              </div>
              
              <div v-if="member.additionalInfo" class="additional-info">
                <h5>补充信息</h5>
                <div class="info-grid">
                  <div v-for="(value, key) in member.additionalInfo" :key="key" class="info-item">
                    <span class="info-label">{{ getInfoLabel(key) }}:</span>
                    <span class="info-value">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <button @click="rejectRecommendation(member)" class="reject-btn">
                <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
                <span>拒绝</span>
              </button>
              <button @click="acceptRecommendation(member)" class="accept-btn">
                <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
                <span>接受</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 关系推荐 -->
      <div v-if="activeCategory === 'relationships'" class="relationship-recommendations">
        <div class="section-header">
          <h4>推荐关系</h4>
          <div class="section-description">基于现有数据推荐可能的家族关系连接</div>
        </div>
        
        <div class="recommendation-list">
          <div 
            v-for="relationship in recommendations.relationships" 
            :key="relationship.id"
            class="recommendation-item relationship-item"
            :class="{ accepted: relationship.accepted, rejected: relationship.rejected }"
          >
            <div class="item-header">
              <div class="relationship-info">
                <div class="member-pair">
                  <div class="member-card">
                    <img :src="relationship.member1.avatar || '/default-avatar.png'" :alt="relationship.member1.name" />
                    <div class="member-name">{{ relationship.member1.name }}</div>
                  </div>
                  
                  <div class="relationship-arrow">
                    <iconify-icon icon="heroicons:arrow-right" width="20"></iconify-icon>
                    <div class="relationship-type">{{ relationship.type }}</div>
                  </div>
                  
                  <div class="member-card">
                    <img :src="relationship.member2.avatar || '/default-avatar.png'" :alt="relationship.member2.name" />
                    <div class="member-name">{{ relationship.member2.name }}</div>
                  </div>
                </div>
              </div>
              
              <div class="confidence-score" :class="getConfidenceLevel(relationship.confidence)">
                <div class="score-value">{{ (relationship.confidence * 100).toFixed(0) }}%</div>
                <div class="score-label">可信度</div>
              </div>
            </div>
            
            <div class="item-content">
              <div class="recommendation-reason">
                <h5>推荐依据</h5>
                <ul>
                  <li v-for="evidence in relationship.evidence" :key="evidence">{{ evidence }}</li>
                </ul>
              </div>
              
              <div v-if="relationship.conflictingData" class="conflicting-data">
                <h5>冲突数据</h5>
                <div class="conflict-warning">
                  <iconify-icon icon="heroicons:exclamation-triangle" width="16"></iconify-icon>
                  <span>{{ relationship.conflictingData }}</span>
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <button @click="rejectRecommendation(relationship)" class="reject-btn">
                <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
                <span>拒绝</span>
              </button>
              <button @click="acceptRecommendation(relationship)" class="accept-btn">
                <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
                <span>接受</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 缺失信息 -->
      <div v-if="activeCategory === 'missing'" class="missing-recommendations">
        <div class="section-header">
          <h4>缺失信息</h4>
          <div class="section-description">检测到的族谱信息缺失，建议补充完善</div>
        </div>
        
        <div class="recommendation-list">
          <div 
            v-for="missing in recommendations.missing" 
            :key="missing.id"
            class="recommendation-item missing-item"
          >
            <div class="item-header">
              <div class="missing-info">
                <div class="missing-icon" :class="missing.priority">
                  <iconify-icon :icon="getMissingIcon(missing.type)" width="20"></iconify-icon>
                </div>
                <div class="missing-details">
                  <div class="missing-title">{{ missing.title }}</div>
                  <div class="missing-description">{{ missing.description }}</div>
                </div>
              </div>
              
              <div class="priority-badge" :class="missing.priority">
                {{ getPriorityText(missing.priority) }}
              </div>
            </div>
            
            <div class="item-content">
              <div class="affected-members">
                <h5>影响成员</h5>
                <div class="member-list">
                  <div 
                    v-for="member in missing.affectedMembers" 
                    :key="member.id"
                    class="affected-member"
                  >
                    <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" />
                    <span>{{ member.name }}</span>
                  </div>
                </div>
              </div>
              
              <div class="suggested-actions">
                <h5>建议操作</h5>
                <ul>
                  <li v-for="action in missing.suggestedActions" :key="action">{{ action }}</li>
                </ul>
              </div>
            </div>
            
            <div class="item-actions">
              <button @click="dismissMissing(missing)" class="dismiss-btn">
                <iconify-icon icon="heroicons:eye-slash" width="16"></iconify-icon>
                <span>忽略</span>
              </button>
              <button @click="fixMissing(missing)" class="fix-btn">
                <iconify-icon icon="heroicons:wrench-screwdriver" width="16"></iconify-icon>
                <span>修复</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 数据冲突 -->
      <div v-if="activeCategory === 'conflicts'" class="conflict-recommendations">
        <div class="section-header">
          <h4>数据冲突</h4>
          <div class="section-description">检测到的数据不一致问题，需要人工确认</div>
        </div>
        
        <div class="recommendation-list">
          <div 
            v-for="conflict in recommendations.conflicts" 
            :key="conflict.id"
            class="recommendation-item conflict-item"
          >
            <div class="item-header">
              <div class="conflict-info">
                <div class="conflict-icon">
                  <iconify-icon icon="heroicons:exclamation-triangle" width="20"></iconify-icon>
                </div>
                <div class="conflict-details">
                  <div class="conflict-title">{{ conflict.title }}</div>
                  <div class="conflict-description">{{ conflict.description }}</div>
                </div>
              </div>
              
              <div class="severity-badge" :class="conflict.severity">
                {{ getSeverityText(conflict.severity) }}
              </div>
            </div>
            
            <div class="item-content">
              <div class="conflict-data">
                <h5>冲突数据</h5>
                <div class="data-comparison">
                  <div class="data-option" v-for="option in conflict.options" :key="option.id">
                    <div class="option-header">
                      <input 
                        type="radio" 
                        :name="`conflict-${conflict.id}`"
                        :value="option.id"
                        v-model="conflict.selectedOption"
                      />
                      <label>{{ option.source }}</label>
                      <div class="option-confidence">可信度: {{ (option.confidence * 100).toFixed(0) }}%</div>
                    </div>
                    <div class="option-data">
                      <div v-for="(value, key) in option.data" :key="key" class="data-item">
                        <span class="data-key">{{ key }}:</span>
                        <span class="data-value">{{ value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="conflict-impact">
                <h5>影响范围</h5>
                <div class="impact-description">{{ conflict.impact }}</div>
              </div>
            </div>
            
            <div class="item-actions">
              <button @click="ignoreConflict(conflict)" class="ignore-btn">
                <iconify-icon icon="heroicons:eye-slash" width="16"></iconify-icon>
                <span>忽略</span>
              </button>
              <button @click="resolveConflict(conflict)" class="resolve-btn">
                <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
                <span>解决</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="hasSelectedItems" class="batch-actions">
      <div class="batch-info">
        <span>已选择 {{ selectedItems.length }} 项</span>
      </div>
      <div class="batch-buttons">
        <button @click="batchReject" class="batch-reject-btn">
          <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
          <span>批量拒绝</span>
        </button>
        <button @click="batchAccept" class="batch-accept-btn">
          <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
          <span>批量接受</span>
        </button>
      </div>
    </div>

    <!-- 推荐设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="settings-modal" @click.stop>
        <div class="modal-header">
          <h3>推荐设置</h3>
          <button @click="showSettings = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="settings-sections">
            <div class="settings-section">
              <h4>推荐算法</h4>
              <div class="algorithm-options">
                <label class="option-item">
                  <input type="radio" v-model="settings.algorithm" value="similarity" />
                  <span>相似度匹配</span>
                  <div class="option-description">基于姓名、年龄、地址等信息的相似度</div>
                </label>
                <label class="option-item">
                  <input type="radio" v-model="settings.algorithm" value="network" />
                  <span>社交网络分析</span>
                  <div class="option-description">基于现有关系网络推断新关系</div>
                </label>
                <label class="option-item">
                  <input type="radio" v-model="settings.algorithm" value="hybrid" />
                  <span>混合算法</span>
                  <div class="option-description">结合多种算法的综合推荐</div>
                </label>
              </div>
            </div>
            
            <div class="settings-section">
              <h4>置信度阈值</h4>
              <div class="threshold-sliders">
                <div class="slider-item">
                  <label>成员推荐阈值</label>
                  <input 
                    type="range" 
                    v-model="settings.memberThreshold" 
                    min="0.1" 
                    max="1" 
                    step="0.1"
                  />
                  <span>{{ (settings.memberThreshold * 100).toFixed(0) }}%</span>
                </div>
                <div class="slider-item">
                  <label>关系推荐阈值</label>
                  <input 
                    type="range" 
                    v-model="settings.relationshipThreshold" 
                    min="0.1" 
                    max="1" 
                    step="0.1"
                  />
                  <span>{{ (settings.relationshipThreshold * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
            
            <div class="settings-section">
              <h4>推荐频率</h4>
              <select v-model="settings.frequency">
                <option value="realtime">实时推荐</option>
                <option value="daily">每日更新</option>
                <option value="weekly">每周更新</option>
                <option value="manual">手动刷新</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="resetSettings" class="reset-btn">重置</button>
          <button @click="saveSettings" class="save-btn">保存设置</button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在分析推荐...</div>
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

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// 状态
const isLoading = ref(false)
const showSettings = ref(false)
const activeCategory = ref('members')
const lastUpdateTime = ref(new Date())
const selectedItems = ref([])

// 推荐分类
const categories = ref([
  { id: 'members', name: '成员推荐', icon: 'heroicons:users' },
  { id: 'relationships', name: '关系推荐', icon: 'heroicons:link' },
  { id: 'missing', name: '缺失信息', icon: 'heroicons:puzzle-piece' },
  { id: 'conflicts', name: '数据冲突', icon: 'heroicons:exclamation-triangle' }
])

// 推荐设置
const settings = reactive({
  algorithm: 'hybrid',
  memberThreshold: 0.6,
  relationshipThreshold: 0.7,
  frequency: 'daily'
})

// 推荐数据
const recommendations = ref({
  members: [
    {
      id: 1,
      name: '叶志强',
      age: 45,
      location: '广东梅州',
      avatar: '/mock-avatar-8.jpg',
      confidence: 0.85,
      reasons: [
        '姓氏匹配：同为叶姓',
        '地理位置：同在广东梅州地区',
        '年龄推算：符合第二代年龄范围',
        '社交网络：与叶建国有共同联系人'
      ],
      suggestedRelations: [
        { type: 'brother', label: '兄弟', confidence: 0.8 },
        { type: 'cousin', label: '堂兄弟', confidence: 0.6 },
        { type: 'uncle', label: '叔伯', confidence: 0.3 }
      ],
      selectedRelation: null,
      additionalInfo: {
        occupation: '医生',
        education: '中山大学',
        phone: '138****5678'
      },
      accepted: false,
      rejected: false
    },
    {
      id: 2,
      name: '叶美玲',
      age: 38,
      location: '广东深圳',
      avatar: '/mock-avatar-9.jpg',
      confidence: 0.72,
      reasons: [
        '姓氏匹配：同为叶姓',
        '地理位置：在广东省内',
        '年龄推算：符合第三代年龄范围',
        '教育背景：与叶小明同校毕业'
      ],
      suggestedRelations: [
        { type: 'cousin', label: '堂姐妹', confidence: 0.7 },
        { type: 'sister', label: '姐妹', confidence: 0.5 },
        { type: 'aunt', label: '姑姨', confidence: 0.2 }
      ],
      selectedRelation: null,
      additionalInfo: {
        occupation: '律师',
        education: '华南理工大学',
        company: '深圳某律师事务所'
      },
      accepted: false,
      rejected: false
    }
  ],
  relationships: [
    {
      id: 1,
      member1: { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg' },
      member2: { id: 7, name: '叶志华', avatar: '/mock-avatar-10.jpg' },
      type: '兄弟关系',
      confidence: 0.78,
      evidence: [
        '相同的父母信息：叶德华、王秀英',
        '出生年份接近：1950年和1952年',
        '相同的出生地：广东梅州',
        '家族照片中经常同时出现'
      ],
      conflictingData: null,
      accepted: false,
      rejected: false
    },
    {
      id: 2,
      member1: { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg' },
      member2: { id: 8, name: '张丽华', avatar: '/mock-avatar-11.jpg' },
      type: '夫妻关系',
      confidence: 0.65,
      evidence: [
        '社交媒体显示关系密切',
        '共同居住地址：北京朝阳区',
        '参与相同的家族活动',
        '年龄相近且未婚状态'
      ],
      conflictingData: '张丽华的户籍信息显示已婚，但配偶信息不明',
      accepted: false,
      rejected: false
    }
  ],
  missing: [
    {
      id: 1,
      type: 'spouse',
      title: '配偶信息缺失',
      description: '部分成员缺少配偶信息，影响家族关系完整性',
      priority: 'high',
      affectedMembers: [
        { id: 5, name: '叶小明', avatar: '/mock-avatar-3.jpg' },
        { id: 6, name: '叶小红', avatar: '/mock-avatar-4.jpg' }
      ],
      suggestedActions: [
        '联系相关成员确认婚姻状态',
        '查询民政部门婚姻登记信息',
        '通过家族群聊收集信息'
      ]
    },
    {
      id: 2,
      type: 'children',
      title: '子女信息不完整',
      description: '一些成员的子女信息可能不完整',
      priority: 'medium',
      affectedMembers: [
        { id: 3, name: '叶建国', avatar: '/mock-avatar-2.jpg' }
      ],
      suggestedActions: [
        '确认是否还有其他子女',
        '核实子女的基本信息',
        '补充子女的联系方式'
      ]
    }
  ],
  conflicts: [
    {
      id: 1,
      title: '出生日期冲突',
      description: '叶德华的出生日期在不同来源中存在差异',
      severity: 'medium',
      options: [
        {
          id: 'option1',
          source: '身份证信息',
          confidence: 0.9,
          data: {
            '出生日期': '1920年1月15日',
            '来源': '官方身份证件',
            '录入时间': '2023年1月'
          }
        },
        {
          id: 'option2',
          source: '家族记录',
          confidence: 0.7,
          data: {
            '出生日期': '1920年1月20日',
            '来源': '家族族谱记录',
            '录入时间': '2022年12月'
          }
        }
      ],
      selectedOption: null,
      impact: '影响年龄计算和生肖属相，可能影响其他相关推荐的准确性'
    }
  ]
})

// 计算属性
const hasSelectedItems = computed(() => {
  return selectedItems.value.length > 0
})

// 生命周期
onMounted(() => {
  loadRecommendations()
})

// 方法
const loadRecommendations = async () => {
  isLoading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/recommendations`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        recommendations.value = result.data || recommendations.value
        lastUpdateTime.value = new Date()
      }
    }
  } catch (error) {
    console.error('加载推荐数据失败:', error)
    // 使用模拟数据
  } finally {
    isLoading.value = false
  }
}

const refreshRecommendations = async () => {
  await loadRecommendations()
  appStore.showToast('推荐已刷新', 'success')
}

const getCategoryCount = (categoryId) => {
  switch (categoryId) {
    case 'members':
      return recommendations.value.members.filter(m => !m.accepted && !m.rejected).length
    case 'relationships':
      return recommendations.value.relationships.filter(r => !r.accepted && !r.rejected).length
    case 'missing':
      return recommendations.value.missing.length
    case 'conflicts':
      return recommendations.value.conflicts.length
    default:
      return 0
  }
}

const getConfidenceLevel = (confidence) => {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

const selectRelation = (member, relation) => {
  member.selectedRelation = relation.type
}

const acceptRecommendation = async (item) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/recommendations/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        type: item.member1 ? 'relationship' : 'member',
        id: item.id,
        selectedRelation: item.selectedRelation
      })
    })

    if (response.ok) {
      item.accepted = true
      appStore.showToast('推荐已接受', 'success')
    }
  } catch (error) {
    console.error('接受推荐失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const rejectRecommendation = async (item) => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/recommendations/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        type: item.member1 ? 'relationship' : 'member',
        id: item.id
      })
    })

    if (response.ok) {
      item.rejected = true
      appStore.showToast('推荐已拒绝', 'success')
    }
  } catch (error) {
    console.error('拒绝推荐失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const dismissMissing = (missing) => {
  const index = recommendations.value.missing.indexOf(missing)
  if (index > -1) {
    recommendations.value.missing.splice(index, 1)
    appStore.showToast('已忽略该项', 'info')
  }
}

const fixMissing = (missing) => {
  // 跳转到相应的修复页面
  if (missing.type === 'spouse') {
    router.push(`/genealogy/${genealogyId.value}/members/${missing.affectedMembers[0].id}/edit`)
  } else {
    appStore.showToast('修复功能开发中', 'info')
  }
}

const ignoreConflict = (conflict) => {
  const index = recommendations.value.conflicts.indexOf(conflict)
  if (index > -1) {
    recommendations.value.conflicts.splice(index, 1)
    appStore.showToast('已忽略该冲突', 'info')
  }
}

const resolveConflict = async (conflict) => {
  if (!conflict.selectedOption) {
    appStore.showToast('请先选择一个选项', 'warning')
    return
  }

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/conflicts/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        conflictId: conflict.id,
        selectedOption: conflict.selectedOption
      })
    })

    if (response.ok) {
      const index = recommendations.value.conflicts.indexOf(conflict)
      if (index > -1) {
        recommendations.value.conflicts.splice(index, 1)
      }
      appStore.showToast('冲突已解决', 'success')
    }
  } catch (error) {
    console.error('解决冲突失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

const batchAccept = async () => {
  // 批量接受逻辑
  appStore.showToast('批量接受功能开发中', 'info')
}

const batchReject = async () => {
  // 批量拒绝逻辑
  appStore.showToast('批量拒绝功能开发中', 'info')
}

const resetSettings = () => {
  Object.assign(settings, {
    algorithm: 'hybrid',
    memberThreshold: 0.6,
    relationshipThreshold: 0.7,
    frequency: 'daily'
  })
}

const saveSettings = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/recommendation-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(settings)
    })

    if (response.ok) {
      showSettings.value = false
      appStore.showToast('设置已保存', 'success')
      await loadRecommendations() // 重新加载推荐
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    appStore.showToast('保存失败', 'error')
  }
}

// 辅助方法
const getInfoLabel = (key) => {
  const labels = {
    occupation: '职业',
    education: '学历',
    phone: '电话',
    company: '公司',
    address: '地址'
  }
  return labels[key] || key
}

const getMissingIcon = (type) => {
  const icons = {
    spouse: 'heroicons:heart',
    children: 'heroicons:users',
    parents: 'heroicons:user-group',
    dates: 'heroicons:calendar',
    photos: 'heroicons:photo'
  }
  return icons[type] || 'heroicons:question-mark-circle'
}

const getPriorityText = (priority) => {
  const texts = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || priority
}

const getSeverityText = (severity) => {
  const texts = {
    high: '严重',
    medium: '中等',
    low: '轻微'
  }
  return texts[severity] || severity
}

const formatTime = (time) => {
  return time.toLocaleString('zh-CN')
}
</script>

<style scoped>
.smart-recommendation {
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

.back-btn, .refresh-btn {
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

.refresh-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 通用区域样式 */
.recommendation-overview,
.recommendation-categories,
.recommendation-content {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 推荐概览 */
.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.overview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.last-update {
  font-size: 12px;
  color: #666;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 推荐分类 */
.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
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

.count-badge {
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.category-tab.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 推荐内容 */
.section-header {
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.2s;
}

.recommendation-item:hover {
  border-color: #07c160;
  background: #f9f9f9;
}

.recommendation-item.accepted {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.recommendation-item.rejected {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.05);
  opacity: 0.7;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-content {
  margin-bottom: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 成员推荐 */
.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.member-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
}

.confidence-score {
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  min-width: 60px;
}

.confidence-score.high {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
}

.confidence-score.medium {
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid #FF9800;
}

.confidence-score.low {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
}

.score-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.score-label {
  font-size: 10px;
  color: #666;
}

.recommendation-reason h5,
.suggested-relationship h5,
.additional-info h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.recommendation-reason ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #666;
}

.recommendation-reason li {
  margin-bottom: 4px;
}

.relationship-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.relation-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.relation-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.relation-btn.selected {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.relation-confidence {
  opacity: 0.8;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.info-item {
  font-size: 11px;
  color: #666;
}

.info-label {
  font-weight: 500;
}

.info-value {
  color: #333;
}

/* 关系推荐 */
.relationship-info {
  flex: 1;
}

.member-pair {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.member-card img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.member-card .member-name {
  font-size: 12px;
  color: #333;
}

.relationship-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #666;
}

.relationship-type {
  font-size: 10px;
  color: #666;
}

.conflicting-data {
  margin-top: 12px;
}

.conflict-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid #FF9800;
  border-radius: 4px;
  font-size: 11px;
  color: #e65100;
}

/* 缺失信息 */
.missing-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.missing-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.missing-icon.high {
  background: #f44336;
}

.missing-icon.medium {
  background: #FF9800;
}

.missing-icon.low {
  background: #9E9E9E;
}

.missing-details {
  flex: 1;
}

.missing-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.missing-description {
  font-size: 12px;
  color: #666;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.priority-badge.high {
  background: #f44336;
}

.priority-badge.medium {
  background: #FF9800;
}

.priority-badge.low {
  background: #9E9E9E;
}

.affected-members h5,
.suggested-actions h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.affected-member {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 11px;
  color: #333;
}

.affected-member img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.suggested-actions ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #666;
}

.suggested-actions li {
  margin-bottom: 4px;
}

/* 数据冲突 */
.conflict-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.conflict-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FF9800;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conflict-details {
  flex: 1;
}

.conflict-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.conflict-description {
  font-size: 12px;
  color: #666;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.severity-badge.high {
  background: #f44336;
}

.severity-badge.medium {
  background: #FF9800;
}

.severity-badge.low {
  background: #9E9E9E;
}

.conflict-data h5,
.conflict-impact h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.data-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-option {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px;
  background: white;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.option-header input[type="radio"] {
  accent-color: #07c160;
}

.option-header label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.option-confidence {
  font-size: 10px;
  color: #666;
}

.option-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 20px;
}

.data-item {
  font-size: 11px;
  color: #666;
}

.data-key {
  font-weight: 500;
}

.data-value {
  color: #333;
}

.impact-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 操作按钮 */
.reject-btn, .accept-btn, .dismiss-btn, .fix-btn, .ignore-btn, .resolve-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.reject-btn, .dismiss-btn, .ignore-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.reject-btn:hover, .dismiss-btn:hover, .ignore-btn:hover {
  background: #e0e0e0;
}

.accept-btn, .fix-btn, .resolve-btn {
  background: #07c160;
  color: white;
}

.accept-btn:hover, .fix-btn:hover, .resolve-btn:hover {
  background: #06a552;
}

/* 批量操作 */
.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
}

.batch-info {
  font-size: 14px;
  color: #333;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.batch-reject-btn, .batch-accept-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.batch-reject-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.batch-accept-btn {
  background: #07c160;
  color: white;
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

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.algorithm-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.option-item input[type="radio"] {
  accent-color: #07c160;
}

.option-description {
  font-size: 11px;
  color: #666;
  margin-left: 20px;
}

.threshold-sliders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-item label {
  min-width: 80px;
  font-size: 12px;
  color: #666;
}

.slider-item input[type="range"] {
  flex: 1;
  accent-color: #07c160;
}

.slider-item span {
  min-width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.settings-section select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
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
  .overview-stats {
    grid-template-columns: 1fr;
  }

  .member-pair {
    flex-direction: column;
    gap: 8px;
  }

  .relationship-arrow {
    transform: rotate(90deg);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .data-comparison {
    gap: 6px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 8px;
  }

  .batch-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

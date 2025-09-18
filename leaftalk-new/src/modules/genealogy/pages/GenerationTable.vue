<template>
  <div class="generation-table-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="家族字辈对照表" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-bar">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" class="search-icon"></iconify-icon>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="搜索字辈、地区或堂号..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
          <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
        </button>
      </div>
      
      <!-- 筛选选项 -->
      <div class="filter-tabs">
        <div 
          v-for="filter in filterOptions" 
          :key="filter.value"
          class="filter-tab"
          :class="{ active: currentFilter === filter.value }"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="table-content">
      <!-- 字辈对照表 -->
      <div class="generation-sections">
        <div 
          v-for="section in filteredSections" 
          :key="section.id"
          class="generation-section"
        >
          <div class="section-header">
            <h3>{{ section.title }}</h3>
            <span class="section-count">{{ section.generations.length }}个字辈</span>
          </div>
          
          <div class="generation-list">
            <div 
              v-for="(generation, index) in section.generations" 
              :key="index"
              class="generation-item"
              @click="showGenerationDetail(generation)"
            >
              <div class="generation-info">
                <div class="generation-number">第{{ getChineseNumber(index + 1) }}世</div>
                <div class="generation-char">{{ generation.char }}</div>
                <div class="generation-meaning">{{ generation.meaning }}</div>
              </div>
              
              <!-- 对照关系 -->
              <div v-if="generation.mappings && generation.mappings.length > 0" class="mappings">
                <div 
                  v-for="mapping in generation.mappings" 
                  :key="mapping.region"
                  class="mapping-item"
                >
                  <span class="mapping-region">{{ mapping.region }}</span>
                  <span class="mapping-char">{{ mapping.char }}</span>
                </div>
              </div>
              
              <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredSections.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:document-text" width="48" class="empty-icon"></iconify-icon>
        <h3>未找到相关字辈</h3>
        <p>请尝试其他搜索关键词或筛选条件</p>
        <button @click="clearSearch" class="reset-btn">
          重置搜索
        </button>
      </div>
    </div>

    <!-- 字辈详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="detail-modal" @click.stop>
        <div class="modal-header">
          <h3>字辈详情</h3>
          <button @click="closeDetailModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedGeneration" class="generation-detail">
            <div class="detail-row">
              <label>字辈</label>
              <span class="detail-char">{{ selectedGeneration.char }}</span>
            </div>
            <div class="detail-row">
              <label>含义</label>
              <span>{{ selectedGeneration.meaning }}</span>
            </div>
            <div class="detail-row">
              <label>世代</label>
              <span>第{{ selectedGeneration.generation }}世</span>
            </div>
            <div v-if="selectedGeneration.poem" class="detail-row">
              <label>族诗</label>
              <div class="poem-text">{{ selectedGeneration.poem }}</div>
            </div>
            
            <!-- 地区对照 -->
            <div v-if="selectedGeneration.mappings && selectedGeneration.mappings.length > 0" class="mappings-detail">
              <h4>地区对照</h4>
              <div class="mapping-list">
                <div 
                  v-for="mapping in selectedGeneration.mappings" 
                  :key="mapping.region"
                  class="mapping-detail-item"
                >
                  <div class="mapping-header">
                    <span class="mapping-region">{{ mapping.region }}</span>
                    <span class="mapping-char">{{ mapping.char }}</span>
                  </div>
                  <div v-if="mapping.note" class="mapping-note">
                    {{ mapping.note }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 使用此字辈的成员 -->
            <div v-if="selectedGeneration.members && selectedGeneration.members.length > 0" class="members-section">
              <h4>使用此字辈的成员</h4>
              <div class="members-list">
                <div 
                  v-for="member in selectedGeneration.members" 
                  :key="member.id"
                  class="member-item"
                  @click="viewMember(member)"
                >
                  <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" />
                  <span>{{ member.name }}</span>
                </div>
              </div>
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
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const searchQuery = ref('')
const currentFilter = ref('all')
const showDetailModal = ref(false)
const selectedGeneration = ref(null)

const filterOptions = ref([
  { label: '全部', value: 'all' },
  { label: '总谱', value: 'main' },
  { label: '分谱', value: 'branch' },
  { label: '有对照', value: 'mapped' }
])

const generationSections = ref([
  {
    id: 1,
    title: '张氏总谱字辈',
    type: 'main',
    generations: [
      {
        char: '文',
        meaning: '文采、文化',
        generation: 1,
        poem: '文武双全传家久',
        mappings: [
          { region: '北京分谱', char: '武', note: '北京地区使用武字辈' },
          { region: '上海分谱', char: '文', note: '与总谱一致' }
        ],
        members: [
          { id: 1, name: '张文华', avatar: '' },
          { id: 2, name: '张文明', avatar: '' }
        ]
      },
      {
        char: '武',
        meaning: '武功、勇武',
        generation: 2,
        poem: '武德传承显威名',
        mappings: [
          { region: '北京分谱', char: '文', note: '北京地区第二世使用文字辈' }
        ],
        members: []
      },
      {
        char: '德',
        meaning: '品德、道德',
        generation: 3,
        poem: '德高望重立家风',
        mappings: [],
        members: []
      }
    ]
  },
  {
    id: 2,
    title: '张氏北京分谱字辈',
    type: 'branch',
    generations: [
      {
        char: '武',
        meaning: '武功、勇武',
        generation: 1,
        poem: '武德传承显威名',
        mappings: [
          { region: '总谱', char: '文', note: '对应总谱文字辈' }
        ],
        members: []
      },
      {
        char: '文',
        meaning: '文采、文化',
        generation: 2,
        poem: '文武双全传家久',
        mappings: [
          { region: '总谱', char: '武', note: '对应总谱武字辈' }
        ],
        members: []
      }
    ]
  }
])

// 计算属性
const filteredSections = computed(() => {
  let sections = generationSections.value

  // 按类型筛选
  if (currentFilter.value !== 'all') {
    if (currentFilter.value === 'mapped') {
      sections = sections.filter(section => 
        section.generations.some(gen => gen.mappings && gen.mappings.length > 0)
      )
    } else {
      sections = sections.filter(section => section.type === currentFilter.value)
    }
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    sections = sections.map(section => ({
      ...section,
      generations: section.generations.filter(gen => 
        gen.char.toLowerCase().includes(query) ||
        gen.meaning.toLowerCase().includes(query) ||
        (gen.mappings && gen.mappings.some(mapping => 
          mapping.region.toLowerCase().includes(query) ||
          mapping.char.toLowerCase().includes(query)
        ))
      )
    })).filter(section => section.generations.length > 0)
  }

  return sections
})

// 生命周期
onMounted(() => {
  loadGenerationData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadGenerationData = async () => {
  try {
    // 加载字辈数据
    console.log('加载字辈数据')
  } catch (error) {
    console.error('加载字辈数据失败:', error)
    appStore.showToast('加载字辈数据失败', 'error')
  }
}

const setFilter = (filterValue: string) => {
  currentFilter.value = filterValue
}

const clearSearch = () => {
  searchQuery.value = ''
  currentFilter.value = 'all'
}

const showGenerationDetail = (generation: any) => {
  selectedGeneration.value = generation
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedGeneration.value = null
}

const viewMember = (member: any) => {
  router.push(`/genealogy/${genealogyId.value}/member/${member.id}`)
  closeDetailModal()
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
}
</script>

<style scoped>
.generation-table-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 搜索区域 */
.search-section {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 0 12px;
  margin-bottom: 12px;
}

.search-icon {
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  padding: 12px 0;
  font-size: 14px;
  outline: none;
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 16px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab.active {
  background: #07c160;
  color: white;
}

/* 表格内容 */
.table-content {
  padding: 16px;
}

.generation-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.generation-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.section-count {
  font-size: 12px;
  color: #666;
}

.generation-list {
  display: flex;
  flex-direction: column;
}

.generation-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.generation-item:last-child {
  border-bottom: none;
}

.generation-item:hover {
  background: #f5f5f5;
}

.generation-info {
  flex: 1;
}

.generation-number {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.generation-char {
  font-size: 18px;
  color: #333;
  font-weight: bold;
  margin-bottom: 4px;
}

.generation-meaning {
  font-size: 12px;
  color: #999;
}

.mappings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 12px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.mapping-region {
  color: #666;
}

.mapping-char {
  color: #07c160;
  font-weight: bold;
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

.reset-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
}

/* 详情弹窗 */
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

.detail-modal {
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
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-row label {
  width: 60px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.detail-char {
  font-size: 24px;
  color: #07c160;
  font-weight: bold;
}

.poem-text {
  font-style: italic;
  color: #666;
  line-height: 1.6;
}

.mappings-detail {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.mappings-detail h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.mapping-detail-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mapping-note {
  font-size: 12px;
  color: #666;
}

.members-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.members-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #e9ecef;
}

.member-item img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.member-item span {
  font-size: 12px;
  color: #333;
}
</style>

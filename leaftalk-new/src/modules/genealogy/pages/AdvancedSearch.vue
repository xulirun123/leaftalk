<template>
  <div class="advanced-search-page">
    <!-- 搜索表单 -->
    <div class="search-form">
      <!-- 基本搜索 -->
      <div class="search-section">
        <div class="section-title">基本搜索</div>
        
        <div class="search-input-group">
          <div class="input-label">姓名</div>
          <input 
            type="text" 
            v-model="searchParams.name" 
            placeholder="输入姓名关键词"
            class="search-input"
          />
        </div>
        
        <div class="search-input-group">
          <div class="input-label">性别</div>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="searchParams.gender" value="" />
              <span>全部</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="searchParams.gender" value="male" />
              <span>男</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="searchParams.gender" value="female" />
              <span>女</span>
            </label>
          </div>
        </div>
        
        <div class="search-input-group">
          <div class="input-label">年龄范围</div>
          <div class="range-inputs">
            <input 
              type="number" 
              v-model="searchParams.ageMin" 
              placeholder="最小"
              class="range-input"
            />
            <span class="range-separator">至</span>
            <input 
              type="number" 
              v-model="searchParams.ageMax" 
              placeholder="最大"
              class="range-input"
            />
          </div>
        </div>
      </div>
      
      <!-- 高级筛选 -->
      <div class="search-section">
        <div class="section-title">高级筛选</div>
        
        <div class="search-input-group">
          <div class="input-label">出生地</div>
          <input 
            type="text" 
            v-model="searchParams.birthplace" 
            placeholder="输入出生地"
            class="search-input"
          />
        </div>
        
        <div class="search-input-group">
          <div class="input-label">现居地</div>
          <input 
            type="text" 
            v-model="searchParams.currentLocation" 
            placeholder="输入现居地"
            class="search-input"
          />
        </div>
        
        <div class="search-input-group">
          <div class="input-label">职业</div>
          <input 
            type="text" 
            v-model="searchParams.occupation" 
            placeholder="输入职业关键词"
            class="search-input"
          />
        </div>
        
        <div class="search-input-group">
          <div class="input-label">世代</div>
          <div class="range-inputs">
            <input 
              type="number" 
              v-model="searchParams.generationMin" 
              placeholder="最小"
              class="range-input"
            />
            <span class="range-separator">至</span>
            <input 
              type="number" 
              v-model="searchParams.generationMax" 
              placeholder="最大"
              class="range-input"
            />
          </div>
        </div>
        
        <div class="search-input-group">
          <div class="input-label">状态</div>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="searchParams.isAlive" />
              <span>在世</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="searchParams.isVerified" />
              <span>已认证</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="searchParams.hasChildren" />
              <span>有子女</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 关系搜索 -->
      <div class="search-section">
        <div class="section-title">关系搜索</div>
        
        <div class="search-input-group">
          <div class="input-label">与特定成员的关系</div>
          <div class="relation-search">
            <input 
              type="text" 
              v-model="relationMemberName" 
              placeholder="输入成员姓名"
              class="search-input"
              @input="searchRelationMembers"
            />
            <div v-if="showMemberSuggestions" class="member-suggestions">
              <div 
                v-for="member in memberSuggestions" 
                :key="member.id"
                class="member-suggestion-item"
                @click="selectRelationMember(member)"
              >
                <img :src="member.avatar || '/default-avatar.png'" class="suggestion-avatar" />
                <div class="suggestion-info">
                  <div class="suggestion-name">{{ member.name }}</div>
                  <div class="suggestion-meta">{{ member.generation }}世 · {{ member.age }}岁</div>
                </div>
              </div>
              <div v-if="memberSuggestions.length === 0" class="no-suggestions">
                无匹配成员
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedRelationMember" class="selected-relation-member">
          <div class="selected-member-info">
            <img :src="selectedRelationMember.avatar || '/default-avatar.png'" class="selected-avatar" />
            <div class="selected-name">{{ selectedRelationMember.name }}</div>
          </div>
          <button @click="clearSelectedMember" class="clear-btn">
            <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
          </button>
        </div>
        
        <div v-if="selectedRelationMember" class="search-input-group">
          <div class="input-label">关系类型</div>
          <select v-model="searchParams.relationType" class="relation-select">
            <option value="">任意关系</option>
            <option value="ancestor">祖先</option>
            <option value="descendant">后代</option>
            <option value="sibling">兄弟姐妹</option>
            <option value="spouse">配偶</option>
            <option value="cousin">堂/表亲</option>
            <option value="uncle_aunt">叔伯/姑姨</option>
            <option value="nephew_niece">侄/甥</option>
          </select>
        </div>
        
        <div v-if="selectedRelationMember" class="search-input-group">
          <div class="input-label">关系距离</div>
          <div class="range-inputs">
            <input 
              type="number" 
              v-model="searchParams.relationDistanceMin" 
              placeholder="最小"
              class="range-input"
            />
            <span class="range-separator">至</span>
            <input 
              type="number" 
              v-model="searchParams.relationDistanceMax" 
              placeholder="最大"
              class="range-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索按钮 -->
    <div class="search-actions">
      <button @click="resetSearch" class="reset-btn">重置</button>
      <button @click="performSearch" class="search-btn">
        <iconify-icon icon="heroicons:magnifying-glass" width="16"></iconify-icon>
        <span>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasSearched" class="search-results">
      <div class="results-header">
        <div class="results-count">找到 {{ searchResults.length }} 位成员</div>
        <div class="results-actions">
          <button v-if="searchResults.length > 0" @click="exportResults" class="export-btn">
            <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            <span>导出</span>
          </button>
        </div>
      </div>
      
      <div class="results-list">
        <div 
          v-for="member in searchResults" 
          :key="member.id"
          class="result-item"
          @click="viewMemberDetail(member.id)"
        >
          <img :src="member.avatar || '/default-avatar.png'" class="result-avatar" />
          <div class="result-info">
            <div class="result-name">{{ member.name }}</div>
            <div class="result-meta">
              <span>{{ member.gender === 'male' ? '男' : '女' }}</span>
              <span>{{ member.age }}岁</span>
              <span>{{ member.generation }}世</span>
            </div>
            <div v-if="selectedRelationMember && member.relation" class="result-relation">
              与{{ selectedRelationMember.name }}的关系: {{ formatRelation(member.relation) }}
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="result-arrow"></iconify-icon>
        </div>
        
        <div v-if="searchResults.length === 0" class="no-results">
          <iconify-icon icon="heroicons:face-frown" width="48"></iconify-icon>
          <p>未找到匹配的成员</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.id as string)

// 搜索参数
const searchParams = reactive({
  name: '',
  gender: '',
  ageMin: null,
  ageMax: null,
  birthplace: '',
  currentLocation: '',
  occupation: '',
  generationMin: null,
  generationMax: null,
  isAlive: true,
  isVerified: false,
  hasChildren: false,
  relationMemberId: null,
  relationType: '',
  relationDistanceMin: null,
  relationDistanceMax: null
})

// 关系成员搜索
const relationMemberName = ref('')
const memberSuggestions = ref([])
const showMemberSuggestions = ref(false)
const selectedRelationMember = ref(null)

// 搜索结果
const searchResults = ref([])
const hasSearched = ref(false)

// 搜索关系成员
const searchRelationMembers = async () => {
  if (relationMemberName.value.length < 2) {
    memberSuggestions.value = []
    showMemberSuggestions.value = false
    return
  }
  
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/search?name=${relationMemberName.value}`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memberSuggestions.value = result.data
        showMemberSuggestions.value = true
      }
    }
  } catch (error) {
    console.error('搜索成员失败:', error)
  }
}

// 选择关系成员
const selectRelationMember = (member) => {
  selectedRelationMember.value = member
  relationMemberName.value = member.name
  searchParams.relationMemberId = member.id
  showMemberSuggestions.value = false
}

// 清除选择的成员
const clearSelectedMember = () => {
  selectedRelationMember.value = null
  relationMemberName.value = ''
  searchParams.relationMemberId = null
  searchParams.relationType = ''
  searchParams.relationDistanceMin = null
  searchParams.relationDistanceMax = null
}

// 执行搜索
const performSearch = async () => {
  try {
    appStore.showLoading('搜索中...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/advanced-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(searchParams)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        searchResults.value = result.data
        hasSearched.value = true
      } else {
        appStore.showToast(result.message || '搜索失败', 'error')
      }
    } else {
      appStore.showToast('搜索请求失败', 'error')
    }
  } catch (error) {
    console.error('高级搜索失败:', error)
    appStore.showToast('搜索失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchParams).forEach(key => {
    if (key === 'isAlive') {
      searchParams[key] = true
    } else if (typeof searchParams[key] === 'boolean') {
      searchParams[key] = false
    } else {
      searchParams[key] = null
    }
  })
  
  searchParams.name = ''
  searchParams.gender = ''
  searchParams.birthplace = ''
  searchParams.currentLocation = ''
  searchParams.occupation = ''
  
  relationMemberName.value = ''
  selectedRelationMember.value = null
  
  searchResults.value = []
  hasSearched.value = false
}

// 查看成员详情
const viewMemberDetail = (memberId) => {
  router.push(`/genealogy/${genealogyId.value}/member/${memberId}`)
}

// 导出结果
const exportResults = async () => {
  try {
    appStore.showLoading('导出中...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/export-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        searchParams,
        resultIds: searchResults.value.map(member => member.id)
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
        appStore.showToast('导出成功', 'success')
      } else {
        appStore.showToast(result.message || '导出失败', 'error')
      }
    } else {
      appStore.showToast('导出请求失败', 'error')
    }
  } catch (error) {
    console.error('导出搜索结果失败:', error)
    appStore.showToast('导出失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 格式化关系
const formatRelation = (relation) => {
  const relationTypes = {
    ancestor: '祖先',
    descendant: '后代',
    sibling: '兄弟姐妹',
    spouse: '配偶',
    cousin: '堂/表亲',
    uncle_aunt: '叔伯/姑姨',
    nephew_niece: '侄/甥'
  }

  return `${relationTypes[relation.type] || relation.type}${relation.distance ? ` (${relation.distance}代)` : ''}`
}
</script>

<style scoped>
.advanced-search-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
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

.nav-placeholder {
  width: 40px;
}

/* 搜索表单 */
.search-form {
  padding: 16px;
}

.search-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  border-left: 4px solid #07c160;
  padding-left: 8px;
}

.search-input-group {
  margin-bottom: 16px;
}

.search-input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}

.search-input:focus {
  border-color: #07c160;
  outline: none;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  accent-color: #07c160;
}

/* 范围输入 */
.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-input {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}

.range-separator {
  color: #666;
}

/* 复选框组 */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  accent-color: #07c160;
}

/* 关系搜索 */
.relation-search {
  position: relative;
}

.member-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.member-suggestion-item:last-child {
  border-bottom: none;
}

.member-suggestion-item:hover {
  background: #f9f9f9;
}

.suggestion-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.suggestion-info {
  flex: 1;
}

.suggestion-name {
  font-size: 14px;
  color: #333;
}

.suggestion-meta {
  font-size: 12px;
  color: #666;
}

.no-suggestions {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.selected-relation-member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f0f8ff;
  border: 1px solid #d0e6ff;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.selected-member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.clear-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-btn:hover {
  background: #e6e6e6;
}

.relation-select {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  background: white;
}

/* 搜索按钮 */
.search-actions {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 20px;
}

.reset-btn {
  flex: 1;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.search-btn {
  flex: 2;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 搜索结果 */
.search-results {
  padding: 0 16px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.results-count {
  font-size: 14px;
  color: #666;
}

.export-btn {
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f0f0f0;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
}

.results-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f9f9f9;
}

.result-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info {
  flex: 1;
}

.result-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.result-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.result-relation {
  font-size: 12px;
  color: #07c160;
}

.result-arrow {
  color: #ccc;
}

.no-results {
  padding: 40px 0;
  text-align: center;
  color: #666;
}

.no-results iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}
</style>

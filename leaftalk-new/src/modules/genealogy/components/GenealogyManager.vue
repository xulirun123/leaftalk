<template>
  <div class="genealogy-manager">
    <div class="header">
      <h3>族谱管理</h3>
      <div class="actions">
        <button @click="repairData" :disabled="isRepairing" class="repair-btn">
          {{ isRepairing ? '修复中...' : '修复数据' }}
        </button>
        <button @click="refreshData" :disabled="isLoading" class="refresh-btn">
          {{ isLoading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div class="genealogy-list" v-if="genealogies.length > 0">
      <div v-for="genealogy in genealogies" :key="genealogy.id" class="genealogy-card">
        <div class="card-header">
          <h4>{{ genealogy.name }}</h4>
          <span class="type-badge" :class="genealogy.type">
            {{ genealogy.typeLabel }}
          </span>
        </div>
        
        <div class="card-content">
          <div class="info-row">
            <span class="label">姓氏:</span>
            <span class="value">{{ genealogy.surname }}</span>
          </div>
          <div class="info-row">
            <span class="label">地区:</span>
            <span class="value">{{ genealogy.region || '全国' }}</span>
          </div>
          <div class="info-row">
            <span class="label">角色:</span>
            <span class="value role" :class="genealogy.role">{{ genealogy.role }}</span>
          </div>
          <div class="info-row">
            <span class="label">成员数:</span>
            <span class="value">{{ genealogy.memberCount || 0 }}人</span>
          </div>
          <div class="info-row">
            <span class="label">世代:</span>
            <span class="value">第{{ genealogy.generation }}世</span>
          </div>
          <div class="info-row" v-if="genealogy.description">
            <span class="label">始祖:</span>
            <span class="value">{{ genealogy.description }}</span>
          </div>
          <div class="info-row">
            <span class="label">说明:</span>
            <span class="value note">{{ genealogy.displayNote }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button @click="viewGenealogy(genealogy)" class="view-btn">
            查看族谱
          </button>
          <button v-if="genealogy.canEdit" @click="editGenealogy(genealogy)" class="edit-btn">
            编辑
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="empty-state">
      <p>暂无族谱数据</p>
      <button @click="createGenealogy" class="create-btn">创建族谱</button>
    </div>

    <div v-if="isLoading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 修复结果提示 -->
    <div v-if="repairResult" class="repair-result" :class="repairResult.success ? 'success' : 'error'">
      <h4>{{ repairResult.success ? '修复成功' : '修复失败' }}</h4>
      <p>{{ repairResult.message }}</p>
      <ul v-if="repairResult.operations">
        <li v-for="op in repairResult.operations" :key="op">{{ op }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const genealogies = ref<any[]>([])
const isLoading = ref(false)
const isRepairing = ref(false)
const repairResult = ref<any>(null)

// 加载族谱数据
const loadGenealogies = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/api/genealogy/my', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })
    
    const result = await response.json()
    if (result.success) {
      genealogies.value = result.data || []
      console.log('📊 族谱数据:', result)
    } else {
      appStore.showToast('加载族谱失败', 'error')
    }
  } catch (error) {
    console.error('❌ 加载族谱失败:', error)
    appStore.showToast('加载族谱失败', 'error')
  } finally {
    isLoading.value = false
  }
}

// 修复数据
const repairData = async () => {
  isRepairing.value = true
  repairResult.value = null
  
  try {
    const response = await fetch('/api/genealogy/repair-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    repairResult.value = result
    
    if (result.success) {
      appStore.showToast('数据修复成功', 'success')
      // 修复后重新加载数据
      setTimeout(() => {
        loadGenealogies()
      }, 1000)
    } else {
      appStore.showToast('数据修复失败', 'error')
    }
  } catch (error) {
    console.error('❌ 数据修复失败:', error)
    appStore.showToast('数据修复失败', 'error')
    repairResult.value = { success: false, message: '网络错误' }
  } finally {
    isRepairing.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadGenealogies()
}

// 查看族谱
const viewGenealogy = (genealogy: any) => {
  console.log('查看族谱:', genealogy)
  // 这里可以跳转到族谱详情页
  router.push(`/genealogy/${genealogy.id}`)
}

// 编辑族谱
const editGenealogy = (genealogy: any) => {
  console.log('编辑族谱:', genealogy)
  // 这里可以跳转到族谱编辑页
}

// 创建族谱
const createGenealogy = () => {
  console.log('创建族谱')
  // 这里可以跳转到族谱创建页
}

onMounted(() => {
  loadGenealogies()
})
</script>

<style scoped>
.genealogy-manager {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 8px;
}

.repair-btn, .refresh-btn, .create-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.repair-btn {
  background: #ff6b6b;
  color: white;
}

.refresh-btn {
  background: #4ecdc4;
  color: white;
}

.create-btn {
  background: #07C160;
  color: white;
}

.genealogy-list {
  display: grid;
  gap: 16px;
}

.genealogy-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h4 {
  margin: 0;
  color: #333;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.type-badge.main {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.branch {
  background: #f3e5f5;
  color: #7b1fa2;
}

.card-content {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 4px;
}

.label {
  width: 80px;
  color: #666;
  font-size: 14px;
}

.value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.value.role.族长 {
  color: #d32f2f;
  font-weight: bold;
}

.value.role.管理员 {
  color: #1976d2;
}

.value.note {
  color: #666;
  font-style: italic;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.view-btn, .edit-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.view-btn:hover, .edit-btn:hover {
  background: #f5f5f5;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.repair-result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
}

.repair-result.success {
  background: #e8f5e8;
  border: 1px solid #4caf50;
  color: #2e7d32;
}

.repair-result.error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.repair-result h4 {
  margin: 0 0 8px 0;
}

.repair-result ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}
</style>

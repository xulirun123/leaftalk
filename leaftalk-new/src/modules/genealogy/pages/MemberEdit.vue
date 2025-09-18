<template>
  <div class="member-edit-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="编辑成员" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button @click="saveMember" :disabled="saving" class="save-btn">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="edit-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载成员信息中...</p>
      </div>

      <!-- 编辑表单 -->
      <div v-else class="edit-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-group">
            <label>姓名 *</label>
            <input
              v-model="memberData.name"
              type="text"
              placeholder="请输入姓名"
              maxlength="20"
              required
              :readonly="!canEditBasicInfo"
              :class="{ readonly: !canEditBasicInfo }"
            />
            <p v-if="!canEditBasicInfo" class="readonly-tip">姓名只能由系统管理员、族长或管理员修改</p>
          </div>
          <div class="form-group">
            <label>性别 *</label>
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="memberData.gender" type="radio" value="male" :disabled="!canEditBasicInfo" />
                <span>男</span>
              </label>
              <label class="radio-item">
                <input v-model="memberData.gender" type="radio" value="female" :disabled="!canEditBasicInfo" />
                <span>女</span>
              </label>
            </div>
            <p v-if="!canEditBasicInfo" class="readonly-tip">性别只能由系统管理员、族长或管理员修改</p>
          </div>
          <div class="form-group">
            <label>出生日期</label>
            <input
              v-model="memberData.birthDate"
              type="date"
              max="2024-12-31"
              :readonly="!canEditBasicInfo"
              :class="{ readonly: !canEditBasicInfo }"
            />
            <p v-if="!canEditBasicInfo" class="readonly-tip">出生日期只能由系统管理员、族长或管理员修改</p>
          </div>
          <div class="form-group">
            <label>世代</label>
            <select v-model="memberData.generation" :disabled="!canEditBasicInfo">
              <option value="">请选择世代</option>
              <option v-for="gen in generations" :key="gen" :value="gen">
                第{{ getChineseNumber(gen) }}世
              </option>
            </select>
            <p v-if="!canEditBasicInfo" class="readonly-tip">世代只能由系统管理员、族长或管理员修改</p>
          </div>
          <div class="form-group">
            <label>简介</label>
            <textarea 
              v-model="memberData.description"
              placeholder="请输入成员简介"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="form-section">
          <h3>联系信息</h3>
          <div class="form-group">
            <label>手机号</label>
            <input 
              v-model="memberData.phone"
              type="tel"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input 
              v-model="memberData.email"
              type="email"
              placeholder="请输入邮箱地址"
            />
          </div>
          <div class="form-group">
            <label>地址</label>
            <input
              v-model="memberData.address"
              type="text"
              placeholder="请输入居住地址"
              :readonly="!canEditBasicInfo"
              :class="{ readonly: !canEditBasicInfo }"
            />
            <p v-if="!canEditBasicInfo" class="readonly-tip">地址只能由系统管理员、族长或管理员修改</p>
          </div>
        </div>

        <!-- 家庭关系 -->
        <div class="form-section">
          <h3>家庭关系</h3>
          <div class="approval-notice" v-if="!canEditBasicInfo">
            <iconify-icon icon="heroicons:information-circle" width="16" color="#ff9500"></iconify-icon>
            <span>家庭关系修改需要族长或管理员审批</span>
          </div>
          <div class="form-group">
            <label>父亲</label>
            <div class="relation-selector" @click="selectFather">
              <span v-if="memberData.father">{{ memberData.father.name }}</span>
              <span v-else class="placeholder">点击选择父亲</span>
              <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
            </div>
            <div v-if="memberData.fatherPending" class="pending-approval">
              <iconify-icon icon="heroicons:clock" width="12" color="#ff9500"></iconify-icon>
              <span>待审批：{{ memberData.fatherPending.name }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>母亲</label>
            <div class="relation-selector" @click="selectMother">
              <span v-if="memberData.mother">{{ memberData.mother.name }}</span>
              <span v-else class="placeholder">点击选择母亲</span>
              <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
            </div>
            <div v-if="memberData.motherPending" class="pending-approval">
              <iconify-icon icon="heroicons:clock" width="12" color="#ff9500"></iconify-icon>
              <span>待审批：{{ memberData.motherPending.name }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>配偶</label>
            <div class="relation-selector" @click="selectSpouse">
              <span v-if="memberData.spouse">{{ memberData.spouse.name }}</span>
              <span v-else class="placeholder">点击选择配偶</span>
              <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
            </div>
            <div v-if="memberData.spousePending" class="pending-approval">
              <iconify-icon icon="heroicons:clock" width="12" color="#ff9500"></iconify-icon>
              <span>待审批：{{ memberData.spousePending.name }}</span>
            </div>
          </div>
        </div>

        <!-- 权限设置 -->
        <div v-if="canEditPermissions" class="form-section">
          <h3>权限设置</h3>
          <div class="form-group">
            <label class="checkbox-item">
              <input v-model="memberData.canEdit" type="checkbox" />
              <span>管理员权限</span>
              <p class="help-text">可以编辑族谱信息和管理成员</p>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-item">
              <input v-model="memberData.isPatriarch" type="checkbox" />
              <span>族长权限</span>
              <p class="help-text">拥有最高权限，可以管理所有族谱事务</p>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-item">
              <input v-model="memberData.isActive" type="checkbox" />
              <span>激活状态</span>
              <p class="help-text">是否激活此成员账户</p>
            </label>
          </div>
        </div>

        <!-- 危险操作 -->
        <div v-if="canDeleteMember" class="form-section danger-section">
          <h3>危险操作</h3>
          <button @click="deleteMember" class="delete-btn">
            <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
            <span>删除成员</span>
          </button>
          <p class="danger-text">删除成员将移除其所有信息，此操作不可撤销</p>
          <p class="danger-text">只有族长和管理员才能删除成员</p>
        </div>
      </div>
    </div>

    <!-- 关系选择弹窗 -->
    <div v-if="showRelationModal" class="modal-overlay" @click="closeRelationModal">
      <div class="relation-modal" @click.stop>
        <div class="modal-header">
          <h3>选择{{ relationTitle }}</h3>
          <button @click="closeRelationModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="search-box">
            <input 
              v-model="relationSearchQuery"
              type="text"
              placeholder="搜索成员姓名"
              @input="searchRelations"
            />
          </div>
          <div class="relation-list">
            <div 
              v-for="member in filteredRelations" 
              :key="member.id"
              class="relation-item"
              @click="selectRelation(member)"
            >
              <img 
                :src="member.avatar || '/default-avatar.png'"
                :alt="member.name"
                class="relation-avatar"
              />
              <div class="relation-info">
                <h4>{{ member.name }}</h4>
                <p>第{{ getChineseNumber(member.generation) }}世</p>
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
const memberId = ref(route.params.memberId)
const loading = ref(false)
const saving = ref(false)
const showRelationModal = ref(false)
const relationSearchQuery = ref('')
const currentRelationType = ref('')
const allMembers = ref([])

// 成员数据
const memberData = ref({
  name: '',
  gender: '',
  birthDate: '',
  generation: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  father: null,
  mother: null,
  spouse: null,
  canEdit: false,
  isPatriarch: false,
  isActive: true
})

// 权限控制
const canEditPermissions = ref(false)
const canDeleteMember = ref(false)
const canEditBasicInfo = ref(false)
const userRole = ref('')

// 计算属性
const generations = computed(() => {
  return Array.from({ length: 10 }, (_, i) => i + 1)
})

const relationTitle = computed(() => {
  const titles = {
    'father': '父亲',
    'mother': '母亲',
    'spouse': '配偶'
  }
  return titles[currentRelationType.value] || ''
})

const filteredRelations = computed(() => {
  if (!relationSearchQuery.value) return allMembers.value
  
  return allMembers.value.filter(member => 
    member.name.toLowerCase().includes(relationSearchQuery.value.toLowerCase())
  )
})

// 生命周期
onMounted(() => {
  loadMemberData()
  loadAllMembers()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMemberData = async () => {
  if (!genealogyId.value || !memberId.value) return

  loading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${memberId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memberData.value = { ...memberData.value, ...result.data }
        canEditPermissions.value = result.data.canEditPermissions || false
        canDeleteMember.value = result.data.canDelete || false
        canEditBasicInfo.value = result.data.canEditBasicInfo || false
        userRole.value = result.data.userRole || ''
      }
    }
  } catch (error) {
    console.error('加载成员数据失败:', error)
    appStore.showToast('加载成员数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const loadAllMembers = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        allMembers.value = result.data.filter(m => m.id !== parseInt(memberId.value))
      }
    }
  } catch (error) {
    console.error('加载成员列表失败:', error)
  }
}

const saveMember = async () => {
  if (!memberData.value.name.trim()) {
    appStore.showToast('请输入成员姓名', 'error')
    return
  }

  if (!memberData.value.gender) {
    appStore.showToast('请选择性别', 'error')
    return
  }

  saving.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${memberId.value}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: memberData.value.name.trim(),
        gender: memberData.value.gender,
        birthDate: memberData.value.birthDate,
        generation: memberData.value.generation,
        description: memberData.value.description,
        phone: memberData.value.phone,
        email: memberData.value.email,
        address: memberData.value.address,
        fatherId: memberData.value.father?.id,
        motherId: memberData.value.mother?.id,
        spouseId: memberData.value.spouse?.id,
        canEdit: memberData.value.canEdit,
        isPatriarch: memberData.value.isPatriarch,
        isActive: memberData.value.isActive
      })
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('保存成功', 'success')
      router.back()
    } else {
      appStore.showToast(result.message || '保存失败', 'error')
    }
  } catch (error) {
    console.error('保存成员失败:', error)
    appStore.showToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

const selectFather = () => {
  currentRelationType.value = 'father'
  showRelationModal.value = true
}

const selectMother = () => {
  currentRelationType.value = 'mother'
  showRelationModal.value = true
}

const selectSpouse = () => {
  currentRelationType.value = 'spouse'
  showRelationModal.value = true
}

const closeRelationModal = () => {
  showRelationModal.value = false
  relationSearchQuery.value = ''
  currentRelationType.value = ''
}

const selectRelation = (member: any) => {
  if (canEditBasicInfo.value) {
    // 系统管理员、族长或管理员可以直接修改
    switch (currentRelationType.value) {
      case 'father':
        memberData.value.father = member
        break
      case 'mother':
        memberData.value.mother = member
        break
      case 'spouse':
        memberData.value.spouse = member
        break
    }
  } else {
    // 普通用户需要提交审批
    switch (currentRelationType.value) {
      case 'father':
        memberData.value.fatherPending = member
        appStore.showToast('父亲关系修改已提交审批', 'info')
        break
      case 'mother':
        memberData.value.motherPending = member
        appStore.showToast('母亲关系修改已提交审批', 'info')
        break
      case 'spouse':
        memberData.value.spousePending = member
        appStore.showToast('配偶关系修改已提交审批', 'info')
        break
    }
  }
  closeRelationModal()
}

const searchRelations = () => {
  // 搜索逻辑已在计算属性中实现
}

const deleteMember = async () => {
  if (!confirm('确定要删除此成员吗？此操作不可撤销。')) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${memberId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('删除成功', 'success')
      router.push(`/genealogy/${genealogyId.value}/management/members`)
    } else {
      appStore.showToast(result.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除成员失败:', error)
    appStore.showToast('删除失败', 'error')
  }
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
}
</script>

<style scoped>
.member-edit-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.save-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.edit-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 75px);
  color: #666;
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 表单样式 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.form-group input.readonly,
.form-group select:disabled {
  background: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.readonly-tip {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #ff9500;
}

.approval-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #f57c00;
}

.pending-approval {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background: #fff3e0;
  border-radius: 6px;
  font-size: 12px;
  color: #f57c00;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-item input {
  width: auto;
  margin: 0;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}

.checkbox-item input {
  width: auto;
  margin: 0;
  margin-top: 2px;
}

.checkbox-item span {
  font-weight: 500;
}

.help-text {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #666;
}

.relation-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.relation-selector:hover {
  border-color: #07c160;
}

.relation-selector .placeholder {
  color: #999;
}

/* 危险操作样式 */
.danger-section {
  border: 1px solid #ffebee;
  background: #fafafa;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #ff3742;
}

.danger-text {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #666;
}

/* 弹窗样式 */
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

.relation-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
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
}

.search-box input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.relation-list {
  max-height: 300px;
  overflow-y: auto;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.relation-item:hover {
  background: #f8f9fa;
}

.relation-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.relation-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.relation-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}
</style>

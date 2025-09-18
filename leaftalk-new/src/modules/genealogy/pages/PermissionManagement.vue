<template>
  <div class="permission-management-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">权限管理</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 权限概览 -->
    <div class="permission-overview">
      <div class="overview-title">权限概览</div>
      <div class="overview-stats">
        <div class="stat-item">
          <div class="stat-number">{{ statistics.totalMembers }}</div>
          <div class="stat-label">总成员</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.adminCount }}</div>
          <div class="stat-label">管理员</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.editorCount }}</div>
          <div class="stat-label">编辑者</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.viewerCount }}</div>
          <div class="stat-label">查看者</div>
        </div>
      </div>
    </div>

    <!-- 角色管理 -->
    <div class="role-management">
      <div class="section-title">
        <iconify-icon icon="heroicons:shield-check" width="20"></iconify-icon>
        <span>角色管理</span>
        <button @click="showCreateRoleModal = true" class="add-role-btn">
          <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          <span>新建角色</span>
        </button>
      </div>

      <div class="role-list">
        <div 
          v-for="role in roles" 
          :key="role.id"
          class="role-item"
          @click="editRole(role)"
        >
          <div class="role-icon" :class="role.type">
            <iconify-icon :icon="getRoleIcon(role.type)" width="20"></iconify-icon>
          </div>
          <div class="role-info">
            <div class="role-name">{{ role.name }}</div>
            <div class="role-desc">{{ role.description }}</div>
            <div class="role-permissions">
              <span 
                v-for="permission in role.permissions.slice(0, 3)" 
                :key="permission"
                class="permission-tag"
              >
                {{ getPermissionName(permission) }}
              </span>
              <span v-if="role.permissions.length > 3" class="more-permissions">
                +{{ role.permissions.length - 3 }}
              </span>
            </div>
          </div>
          <div class="role-members">
            <div class="member-count">{{ role.memberCount }}人</div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 成员权限 -->
    <div class="member-permissions">
      <div class="section-title">
        <iconify-icon icon="heroicons:users" width="20"></iconify-icon>
        <span>成员权限</span>
        <div class="search-box">
          <input 
            type="text" 
            v-model="memberSearchQuery" 
            placeholder="搜索成员"
            class="search-input"
            @input="searchMembers"
          />
          <iconify-icon icon="heroicons:magnifying-glass" width="16" class="search-icon"></iconify-icon>
        </div>
      </div>

      <div class="member-list">
        <div 
          v-for="member in filteredMembers" 
          :key="member.id"
          class="member-item"
          @click="editMemberPermissions(member)"
        >
          <img :src="member.avatar || '/default-avatar.png'" class="member-avatar" />
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-meta">
              <span>{{ member.generation }}世</span>
              <span>{{ member.age }}岁</span>
              <span v-if="member.isPatriarch" class="patriarch-badge">族长</span>
            </div>
            <div class="member-role">{{ member.roleName || '普通成员' }}</div>
          </div>
          <div class="permission-status">
            <div class="permission-level" :class="member.permissionLevel">
              {{ getPermissionLevelName(member.permissionLevel) }}
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限日志 -->
    <div class="permission-logs">
      <div class="section-title">
        <iconify-icon icon="heroicons:document-text" width="20"></iconify-icon>
        <span>权限日志</span>
        <button @click="exportLogs" class="export-logs-btn">
          <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
          <span>导出</span>
        </button>
      </div>

      <div class="log-list">
        <div 
          v-for="log in permissionLogs" 
          :key="log.id"
          class="log-item"
        >
          <div class="log-icon" :class="log.action">
            <iconify-icon :icon="getLogIcon(log.action)" width="16"></iconify-icon>
          </div>
          <div class="log-info">
            <div class="log-title">{{ log.title }}</div>
            <div class="log-desc">{{ log.description }}</div>
            <div class="log-meta">
              <span>{{ log.operatorName }}</span>
              <span>{{ formatTime(log.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="permissionLogs.length === 0" class="no-logs">
          <iconify-icon icon="heroicons:document-text" width="48"></iconify-icon>
          <p>暂无权限日志</p>
        </div>
      </div>
    </div>

    <!-- 创建角色弹窗 -->
    <div v-if="showCreateRoleModal" class="modal-overlay" @click="closeCreateRoleModal">
      <div class="role-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingRole ? '编辑角色' : '创建角色' }}</h3>
          <button @click="closeCreateRoleModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label>角色名称</label>
            <input 
              type="text" 
              v-model="roleForm.name" 
              placeholder="输入角色名称"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>角色描述</label>
            <textarea 
              v-model="roleForm.description" 
              placeholder="输入角色描述"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>权限设置</label>
            <div class="permission-checkboxes">
              <label 
                v-for="permission in availablePermissions" 
                :key="permission.key"
                class="permission-checkbox"
              >
                <input 
                  type="checkbox" 
                  v-model="roleForm.permissions" 
                  :value="permission.key"
                />
                <div class="checkbox-content">
                  <div class="permission-name">{{ permission.name }}</div>
                  <div class="permission-desc">{{ permission.description }}</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeCreateRoleModal" class="cancel-btn">取消</button>
          <button @click="saveRole" class="save-btn">
            {{ editingRole ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成员权限编辑弹窗 -->
    <div v-if="showMemberPermissionModal" class="modal-overlay" @click="closeMemberPermissionModal">
      <div class="member-permission-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑成员权限</h3>
          <button @click="closeMemberPermissionModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="member-info-card">
            <img :src="editingMember?.avatar || '/default-avatar.png'" class="member-avatar" />
            <div class="member-details">
              <div class="member-name">{{ editingMember?.name }}</div>
              <div class="member-meta">{{ editingMember?.generation }}世 · {{ editingMember?.age }}岁</div>
            </div>
          </div>
          
          <div class="form-group">
            <label>角色分配</label>
            <select v-model="memberPermissionForm.roleId" class="form-select">
              <option value="">选择角色</option>
              <option 
                v-for="role in roles" 
                :key="role.id" 
                :value="role.id"
              >
                {{ role.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>权限级别</label>
            <div class="permission-levels">
              <label 
                v-for="level in permissionLevels" 
                :key="level.key"
                class="level-option"
                :class="{ active: memberPermissionForm.permissionLevel === level.key }"
              >
                <input 
                  type="radio" 
                  v-model="memberPermissionForm.permissionLevel" 
                  :value="level.key"
                />
                <div class="level-content">
                  <div class="level-name">{{ level.name }}</div>
                  <div class="level-desc">{{ level.description }}</div>
                </div>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>特殊权限</label>
            <div class="special-permissions">
              <label class="special-permission">
                <input 
                  type="checkbox" 
                  v-model="memberPermissionForm.canManageMembers"
                />
                <span>管理成员</span>
              </label>
              <label class="special-permission">
                <input 
                  type="checkbox" 
                  v-model="memberPermissionForm.canManageActivities"
                />
                <span>管理活动</span>
              </label>
              <label class="special-permission">
                <input 
                  type="checkbox" 
                  v-model="memberPermissionForm.canManageStories"
                />
                <span>管理故事</span>
              </label>
              <label class="special-permission">
                <input 
                  type="checkbox" 
                  v-model="memberPermissionForm.canViewPrivateInfo"
                />
                <span>查看私密信息</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeMemberPermissionModal" class="cancel-btn">取消</button>
          <button @click="saveMemberPermissions" class="save-btn">保存</button>
        </div>
      </div>
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
const genealogyId = ref(route.params.id as string)

// 统计数据
const statistics = ref({
  totalMembers: 0,
  adminCount: 0,
  editorCount: 0,
  viewerCount: 0
})

// 角色数据
const roles = ref([])
const members = ref([])
const permissionLogs = ref([])

// 搜索
const memberSearchQuery = ref('')

// 弹窗状态
const showCreateRoleModal = ref(false)
const showMemberPermissionModal = ref(false)
const editingRole = ref(null)
const editingMember = ref(null)

// 表单数据
const roleForm = reactive({
  name: '',
  description: '',
  permissions: []
})

const memberPermissionForm = reactive({
  roleId: '',
  permissionLevel: 'viewer',
  canManageMembers: false,
  canManageActivities: false,
  canManageStories: false,
  canViewPrivateInfo: false
})

// 可用权限列表
const availablePermissions = [
  { key: 'view_members', name: '查看成员', description: '可以查看族谱成员信息' },
  { key: 'edit_members', name: '编辑成员', description: '可以编辑成员基本信息' },
  { key: 'manage_members', name: '管理成员', description: '可以添加、删除成员' },
  { key: 'view_activities', name: '查看活动', description: '可以查看家族活动' },
  { key: 'create_activities', name: '创建活动', description: '可以创建家族活动' },
  { key: 'manage_activities', name: '管理活动', description: '可以管理所有活动' },
  { key: 'view_stories', name: '查看故事', description: '可以查看家族故事' },
  { key: 'create_stories', name: '创建故事', description: '可以创建家族故事' },
  { key: 'manage_stories', name: '管理故事', description: '可以管理所有故事' },
  { key: 'view_private', name: '查看私密信息', description: '可以查看成员私密信息' },
  { key: 'export_data', name: '导出数据', description: '可以导出族谱数据' },
  { key: 'manage_permissions', name: '管理权限', description: '可以管理成员权限' }
]

// 权限级别
const permissionLevels = [
  { key: 'viewer', name: '查看者', description: '只能查看基本信息' },
  { key: 'editor', name: '编辑者', description: '可以编辑部分内容' },
  { key: 'admin', name: '管理员', description: '可以管理大部分功能' },
  { key: 'super_admin', name: '超级管理员', description: '拥有所有权限' }
]

// 计算属性
const filteredMembers = computed(() => {
  if (!memberSearchQuery.value) return members.value
  
  return members.value.filter(member => 
    member.name.toLowerCase().includes(memberSearchQuery.value.toLowerCase())
  )
})

// 生命周期
onMounted(() => {
  loadPermissionData()
})

// 方法
const loadPermissionData = async () => {
  try {
    appStore.showLoading('加载权限数据...')
    
    // 加载统计数据
    const statsResponse = await fetch(`/api/genealogy/${genealogyId.value}/permissions/statistics`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json()
      if (statsResult.success) {
        statistics.value = statsResult.data
      }
    }
    
    // 加载角色数据
    const rolesResponse = await fetch(`/api/genealogy/${genealogyId.value}/roles`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (rolesResponse.ok) {
      const rolesResult = await rolesResponse.json()
      if (rolesResult.success) {
        roles.value = rolesResult.data
      }
    }
    
    // 加载成员数据
    const membersResponse = await fetch(`/api/genealogy/${genealogyId.value}/members/permissions`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (membersResponse.ok) {
      const membersResult = await membersResponse.json()
      if (membersResult.success) {
        members.value = membersResult.data
      }
    }
    
    // 加载权限日志
    const logsResponse = await fetch(`/api/genealogy/${genealogyId.value}/permissions/logs`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (logsResponse.ok) {
      const logsResult = await logsResponse.json()
      if (logsResult.success) {
        permissionLogs.value = logsResult.data
      }
    }
    
  } catch (error) {
    console.error('加载权限数据失败:', error)
    appStore.showToast('加载权限数据失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const searchMembers = () => {
  // 搜索逻辑已在计算属性中实现
}

const editRole = (role) => {
  editingRole.value = role
  roleForm.name = role.name
  roleForm.description = role.description
  roleForm.permissions = [...role.permissions]
  showCreateRoleModal.value = true
}

const editMemberPermissions = (member) => {
  editingMember.value = member
  memberPermissionForm.roleId = member.roleId || ''
  memberPermissionForm.permissionLevel = member.permissionLevel || 'viewer'
  memberPermissionForm.canManageMembers = member.canManageMembers || false
  memberPermissionForm.canManageActivities = member.canManageActivities || false
  memberPermissionForm.canManageStories = member.canManageStories || false
  memberPermissionForm.canViewPrivateInfo = member.canViewPrivateInfo || false
  showMemberPermissionModal.value = true
}

const closeCreateRoleModal = () => {
  showCreateRoleModal.value = false
  editingRole.value = null
  roleForm.name = ''
  roleForm.description = ''
  roleForm.permissions = []
}

const closeMemberPermissionModal = () => {
  showMemberPermissionModal.value = false
  editingMember.value = null
}

const saveRole = async () => {
  try {
    const url = editingRole.value 
      ? `/api/genealogy/${genealogyId.value}/roles/${editingRole.value.id}`
      : `/api/genealogy/${genealogyId.value}/roles`
    
    const method = editingRole.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(roleForm)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast(editingRole.value ? '角色更新成功' : '角色创建成功', 'success')
        closeCreateRoleModal()
        loadPermissionData()
      } else {
        appStore.showToast(result.message || '操作失败', 'error')
      }
    } else {
      appStore.showToast('请求失败', 'error')
    }
  } catch (error) {
    console.error('保存角色失败:', error)
    appStore.showToast('保存角色失败', 'error')
  }
}

const saveMemberPermissions = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${editingMember.value.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(memberPermissionForm)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('权限更新成功', 'success')
        closeMemberPermissionModal()
        loadPermissionData()
      } else {
        appStore.showToast(result.message || '更新失败', 'error')
      }
    } else {
      appStore.showToast('请求失败', 'error')
    }
  } catch (error) {
    console.error('保存成员权限失败:', error)
    appStore.showToast('保存权限失败', 'error')
  }
}

const exportLogs = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/permissions/logs/export`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
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
    console.error('导出权限日志失败:', error)
    appStore.showToast('导出失败', 'error')
  }
}

// 辅助方法
const getRoleIcon = (type) => {
  const icons = {
    admin: 'heroicons:shield-check',
    editor: 'heroicons:pencil-square',
    viewer: 'heroicons:eye',
    custom: 'heroicons:cog-6-tooth'
  }
  return icons[type] || icons.custom
}

const getPermissionName = (permission) => {
  const permissionMap = availablePermissions.reduce((map, p) => {
    map[p.key] = p.name
    return map
  }, {})
  return permissionMap[permission] || permission
}

const getPermissionLevelName = (level) => {
  const levelMap = permissionLevels.reduce((map, l) => {
    map[l.key] = l.name
    return map
  }, {})
  return levelMap[level] || level
}

const getLogIcon = (action) => {
  const icons = {
    grant: 'heroicons:plus-circle',
    revoke: 'heroicons:minus-circle',
    modify: 'heroicons:pencil-square',
    create: 'heroicons:plus',
    delete: 'heroicons:trash'
  }
  return icons[action] || 'heroicons:document-text'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.permission-management-page {
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

/* 权限概览 */
.permission-overview {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

.overview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 通用区块样式 */
.role-management,
.member-permissions,
.permission-logs {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.add-role-btn,
.export-logs-btn {
  margin-left: auto;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #07c160;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
}

.search-box {
  position: relative;
  margin-left: auto;
}

.search-input {
  width: 200px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 0 32px 0 12px;
  font-size: 12px;
}

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

/* 角色列表 */
.role-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-item:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.role-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.role-icon.admin {
  background: #e74c3c;
}

.role-icon.editor {
  background: #3498db;
}

.role-icon.viewer {
  background: #95a5a6;
}

.role-icon.custom {
  background: #9b59b6;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.role-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.role-permissions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.permission-tag {
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.more-permissions {
  background: #07c160;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.role-members {
  text-align: right;
}

.member-count {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.arrow {
  color: #ccc;
}

/* 成员列表 */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.member-item:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.member-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.patriarch-badge {
  background: #ff6b6b;
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 10px;
}

.member-role {
  font-size: 12px;
  color: #07c160;
}

.permission-status {
  text-align: right;
}

.permission-level {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.permission-level.viewer {
  background: #f0f0f0;
  color: #666;
}

.permission-level.editor {
  background: #e3f2fd;
  color: #1976d2;
}

.permission-level.admin {
  background: #fff3e0;
  color: #f57c00;
}

.permission-level.super_admin {
  background: #ffebee;
  color: #d32f2f;
}

/* 权限日志 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.log-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.log-icon.grant {
  background: #07c160;
}

.log-icon.revoke {
  background: #ff4757;
}

.log-icon.modify {
  background: #3742fa;
}

.log-icon.create {
  background: #2ecc71;
}

.log-icon.delete {
  background: #e74c3c;
}

.log-info {
  flex: 1;
}

.log-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.log-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.log-meta {
  font-size: 10px;
  color: #999;
  display: flex;
  gap: 8px;
}

.no-logs {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-logs iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
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

.role-modal,
.member-permission-modal {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
}

.form-textarea {
  height: 80px;
  resize: vertical;
}

.permission-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}

.permission-checkbox input[type="checkbox"] {
  margin-top: 2px;
  accent-color: #07c160;
}

.checkbox-content {
  flex: 1;
}

.permission-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.permission-desc {
  font-size: 12px;
  color: #666;
}

.member-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.member-details {
  flex: 1;
}

.permission-levels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.level-option.active {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.level-option input[type="radio"] {
  margin-top: 2px;
  accent-color: #07c160;
}

.level-content {
  flex: 1;
}

.level-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.level-desc {
  font-size: 12px;
  color: #666;
}

.special-permissions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.special-permission {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.special-permission input[type="checkbox"] {
  accent-color: #07c160;
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

.save-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>

<template>
  <div class="page">
    <!-- 说明文字区域 -->
    <div class="description-section">
      <ul class="description-list">
        <li>管理员可协助群主管理群聊，拥有发布群公告、移除群成员等能力。</li>
        <li>只有群主具备设置管理员、解散群聊的能力。</li>
        <li>最多可设置3个管理员。</li>
      </ul>
    </div>

    <!-- 管理员列表 -->
    <div class="admins-list">
      <div class="admin-item" v-for="admin in admins" :key="admin.id">
        <img :src="admin.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.id}`" :alt="admin.nickname" class="admin-avatar" />
        <div class="admin-info">
          <div class="admin-name">{{ admin.nickname || `用户${admin.id}` }}</div>
        </div>
        <button v-if="isGroupOwner" class="remove-btn" @click="removeAdmin(admin)">
          移除
        </button>
      </div>
    </div>

    <!-- 添加成员按钮 -->
    <div class="add-admin-section">
      <button class="add-admin-btn" @click="addAdmin">
        <div class="add-icon-wrapper">
          <iconify-icon icon="heroicons:plus-circle" width="24" style="color: #07c160;"></iconify-icon>
        </div>
        <span class="add-text">添加成员</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import { showConfirm } from '@/shared/utils/dialog'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const groupId = ref(route.params.groupId as string)
const admins = ref<any[]>([])
const isGroupOwner = ref(false)

// 加载管理员列表
const loadAdmins = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/admins`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        admins.value = result.data
        console.log('✅ 管理员列表加载成功:', admins.value)
      }
    }
  } catch (error) {
    console.error('❌ 加载管理员列表失败:', error)
  }
}

// 检查当前用户是否是群主
const checkGroupOwner = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const currentUser = result.data.find((m: any) => m.id === authStore.user?.id)
        isGroupOwner.value = currentUser?.role === 'creator' || currentUser?.role === 'owner'
        console.log('📢 是否群主:', isGroupOwner.value)
      }
    }
  } catch (error) {
    console.error('❌ 检查群主权限失败:', error)
  }
}

// 添加管理员
const addAdmin = () => {
  console.log('添加管理员')
  router.push(`/add-group-admin/${groupId.value}`)
}

// 移除管理员
const removeAdmin = async (admin: any) => {
  const confirmed = await showConfirm({
    title: '移除管理员',
    content: `确定要移除 ${admin.nickname || `用户${admin.id}`} 的管理员权限吗？`,
    confirmText: '移除',
    cancelText: '取消'
  })

  if (!confirmed) {
    return
  }

  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/admins/${admin.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('移除成功', 'success')
        await loadAdmins()
      } else {
        appStore.showToast(result.error || '移除失败', 'error')
      }
    }
  } catch (error) {
    console.error('❌ 移除管理员失败:', error)
    appStore.showToast('移除失败', 'error')
  }
}

onMounted(async () => {
  await Promise.all([loadAdmins(), checkGroupOwner()])
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  padding-bottom: 100px;
}

/* 说明文字区域 */
.description-section {
  background: #fff;
  padding: 16px;
  margin-bottom: 8px;
}

.description-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.description-list li {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
  margin-bottom: 8px;
}

.description-list li:last-child {
  margin-bottom: 0;
}

/* 添加成员按钮区域 */
.add-admin-section {
  background: #fff;
  padding: 0;
  margin-top: 8px;
}

.add-admin-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.add-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.add-text {
  font-size: 16px;
  color: #333;
}

/* 管理员列表 */
.admins-list {
  background: #fff;
  margin-bottom: 0;
}

.admin-item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.admin-item:last-child {
  border-bottom: 1px solid #f0f0f0;
}

.admin-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  margin-right: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.admin-info {
  flex: 1;
  min-width: 0;
}

.admin-name {
  font-size: 16px;
  color: #333;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  padding: 0;
  background: transparent;
  border: none;
  color: #ff3b30;
  font-size: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-btn:hover {
  opacity: 0.8;
}
</style>


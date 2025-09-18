<template>
  <div class="friend-permissions">
    <!-- 使用全局导航栏（标题由路由 meta.title 驱动：朋友权限） -->
    <div class="content">
      <!-- 设置朋友权限（25px 文本容器） -->
      <div class="text-header">设置朋友权限</div>
      <div class="card">
        <div class="item" @click="selectScope('all')">
          <span class="label">聊天和朋友圈</span>
          <span class="check" v-if="chatScope === 'all'">✓</span>
        </div>
        <div class="item" @click="selectScope('chat')">
          <span class="label">仅聊天</span>
          <span class="check" v-if="chatScope === 'chat'">✓</span>
        </div>
      </div>

      <!-- 朋友圈和状态（仅在“聊天和朋友圈”模式下可见） -->
      <template v-if="chatScope === 'all'">
        <div class="text-header">朋友圈和状态</div>
        <div class="card">
          <div class="item">
            <span class="label">不让他看我</span>
            <div class="toggle-switch" :class="{ active: blockHimSeeMe }" @click="toggleBlockHimSeeMe">
              <div class="toggle-handle"></div>
            </div>
          </div>
          <div class="item">
            <span class="label">我不看他</span>
            <div class="toggle-switch" :class="{ active: dontSeeHim }" @click="toggleDontSeeHim">
              <div class="toggle-handle"></div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { FriendsService } from '../services/friendsService'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
import { contactsApi } from '../services/contactsApi'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 好友信息
const friendInfo = ref({
  id: null,
  name: '加载中...',
  avatar: '',
  yeyuId: ''
})

// 已移除旧的本地 permissions 结构，改为直接对接后端 API 持久化

// 顶层权限控制状态（供模板直接使用）
const chatScope = ref<'all' | 'chat'>('all')
const blockHimSeeMe = ref(false)
const dontSeeHim = ref(false)

const persistPermissions = async () => {
  if (!friendInfo.value.id) return
  try {
    const res = await contactsApi.updateFriendPermissions(String(friendInfo.value.id), {
      chatScope: chatScope.value,
      blockHimSeeMe: blockHimSeeMe.value,
      dontSeeHim: dontSeeHim.value
    })
    if ((res as any)?.success !== false) {
      appStore.showToast('已保存朋友权限', 'success')
    } else {
      appStore.showToast('保存失败', 'error')
    }
  } catch (err) {
    console.error('保存朋友权限失败:', err)
    appStore.showToast('保存失败', 'error')
  }
}

const prevBlock = ref<boolean | null>(null)
const prevDontSee = ref<boolean | null>(null)
const selectScope = async (v: 'all' | 'chat') => {
  if (v === 'chat') {
    // 仅聊天：双方互不可见朋友圈
    prevBlock.value = blockHimSeeMe.value
    prevDontSee.value = dontSeeHim.value
    blockHimSeeMe.value = true
    dontSeeHim.value = true
  } else if (v === 'all') {
    // 聊天和朋友圈：恢复之前的显隐偏好（若存在）
    if (prevBlock.value !== null) blockHimSeeMe.value = prevBlock.value
    if (prevDontSee.value !== null) dontSeeHim.value = prevDontSee.value
  }
  chatScope.value = v
  await persistPermissions()
}
const toggleBlockHimSeeMe = async () => { blockHimSeeMe.value = !blockHimSeeMe.value; await persistPermissions() }
const toggleDontSeeHim = async () => { dontSeeHim.value = !dontSeeHim.value; await persistPermissions() }


// 加载好友信息和权限
const loadFriendData = async () => {
  const friendId = route.params.id
  console.log('👤 加载朋友权限设置:', friendId)

  try {
    // 使用FriendsService获取真实数据
    const friendsService = FriendsService.getInstance()
    const friend = await friendsService.getFriendById(friendId as string)

    if (friend) {
      const normalizedAvatar = (() => {
        const raw = friend.avatar
        const idStr = String(friend.id)
        if (!raw) return getRealAvatarUrl(idStr)
        const u = String(raw)
        if (u.includes('/uploads/avatars/')) return getRealAvatarUrl(idStr)
        if (u.startsWith('http://localhost:8893/api/users/')) return u
        return getRealAvatarUrl(idStr)
      })()
      friendInfo.value = {
        id: friend.id,
        name: friend.name,
        avatar: normalizedAvatar,
        yeyuId: friend.yeyuId || friend.id
      }
    } else {
      // 如果找不到好友，使用模拟数据
      friendInfo.value = {
        id: friendId,
        name: `好友${friendId}`,
        avatar: getRealAvatarUrl(String(friendId)),
        yeyuId: `FRIEND${friendId}`
      }
    }
  } catch (error) {
    console.error('❌ 加载好友信息失败:', error)
    // 出错时使用模拟数据
    friendInfo.value = {
      id: friendId,
      name: `好友${friendId}`,
      avatar: getRealAvatarUrl(String(friendId)),
      yeyuId: `FRIEND${friendId}`
    }

  }

}






// 组件挂载时加载数据
onMounted(async () => {
  await loadFriendData()
  try {
    const fid = String(friendInfo.value.id || route.params.id || '')
    if (fid) {
      const resp = await contactsApi.getFriendPermissions(fid)
      const p = (resp as any)?.data || (resp as any)?.payload || null
      if (p) {
        chatScope.value = (p.chatScope === 'chat') ? 'chat' : 'all'
        blockHimSeeMe.value = !!(p.blockHimSeeMe || p.chatScope === 'chat')
        dontSeeHim.value = !!(p.dontSeeHim || p.chatScope === 'chat')
      }
    }
  } catch (e) {
    console.warn('加载朋友权限失败:', e)
  }
})
</script>

<style scoped>
.friend-permissions {
  height: 100vh;
  background: #e5e5e5;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 好友信息 */
.friend-info {
  background: white;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  border-bottom: 8px solid #f5f5f5;
}

.avatar-section {
  margin-right: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.info-section .name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.yeyu-id {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 权限设置区域 */
.permissions-sections {
  padding: 0;
}

.section {
  background: white;
  margin-bottom: 8px;
}

.section-title {
  padding: 16px 16px 8px 16px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.permission-item {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s ease;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item:hover {
  background: #f8f8f8;
}

/* 权限项状态指示 */
.permission-item.disabled {
  opacity: 0.6;
}

.permission-item.disabled .permission-label {
  color: #999;
}

.permission-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.permission-label span {
  font-size: 16px;
  color: #333;
}

.permission-value {
  display: flex;
  align-items: center;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #07C160;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 说明文字样式已移除 */

/* 新结构样式 */
.text-header { height: 25px; line-height: 25px; padding: 0 16px; color: #666; font-size: 13px; }
.card { background: #fff; margin-bottom: 8px; }
.item { display:flex; align-items:center; justify-content:space-between; height:48px; padding:0 16px; border-bottom:1px solid #eee; }
.item:last-child { border-bottom:none; }
.label { font-size: 14px; color: #111; font-weight: 400; }
.check { width: 20px; text-align: center; color: #07C160; font-size: 16px; }
.toggle-switch { width:44px; height:24px; background:#ccc; border-radius:24px; position:relative; transition:.2s; }
.toggle-switch .toggle-handle { position:absolute; top:3px; left:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:.2s; }
.toggle-switch.active { background:#07C160; }
.toggle-switch.active .toggle-handle { left:23px; }



</style>

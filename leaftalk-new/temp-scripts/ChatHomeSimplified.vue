<template>
  <div class="mobile-home">
    <!-- 聊天列表 -->
    <div class="chat-list">
      <!-- 空状态 -->
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>暂无聊天记录</p>
        <p class="empty-tip">聊天数据将从数据库获取</p>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar 
      :active-tab="'chats'"
      @tab-change="handleTabChange"
    />

    <!-- 开发按钮 -->
    <div class="dev-buttons" v-if="isDev">
      <button @click="forceAccessLogin" class="dev-login-btn">
        <span style="font-size: 16px;">🚪</span>
        访问登录页
      </button>
      <button @click="clearAuthAndReload" class="dev-clear-btn">
        <span style="font-size: 16px;">🗑️</span>
        清除认证
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'

const router = useRouter()
const appStore = useAppStore()

// 开发环境标识
const isDev = computed(() => import.meta.env.DEV)

// 方法
const handleTabChange = (tabKey: string) => {
  console.log('🔄 切换标签页:', tabKey)
  
  switch (tabKey) {
    case 'chats':
      // 已在聊天页面
      break
    case 'contacts':
      router.push('/contacts')
      break
    case 'discover':
      router.push('/discover')
      break
    case 'genealogy':
      router.push('/genealogy')
      break
    case 'profile':
      router.push('/profile')
      break
  }
}

// 开发工具方法
const forceAccessLogin = () => {
  console.log('🔧 强制访问登录页')
  router.push('/login')
}

const clearAuthAndReload = () => {
  console.log('🔧 清除认证并重新加载')
  appStore.logout()
  window.location.reload()
}

// 生命周期
onMounted(() => {
  console.log('📱 ChatHome 组件已挂载')
  console.log('👤 当前用户:', appStore.user?.username || '未登录')
  
  // 这里将来可以添加从数据库加载聊天列表的逻辑
  // loadChatsFromDatabase()
})
</script>

<style scoped>
.mobile-home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-tip {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
}

/* 开发按钮 */
.dev-buttons {
  position: fixed;
  top: 100px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.dev-login-btn,
.dev-clear-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dev-login-btn {
  background: #07C160;
  color: white;
}

.dev-clear-btn {
  background: #ff4757;
  color: white;
}

.dev-login-btn:hover {
  background: #06a552;
}

.dev-clear-btn:hover {
  background: #ff3838;
}
</style>

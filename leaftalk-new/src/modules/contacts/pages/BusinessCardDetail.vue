<template>
  <div class="business-card-detail">
    <!-- 顶部导航 -->
    <div class="card-header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h3>名片详情</h3>
      <button @click="shareCard" class="share-btn">
        <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 名片内容 -->
    <div class="card-content">
      <BusinessCard 
        :user-id="userId"
        :show-contact-info="true"
        :show-q-r-code="true"
        :is-own-card="isOwnCard"
        @add-friend="handleAddFriend"
        @start-chat="handleStartChat"
        @send-card="handleSendCard"
      />
    </div>

    <!-- 操作菜单 -->
    <div v-if="showActionMenu" class="action-menu-overlay" @click="hideActionMenu">
      <div class="action-menu" @click.stop>
        <div class="menu-item" @click="addToContacts">
          <iconify-icon icon="heroicons:user-plus" width="20"></iconify-icon>
          <span>添加到通讯录</span>
        </div>
        
        <div class="menu-item" @click="blockUser" v-if="!isOwnCard">
          <iconify-icon icon="heroicons:no-symbol" width="20"></iconify-icon>
          <span>拉黑用户</span>
        </div>
        
        <div class="menu-item" @click="reportUser" v-if="!isOwnCard">
          <iconify-icon icon="heroicons:flag" width="20"></iconify-icon>
          <span>举报用户</span>
        </div>
        
        <div class="menu-item cancel" @click="hideActionMenu">
          <span>取消</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import BusinessCard from '../../components/mobile/BusinessCard.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// 响应式数据
const showActionMenu = ref(false)

// 计算属性
const userId = computed(() => route.params.userId as string)
const isOwnCard = computed(() => userId.value === authStore.userInfo?.id)

// 方法
const goBack = () => {
  router.back()
}

const shareCard = () => {
  showActionMenu.value = true
}

const hideActionMenu = () => {
  showActionMenu.value = false
}

const handleAddFriend = (userId: string) => {
  console.log('添加好友:', userId)
  appStore.showToast('好友申请已发送', 'success')
}

const handleStartChat = (userId: string) => {
  console.log('开始聊天:', userId)
  router.push(`/chat/${userId}`)
}

const handleSendCard = (userInfo: any) => {
  console.log('分享名片:', userInfo)
  appStore.showToast('名片已分享', 'success')
}

const addToContacts = () => {
  hideActionMenu()
  appStore.showToast('已添加到通讯录', 'success')
}

const blockUser = () => {
  hideActionMenu()
  appStore.showToast('用户已拉黑', 'success')
}

const reportUser = () => {
  hideActionMenu()
  appStore.showToast('举报已提交', 'success')
}

// 生命周期
onMounted(() => {
  console.log('名片详情页面加载:', userId.value)
})
</script>

<style scoped>
.business-card-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  z-index: 10;
}

.back-btn,
.share-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.back-btn:hover,
.share-btn:hover {
  background: #f5f5f5;
}

.card-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.card-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 操作菜单 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.action-menu {
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover:not(.cancel) {
  background: #f5f5f5;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}

.menu-item.cancel {
  justify-content: center;
  color: #666;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.menu-item span {
  font-size: 16px;
}
</style>

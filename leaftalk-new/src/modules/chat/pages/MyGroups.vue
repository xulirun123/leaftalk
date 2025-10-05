<template>
  <div class="my-groups">
    <!-- 群组列表 -->
    <MobilePageContent>
      <div class="groups-list">
      <!-- 创建群聊入口 -->
      <div class="create-group-section">
        <div class="create-group-item" @click="goToCreateGroup">
          <div class="create-group-icon">
            <iconify-icon icon="heroicons:plus" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span class="create-group-title">发起群聊</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>

      <!-- 我的群组 -->
      <div class="groups-section">
        <div class="section-title">我的群组 ({{ myGroups.length }})</div>
        
        <div v-if="myGroups.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-group" width="64" style="color: #cccccc;"></iconify-icon>
          <p>暂无群组</p>
          <p class="empty-tip">创建或加入群聊后会显示在这里</p>
        </div>

        <div
          v-for="group in myGroups"
          :key="group.id"
          class="group-item"
          @click="openGroupChat(group.id)"
        >
          <img :src="group.avatar" :alt="group.name" class="group-avatar" />
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-members">{{ group.memberCount }}人</div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>
      </div>
    </MobilePageContent>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import MobilePageContent from '../../../shared/components/mobile/MobilePageContent.vue'

const router = useRouter()
const chatStore = useChatStore()

// 从聊天存储中获取群组数据
const myGroups = computed(() => {
  return chatStore.sessions.filter(chat => chat.type === 'group').map(chat => ({
    id: chat.id,
    name: chat.name,
    avatar: chat.avatar,
    memberCount: chat.memberCount || 1,
    role: chat.role || 'member',
    lastMessage: chat.lastMessage,
    lastMessageTime: chat.lastMessageTime
  }))
})

// 使用真实群组数据，不创建示例数据
const initializeGroups = () => {
  console.log('📝 使用真实群组数据，当前群组数量:', myGroups.value.length)
  // 不再创建示例群组，使用真实数据
}

// 方法
const goBack = () => {
  router.back()
}

const goToCreateGroup = () => {
  router.push('/create-group')
}

const openGroupChat = (groupId: string) => {
  router.push(`/chat/${groupId}`)
}

// 初始化
onMounted(() => {
  initializeGroups()
})


</script>

<style scoped>
.my-groups {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.groups-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.create-group-section {
  background: white;
  margin-bottom: 0;
}

.create-group-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 42px;
}

.create-group-item:hover {
  background: #f8f8f8;
}

.create-group-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.create-group-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.arrow {
  color: #999;
}

.groups-section {
  background: white;
  margin-top: 0;
}

.section-title {
  padding: 12px;
  font-size: 14px;
  color: #999;
  background: #f5f5f5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state p {
  margin: 16px 0 8px;
  color: #666;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #999;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 42px;
}

.group-item:last-child {
  border-bottom: none;
}

.group-item:hover {
  background: #f8f8f8;
}

.group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  margin-right: 12px;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 4px;
  font-weight: 500;
  line-height: 1.3;
}

.group-members {
  font-size: 12px;
  color: #999;
}

.arrow {
  color: #999;
  margin-left: 8px;
}
</style>

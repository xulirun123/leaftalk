<template>
  <div class="friend-more-info">
    <MobileTopBar title="更多信息" :show-back="true" @back="goBack" />

    <!-- 好友信息预览 -->
    <div class="friend-preview">
      <div class="friend-avatar">
        <img :src="friendInfo.avatar" :alt="friendInfo.name" class="avatar-image" />
      </div>
      <div class="friend-info">
        <h3 class="friend-name">{{ friendInfo.name }}</h3>
        <p class="friend-id">叶语号：{{ friendInfo.yeyuId }}</p>
      </div>
    </div>

    <!-- 更多信息列表 -->
    <div class="info-sections">
      <!-- 我和他的功能群聊 -->
      <div class="info-section">
        <div class="section-title">我和他的功能群聊</div>
        <div class="group-chats">
          <div 
            v-for="group in commonGroups" 
            :key="group.id"
            class="group-item"
            @click="openGroup(group)"
          >
            <div class="group-avatar">
              <img :src="group.avatar" :alt="group.name" />
            </div>
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-members">{{ group.memberCount }}人</div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
          </div>
          <div v-if="commonGroups.length === 0" class="empty-state">
            暂无共同群聊
          </div>
        </div>
      </div>

      <!-- 个人信息 -->
      <div class="info-section">
        <div class="section-title">个人信息</div>
        <div class="info-items">
          <!-- 签名 -->
          <div class="info-item">
            <div class="info-label">签名</div>
            <div class="info-value">{{ friendInfo.signature || '暂无签名' }}</div>
          </div>

          <!-- 来源 -->
          <div class="info-item">
            <div class="info-label">来源</div>
            <div class="info-value">{{ friendInfo.source || '通过搜索添加' }}</div>
          </div>

          <!-- 添加时间 -->
          <div class="info-item">
            <div class="info-label">添加时间</div>
            <div class="info-value">{{ formatAddTime(friendInfo.addTime) }}</div>
          </div>

          <!-- 地区 -->
          <div class="info-item">
            <div class="info-label">地区</div>
            <div class="info-value">{{ friendInfo.region || '未知' }}</div>
          </div>

          <!-- 性别 -->
          <div class="info-item">
            <div class="info-label">性别</div>
            <div class="info-value">{{ getGenderText(friendInfo.gender) }}</div>
          </div>
        </div>
      </div>

      <!-- 互动记录 -->
      <div class="info-section">
        <div class="section-title">互动记录</div>
        <div class="interaction-stats">
          <div class="stat-item">
            <div class="stat-number">{{ interactionStats.messageCount }}</div>
            <div class="stat-label">聊天消息</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ interactionStats.callCount }}</div>
            <div class="stat-label">通话次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ interactionStats.redPacketCount }}</div>
            <div class="stat-label">红包往来</div>
          </div>
        </div>
      </div>

      <!-- 朋友圈互动 -->
      <div class="info-section">
        <div class="section-title">朋友圈互动</div>
        <div class="moments-interaction">
          <div class="interaction-item" @click="viewMomentsLikes">
            <div class="interaction-info">
              <iconify-icon icon="heroicons:heart" class="interaction-icon"></iconify-icon>
              <span>他给我的点赞</span>
            </div>
            <div class="interaction-count">{{ momentsStats.likesFromHim }}</div>
            <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
          </div>
          <div class="interaction-item" @click="viewMomentsComments">
            <div class="interaction-info">
              <iconify-icon icon="heroicons:chat-bubble-left" class="interaction-icon"></iconify-icon>
              <span>他给我的评论</span>
            </div>
            <div class="interaction-count">{{ momentsStats.commentsFromHim }}</div>
            <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()

// 好友ID
const friendId = computed(() => route.params.id as string)

// 好友信息
const friendInfo = ref({
  id: '',
  name: '',
  avatar: '',
  yeyuId: '',
  signature: '',
  source: '',
  addTime: '',
  region: '',
  gender: ''
})

// 共同群聊
const commonGroups = ref([
  {
    id: '1',
    name: '家庭群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=family',
    memberCount: 8
  },
  {
    id: '2', 
    name: '工作交流群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=work',
    memberCount: 15
  }
])

// 互动统计
const interactionStats = ref({
  messageCount: 1234,
  callCount: 56,
  redPacketCount: 12
})

// 朋友圈统计
const momentsStats = ref({
  likesFromHim: 89,
  commentsFromHim: 23
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化添加时间
const formatAddTime = (time: string) => {
  if (!time) return '未知'
  return new Date(time).toLocaleDateString('zh-CN')
}

// 获取性别文本
const getGenderText = (gender: string) => {
  switch (gender) {
    case 'male': return '男'
    case 'female': return '女'
    default: return '未知'
  }
}

// 打开群聊
const openGroup = (group: any) => {
  router.push(`/group-chat/${group.id}`)
}

// 查看朋友圈点赞
const viewMomentsLikes = () => {
  router.push(`/moments-likes/${friendId.value}`)
}

// 查看朋友圈评论
const viewMomentsComments = () => {
  router.push(`/moments-comments/${friendId.value}`)
}

// 加载好友信息
const loadFriendInfo = () => {
  // 这里应该从API获取好友详细信息
  // 暂时使用模拟数据
  friendInfo.value = {
    id: friendId.value,
    name: `好友${friendId.value}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId.value}`,
    yeyuId: `YY${friendId.value}`,
    signature: '生活就像一盒巧克力，你永远不知道下一颗是什么味道',
    source: '通过手机号添加',
    addTime: '2024-01-15',
    region: '北京市朝阳区',
    gender: 'male'
  }
}

onMounted(() => {
  loadFriendInfo()
})
</script>

<style scoped>
.friend-more-info {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 好友信息预览 */
.friend-preview {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 12px;
}

.friend-avatar {
  width: 60px;
  height: 60px;
  margin-right: 16px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.friend-id {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 信息区域 */
.info-sections {
  space-y: 12px;
}

.info-section {
  background: white;
  margin-bottom: 12px;
}

.section-title {
  padding: 16px 16px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

/* 群聊列表 */
.group-chats {
  padding: 0 16px 16px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.group-item:last-child {
  border-bottom: none;
}

.group-avatar {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.group-members {
  font-size: 12px;
  color: #999;
}

.arrow-icon {
  color: #999;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

/* 信息项 */
.info-items {
  padding: 0 16px 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 16px;
  color: #333;
}

.info-value {
  font-size: 14px;
  color: #666;
  text-align: right;
  max-width: 200px;
  word-break: break-all;
}

/* 互动统计 */
.interaction-stats {
  display: flex;
  padding: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #07C160;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 朋友圈互动 */
.moments-interaction {
  padding: 0 16px 16px;
}

.interaction-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.interaction-item:last-child {
  border-bottom: none;
}

.interaction-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.interaction-icon {
  margin-right: 8px;
  color: #07C160;
  font-size: 18px;
}

.interaction-count {
  font-size: 14px;
  color: #07C160;
  font-weight: 600;
  margin-right: 8px;
}
</style>

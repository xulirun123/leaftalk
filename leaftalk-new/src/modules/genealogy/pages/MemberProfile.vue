<template>
  <div class="member-profile-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      :title="member?.name || '成员资料'" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canEdit" @click="editMode = !editMode" class="edit-btn">
          <iconify-icon :icon="editMode ? 'heroicons:check' : 'heroicons:pencil'" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="profile-content">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="avatar-section">
          <div class="avatar-container">
            <img 
              :src="member?.avatar || '/default-avatar.png'"
              :alt="member?.name"
              class="member-avatar"
              :class="{ deceased: !member?.isAlive }"
            />
            <div class="status-indicator" :class="{ alive: member?.isAlive, deceased: !member?.isAlive }">
              <iconify-icon 
                :icon="member?.isAlive ? 'heroicons:heart' : 'heroicons:heart'"
                width="12"
              ></iconify-icon>
            </div>
            <div class="gender-indicator" :class="member?.gender">
              <iconify-icon 
                :icon="member?.gender === 'male' ? 'heroicons:user' : 'heroicons:user'"
                width="14"
              ></iconify-icon>
            </div>
          </div>
          <button v-if="editMode" @click="uploadAvatar" class="upload-avatar-btn">
            <iconify-icon icon="heroicons:camera" width="16"></iconify-icon>
            更换头像
          </button>
        </div>

        <div class="basic-info">
          <div class="info-row">
            <label>姓名</label>
            <span class="readonly">{{ member?.name }}</span>
          </div>
          <div class="info-row">
            <label>性别</label>
            <span class="readonly">{{ member?.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="info-row">
            <label>出生日期</label>
            <span class="readonly">{{ formatDate(member?.birthDate) }}</span>
          </div>
          <div v-if="!member?.isAlive" class="info-row">
            <label>死亡日期</label>
            <input 
              v-if="editMode && canEditDeathInfo"
              v-model="editData.deathDate"
              type="date"
              class="edit-input"
            />
            <span v-else class="readonly">{{ formatDate(member?.deathDate) }}</span>
          </div>
          <div class="info-row">
            <label>户籍地址</label>
            <span class="readonly">{{ member?.address }}</span>
          </div>
        </div>
      </div>

      <!-- 生平简历 -->
      <div class="info-card">
        <div class="card-header">
          <h3>生平简历</h3>
        </div>
        <div class="card-content">
          <textarea 
            v-if="editMode"
            v-model="editData.biography"
            placeholder="请输入生平简历..."
            class="biography-textarea"
          ></textarea>
          <p v-else class="biography-text">
            {{ member?.biography || '暂无生平简历' }}
          </p>
        </div>
      </div>

      <!-- 照片和视频 -->
      <div class="info-card">
        <div class="card-header">
          <h3>照片和视频</h3>
          <button v-if="editMode" @click="uploadMedia" class="upload-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
            上传
          </button>
        </div>
        <div class="media-grid">
          <div 
            v-for="(media, index) in member?.media || []" 
            :key="index"
            class="media-item"
            @click="viewMedia(media)"
          >
            <img v-if="media.type === 'image'" :src="media.url" :alt="media.name" />
            <div v-else class="video-thumbnail">
              <iconify-icon icon="heroicons:play" width="24"></iconify-icon>
            </div>
            <button v-if="editMode" @click.stop="removeMedia(index)" class="remove-media-btn">
              <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
            </button>
          </div>
          <div v-if="editMode" @click="uploadMedia" class="add-media-item">
            <iconify-icon icon="heroicons:plus" width="32"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 家族关系 -->
      <div class="info-card">
        <div class="card-header">
          <h3>家族关系</h3>
        </div>
        <div class="relationships">
          <div v-if="member?.father" class="relationship-item">
            <label>父亲</label>
            <div class="relation-member" @click="viewMember(member.father)">
              <img :src="member.father.avatar || '/default-avatar.png'" :alt="member.father.name" />
              <span>{{ member.father.name }}</span>
            </div>
          </div>
          <div v-if="member?.mother" class="relationship-item">
            <label>母亲</label>
            <div class="relation-member" @click="viewMember(member.mother)">
              <img :src="member.mother.avatar || '/default-avatar.png'" :alt="member.mother.name" />
              <span>{{ member.mother.name }}</span>
            </div>
          </div>
          <div v-if="member?.spouses && member.spouses.length > 0" class="relationship-item">
            <label>配偶</label>
            <div class="relation-list">
              <div 
                v-for="spouse in member.spouses" 
                :key="spouse.id"
                class="relation-member"
                @click="viewMember(spouse)"
              >
                <img :src="spouse.avatar || '/default-avatar.png'" :alt="spouse.name" />
                <span>{{ spouse.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="member?.children && member.children.length > 0" class="relationship-item">
            <label>子女</label>
            <div class="relation-list">
              <div 
                v-for="child in member.children" 
                :key="child.id"
                class="relation-member"
                @click="viewMember(child)"
              >
                <img :src="child.avatar || '/default-avatar.png'" :alt="child.name" />
                <span>{{ child.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button v-if="member?.isAlive && !isCurrentUser" @click="addFriend" class="action-btn primary">
          <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
          添加好友
        </button>
        <button v-if="!member?.isAlive && canViewTomb" @click="navigateToTomb" class="action-btn">
          <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
          墓址导航
        </button>
        <button v-if="!member?.isAlive && hasAIData" @click="startAIChat" class="action-btn">
          <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
          AI对话
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const memberId = ref(route.params.memberId)
const member = ref(null)
const editMode = ref(false)
const editData = ref({
  biography: '',
  deathDate: ''
})

// 计算属性
const canEdit = computed(() => {
  // 直系后代可以编辑
  return member.value?.canEdit || authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin'
})

const canEditDeathInfo = computed(() => {
  // 只有直系后代可以编辑死亡信息
  return member.value?.isDirectDescendant
})

const canViewTomb = computed(() => {
  // 只有直系后代可以查看墓址
  return member.value?.isDirectDescendant
})

const isCurrentUser = computed(() => {
  return member.value?.userId === authStore.user?.id
})

const hasAIData = computed(() => {
  return member.value?.hasVoiceRecords || member.value?.hasVideoRecords
})

// 生命周期
onMounted(() => {
  loadMemberData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMemberData = async () => {
  try {
    // 模拟加载成员数据
    member.value = {
      id: memberId.value,
      name: '张三',
      gender: 'male',
      isAlive: false,
      birthDate: new Date('1950-01-01'),
      deathDate: new Date('2020-01-01'),
      address: '北京市朝阳区',
      biography: '张三，生于1950年，是一位杰出的工程师...',
      avatar: '',
      media: [
        { type: 'image', url: '/photo1.jpg', name: '童年照片' },
        { type: 'video', url: '/video1.mp4', name: '生日视频' }
      ],
      father: { id: 1, name: '张父', avatar: '' },
      mother: { id: 2, name: '张母', avatar: '' },
      spouses: [{ id: 3, name: '李妻', avatar: '' }],
      children: [
        { id: 4, name: '张子', avatar: '' },
        { id: 5, name: '张女', avatar: '' }
      ],
      canEdit: true,
      isDirectDescendant: true,
      hasVoiceRecords: true,
      hasVideoRecords: false
    }
    
    editData.value.biography = member.value.biography
    editData.value.deathDate = member.value.deathDate ? formatDateForInput(member.value.deathDate) : ''
  } catch (error) {
    console.error('加载成员数据失败:', error)
    appStore.showToast('加载成员数据失败', 'error')
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateForInput = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

const uploadAvatar = () => {
  // 实现头像上传
  appStore.showToast('头像上传功能开发中', 'info')
}

const uploadMedia = () => {
  // 实现媒体上传
  appStore.showToast('媒体上传功能开发中', 'info')
}

const viewMedia = (media) => {
  // 查看媒体
  console.log('查看媒体:', media)
}

const removeMedia = (index) => {
  // 删除媒体
  member.value.media.splice(index, 1)
}

const viewMember = (relatedMember) => {
  router.push(`/genealogy/${genealogyId.value}/member/${relatedMember.id}`)
}

const addFriend = () => {
  appStore.showToast('好友请求已发送', 'success')
}

const navigateToTomb = () => {
  router.push(`/genealogy/${genealogyId.value}/member/${memberId.value}/tomb-navigation`)
}

const startAIChat = () => {
  router.push(`/genealogy/${genealogyId.value}/member/${memberId.value}/ai-chat`)
}
</script>

<style scoped>
.member-profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.edit-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.profile-content {
  padding: 75px 16px 100px 16px;
}

/* 信息卡片 */
.info-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.avatar-section {
  text-align: center;
  padding: 24px 20px 16px 20px;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-avatar.deceased {
  filter: grayscale(100%);
  opacity: 0.8;
}

.status-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.status-indicator.alive {
  background: #07c160;
  color: white;
}

.status-indicator.deceased {
  background: #999;
  color: white;
}

.gender-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.gender-indicator.male {
  background: #4A90E2;
  color: white;
}

.gender-indicator.female {
  background: #E24A90;
  color: white;
}

.upload-avatar-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 auto;
}

.basic-info {
  padding: 0 20px 20px 20px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.readonly {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.edit-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.upload-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-content {
  padding: 16px 20px;
}

/* 生平简历 */
.biography-textarea {
  width: 100%;
  min-height: 100px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.biography-text {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

/* 媒体网格 */
.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px 20px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.remove-media-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-media-item {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}

.add-media-item:hover {
  border-color: #07c160;
  color: #07c160;
}

/* 家族关系 */
.relationships {
  padding: 16px 20px;
}

.relationship-item {
  margin-bottom: 16px;
}

.relationship-item:last-child {
  margin-bottom: 0;
}

.relationship-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.relation-member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.relation-member:hover {
  background: #f5f5f5;
}

.relation-member img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.relation-member span {
  font-size: 14px;
  color: #333;
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.action-btn.primary:hover {
  background: #06a552;
}
</style>

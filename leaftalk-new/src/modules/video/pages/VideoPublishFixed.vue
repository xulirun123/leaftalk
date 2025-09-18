<template>
  <div class="video-publish">
    <!-- 头部导航 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="material-symbols:arrow-back-ios" width="20" style="color: white;" />
      </button>
      <h1 class="title">发布视频</h1>
      <button class="publish-btn" @click="publishVideo" :disabled="!canPublish">
        发布
      </button>
    </div>

    <!-- 视频预览 -->
    <div class="video-preview-section">
      <video
        v-if="videoData"
        :src="videoData.url"
        class="preview-video"
        controls
        muted
        loop
      ></video>
      
      <div v-else class="no-video">
        <iconify-icon icon="heroicons:video-camera-slash" width="48" style="color: #ccc;" />
        <p>没有视频内容</p>
      </div>
    </div>

    <!-- 发布信息 -->
    <div class="publish-form">
      <!-- 视频描述 -->
      <div class="form-group">
        <label>视频描述</label>
        <textarea
          v-model="description"
          placeholder="分享你的精彩瞬间..."
          class="description-input"
          rows="4"
          maxlength="200"
        ></textarea>
        <div class="char-count">{{ description.length }}/200</div>
      </div>

      <!-- 话题标签 -->
      <div class="form-group">
        <label>添加话题</label>
        <div class="tags-input">
          <div class="selected-tags">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="tag-item"
            >
              #{{ tag }}
              <button @click="removeTag(tag)" class="remove-tag">×</button>
            </span>
          </div>
          <input
            v-model="newTag"
            type="text"
            placeholder="输入话题标签"
            class="tag-input"
            @keyup.enter="addTag"
          />
        </div>
        
        <!-- 推荐话题 -->
        <div class="recommended-tags">
          <span
            v-for="tag in recommendedTags"
            :key="tag"
            class="recommended-tag"
            @click="addRecommendedTag(tag)"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="form-group">
        <label>隐私设置</label>
        <div class="privacy-options">
          <label class="privacy-option">
            <input
              v-model="privacy"
              type="radio"
              value="public"
            />
            <span>公开</span>
            <small>所有人可见</small>
          </label>
          <label class="privacy-option">
            <input
              v-model="privacy"
              type="radio"
              value="friends"
            />
            <span>好友可见</span>
            <small>仅好友可见</small>
          </label>
          <label class="privacy-option">
            <input
              v-model="privacy"
              type="radio"
              value="private"
            />
            <span>仅自己可见</span>
            <small>私密视频</small>
          </label>
        </div>
      </div>

      <!-- 位置信息 -->
      <div class="form-group">
        <label>添加位置</label>
        <button class="location-btn" @click="addLocation">
          <iconify-icon icon="material-symbols:location-on" width="16" />
          <span>{{ location || '添加位置' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'

// 路由
const router = useRouter()
const route = useRoute()
const { safeBack } = useSafeNavigation()

// 响应式数据
const videoData = ref<{ url: string, blob: Blob } | null>(null)
const description = ref('')
const selectedTags = ref<string[]>([])
const newTag = ref('')
const privacy = ref('public')
const location = ref('')

// 推荐话题
const recommendedTags = ref([
  '生活', '美食', '旅行', '音乐', '运动', '学习', '工作', '宠物'
])

// 计算属性
const canPublish = computed(() => {
  return videoData.value && description.value.trim().length > 0
})

// 方法
const goBack = () => {
  safeBack('/my-video-channel')
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !selectedTags.value.includes(tag) && selectedTags.value.length < 5) {
    selectedTags.value.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const addRecommendedTag = (tag: string) => {
  if (!selectedTags.value.includes(tag) && selectedTags.value.length < 5) {
    selectedTags.value.push(tag)
  }
}

const addLocation = () => {
  // 模拟位置选择
  location.value = '北京市朝阳区'
}

const publishVideo = async () => {
  if (!canPublish.value) return
  
  console.log('📤 发布视频:', {
    description: description.value,
    tags: selectedTags.value,
    privacy: privacy.value,
    location: location.value,
    videoData: videoData.value
  })
  
  // 模拟发布过程
  try {
    // 这里应该调用API上传视频
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('✅ 视频发布成功')
    
    // 返回我的视频号页面
    safeBack('/my-video-channel')
    
  } catch (error) {
    console.error('❌ 视频发布失败:', error)
  }
}

// 生命周期
onMounted(() => {
  // 从路由参数获取视频数据
  const videoUrl = route.query.videoUrl as string
  const videoBlob = route.query.videoBlob as string
  
  if (videoUrl) {
    videoData.value = {
      url: videoUrl,
      blob: new Blob() // 这里应该从实际数据恢复
    }
  }
  
  console.log('📹 视频发布页面已加载')
})
</script>

<style scoped>
.video-publish {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  background: #07C160;
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.publish-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.publish-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-preview-section {
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.preview-video {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.no-video {
  text-align: center;
  color: #ccc;
}

.no-video p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

.publish-form {
  flex: 1;
  padding: 20px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.description-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.description-input:focus {
  border-color: #07C160;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.tags-input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  background: #07C160;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.tag-input {
  border: none;
  outline: none;
  flex: 1;
  min-width: 100px;
  font-size: 14px;
}

.recommended-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommended-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.recommended-tag:hover {
  background: #e0e0e0;
}

.privacy-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.privacy-option input {
  margin: 0;
}

.privacy-option span {
  font-weight: 500;
}

.privacy-option small {
  color: #666;
  margin-left: auto;
}

.location-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.location-btn:hover {
  border-color: #07C160;
}

.location-btn span {
  color: #333;
}
</style>

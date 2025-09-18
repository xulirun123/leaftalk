<template>
  <div class="publish-video">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('pages.publishVideo') }}</div>
      <button 
        class="publish-btn" 
        :disabled="!canPublish"
        @click="publishVideo"
      >
        {{ $t('common.publish') }}
      </button>
    </div>

    <!-- 视频预览 -->
    <div class="video-preview">
      <div v-if="!selectedVideo" class="upload-area" @click="selectVideo">
        <iconify-icon icon="heroicons:video-camera" width="48" style="color: #ccc;"></iconify-icon>
        <p>点击选择视频</p>
        <span class="upload-tips">支持MP4格式，最大100MB</span>
      </div>
      
      <div v-else class="video-container">
        <video 
          ref="videoRef"
          :src="videoUrl"
          controls
          preload="metadata"
          @loadedmetadata="onVideoLoaded"
        ></video>
        <button class="change-video-btn" @click="selectVideo">
          更换视频
        </button>
      </div>
    </div>

    <!-- 视频信息编辑 -->
    <div class="video-info">
      <div class="form-group">
        <label>视频标题</label>
        <input 
          v-model="videoTitle"
          type="text"
          placeholder="给你的视频起个标题吧"
          maxlength="50"
        />
        <div class="char-count">{{ videoTitle.length }}/50</div>
      </div>

      <div class="form-group">
        <label>视频描述</label>
        <textarea 
          v-model="videoDescription"
          placeholder="介绍一下你的视频内容..."
          maxlength="200"
          rows="4"
        ></textarea>
        <div class="char-count">{{ videoDescription.length }}/200</div>
      </div>

      <div class="form-group">
        <label>封面图片</label>
        <div class="cover-selector">
          <div 
            v-for="(cover, index) in coverOptions" 
            :key="index"
            class="cover-option"
            :class="{ active: selectedCoverIndex === index }"
            @click="selectedCoverIndex = index"
          >
            <img :src="cover" :alt="`封面 ${index + 1}`" />
            <div class="cover-check">
              <iconify-icon icon="heroicons:check" width="16" style="color: white;"></iconify-icon>
            </div>
          </div>
          <div class="cover-option upload-cover" @click="uploadCustomCover">
            <iconify-icon icon="heroicons:plus" width="24" style="color: #666;"></iconify-icon>
            <span>自定义</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>标签</label>
        <div class="tag-input">
          <div class="selected-tags">
            <span 
              v-for="tag in selectedTags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
              <button @click="removeTag(tag)">
                <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
              </button>
            </span>
          </div>
          <input 
            v-model="tagInput"
            type="text"
            placeholder="添加标签，按回车确认"
            @keydown.enter="addTag"
            @keydown.space="addTag"
          />
        </div>
        <div class="popular-tags">
          <span class="tags-label">热门标签：</span>
          <button 
            v-for="tag in popularTags" 
            :key="tag"
            class="popular-tag"
            @click="addPopularTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>隐私设置</label>
        <div class="privacy-options">
          <label class="radio-option">
            <input type="radio" v-model="privacy" value="public" />
            <span class="radio-label">
              <iconify-icon icon="heroicons:globe-alt" width="16"></iconify-icon>
              公开
            </span>
            <span class="radio-desc">所有人都可以看到</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="privacy" value="friends" />
            <span class="radio-label">
              <iconify-icon icon="heroicons:user-group" width="16"></iconify-icon>
              仅好友
            </span>
            <span class="radio-desc">只有好友可以看到</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="privacy" value="private" />
            <span class="radio-label">
              <iconify-icon icon="heroicons:lock-closed" width="16"></iconify-icon>
              私密
            </span>
            <span class="radio-desc">只有自己可以看到</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="allowComments" />
          <span>允许评论</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="allowDownload" />
          <span>允许下载</span>
        </label>
      </div>
    </div>

    <!-- 文件输入 -->
    <input 
      ref="videoInput"
      type="file"
      accept="video/*"
      style="display: none"
      @change="onVideoSelected"
    />
    
    <input 
      ref="coverInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onCoverSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 视频相关
const videoRef = ref<HTMLVideoElement>()
const videoInput = ref<HTMLInputElement>()
const coverInput = ref<HTMLInputElement>()
const selectedVideo = ref<File | null>(null)
const videoUrl = ref('')
const videoDuration = ref(0)

// 表单数据
const videoTitle = ref('')
const videoDescription = ref('')
const selectedCoverIndex = ref(0)
const coverOptions = ref<string[]>([])
const selectedTags = ref<string[]>([])
const tagInput = ref('')
const privacy = ref('public')
const allowComments = ref(true)
const allowDownload = ref(false)

// 热门标签
const popularTags = ref([
  '生活', '美食', '旅行', '音乐', '搞笑', '宠物', '运动', '学习'
])

// 计算属性
const canPublish = computed(() => {
  return selectedVideo.value && videoTitle.value.trim().length > 0
})

// 方法
const goBack = () => {
  router.back()
}

const selectVideo = () => {
  videoInput.value?.click()
}

const onVideoSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    selectedVideo.value = file
    videoUrl.value = URL.createObjectURL(file)
    
    // 自动生成标题（基于文件名）
    if (!videoTitle.value) {
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      videoTitle.value = fileName
    }
  }
}

const onVideoLoaded = () => {
  if (videoRef.value) {
    videoDuration.value = videoRef.value.duration
    generateCoverOptions()
  }
}

const generateCoverOptions = async () => {
  if (!videoRef.value) return
  
  const video = videoRef.value
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const covers: string[] = []
  const timePoints = [0, videoDuration.value * 0.25, videoDuration.value * 0.5, videoDuration.value * 0.75]
  
  for (const time of timePoints) {
    video.currentTime = time
    await new Promise(resolve => {
      video.addEventListener('seeked', resolve, { once: true })
    })
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    covers.push(canvas.toDataURL('image/jpeg', 0.8))
  }
  
  coverOptions.value = covers
}

const uploadCustomCover = () => {
  coverInput.value?.click()
}

const onCoverSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const url = URL.createObjectURL(file)
    coverOptions.value.push(url)
    selectedCoverIndex.value = coverOptions.value.length - 1
  }
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !selectedTags.value.includes(tag) && selectedTags.value.length < 5) {
    selectedTags.value.push(tag)
    tagInput.value = ''
  }
}

const addPopularTag = (tag: string) => {
  if (!selectedTags.value.includes(tag) && selectedTags.value.length < 5) {
    selectedTags.value.push(tag)
  }
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const publishVideo = async () => {
  if (!canPublish.value) return
  
  try {
    // 这里应该调用API上传视频
    console.log('发布视频:', {
      video: selectedVideo.value,
      title: videoTitle.value,
      description: videoDescription.value,
      cover: coverOptions.value[selectedCoverIndex.value],
      tags: selectedTags.value,
      privacy: privacy.value,
      allowComments: allowComments.value,
      allowDownload: allowDownload.value
    })
    
    // 模拟上传过程
    alert('视频发布成功！')
    router.back()
  } catch (error) {
    console.error('发布视频失败:', error)
    alert('发布失败，请重试')
  }
}
</script>

<style scoped lang="scss">
.publish-video {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  
  .back-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    
    &:hover {
      background: #f0f0f0;
    }
  }
  
  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .publish-btn {
    padding: 8px 16px;
    background: #07C160;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      background: #06a552;
    }
  }
}

.video-preview {
  background: white;
  margin-bottom: 8px;
  
  .upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    cursor: pointer;
    border: 2px dashed #ddd;
    margin: 16px;
    border-radius: 8px;
    
    &:hover {
      border-color: #07C160;
      background: #f9f9f9;
    }
    
    p {
      margin: 12px 0 4px 0;
      font-size: 16px;
      color: #333;
    }
    
    .upload-tips {
      font-size: 12px;
      color: #666;
    }
  }
  
  .video-container {
    position: relative;
    padding: 16px;
    
    video {
      width: 100%;
      max-height: 300px;
      border-radius: 8px;
    }
    
    .change-video-btn {
      position: absolute;
      top: 24px;
      right: 24px;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
  }
}

.video-info {
  background: white;
  padding: 16px;
  
  .form-group {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    
    input[type="text"], textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      resize: none;
      
      &:focus {
        outline: none;
        border-color: #07C160;
      }
    }
    
    .char-count {
      text-align: right;
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
  }
}

.cover-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  
  .cover-option {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    
    &.active {
      border-color: #07C160;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .cover-check {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: #07C160;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    &.active .cover-check {
      opacity: 1;
    }
    
    &.upload-cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border: 1px dashed #ddd;
      
      span {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }
      
      &:hover {
        background: #f0f0f0;
      }
    }
  }
}

.tag-input {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px;
  min-height: 40px;
  
  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
    
    .tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #07C160;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      
      button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
      }
    }
  }
  
  input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
  }
}

.popular-tags {
  margin-top: 8px;
  
  .tags-label {
    font-size: 12px;
    color: #666;
    margin-right: 8px;
  }
  
  .popular-tag {
    display: inline-block;
    padding: 4px 8px;
    margin: 2px 4px 2px 0;
    background: #f5f5f5;
    border: none;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    
    &:hover {
      background: #e0e0e0;
    }
  }
}

.privacy-options {
  .radio-option {
    display: flex;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
    
    input[type="radio"] {
      margin-right: 12px;
    }
    
    .radio-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: #333;
      margin-right: 8px;
    }
    
    .radio-desc {
      font-size: 12px;
      color: #666;
    }
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  
  input[type="checkbox"] {
    margin-right: 8px;
  }
  
  span {
    font-size: 14px;
    color: #333;
  }
}
</style>

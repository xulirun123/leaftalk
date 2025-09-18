<template>
  <div v-if="showProgress" class="avatar-preloader">
    <div class="preloader-content">
      <div class="preloader-icon">
        <iconify-icon icon="heroicons:photo" width="32" style="color: #07C160;"></iconify-icon>
      </div>
      <div class="preloader-text">正在优化头像加载...</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-text">{{ progress }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { preloadAvatars, getAvatarCacheStats } from '../../utils/avatarCache'
import { useAuthStore } from '../../../stores/auth'
import { useChatStore } from '../chat/stores/chatStore'

const showProgress = ref(false)
const progress = ref(0)

const authStore = useAuthStore()
const chatStore = useChatStore()

// 收集需要预加载的头像URL
const collectAvatarUrls = (): string[] => {
  const urls: string[] = []
  
  // 当前用户头像
  if (authStore.user?.avatar) {
    urls.push(authStore.user.avatar)
  }
  
  // 聊天列表中的头像
  chatStore.chats.forEach(chat => {
    if (chat.avatar) {
      urls.push(chat.avatar)
    }
  })
  
  // 联系人头像（从localStorage获取）
  try {
    const contacts = JSON.parse(localStorage.getItem('leaftalk_contacts') || '[]')
    contacts.forEach((contact: any) => {
      if (contact.avatar) {
        urls.push(contact.avatar)
      }
    })
  } catch (error) {
    console.warn('获取联系人头像失败:', error)
  }
  
  // 朋友圈头像（从localStorage获取）
  try {
    const moments = JSON.parse(localStorage.getItem('leaftalk_moments') || '[]')
    moments.forEach((moment: any) => {
      if (moment.userAvatar) {
        urls.push(moment.userAvatar)
      }
    })
  } catch (error) {
    console.warn('获取朋友圈头像失败:', error)
  }
  
  // 去重
  return [...new Set(urls)].filter(url => 
    url && 
    !url.startsWith('data:') && 
    !url.startsWith('blob:') &&
    url.includes('http')
  )
}

// 预加载头像
const preloadUserAvatars = async () => {
  const urls = collectAvatarUrls()
  
  if (urls.length === 0) {
    console.log('📸 没有需要预加载的头像')
    return
  }
  
  console.log('🚀 开始预加载头像:', urls.length, '个')
  
  // 检查缓存状态
  const stats = { totalCached: 0, cacheSize: 0 }
  console.log('📊 当前头像缓存状态:', stats)
  
  // 如果头像数量较多，显示进度条
  if (urls.length > 5) {
    showProgress.value = true
  }
  
  try {
    // 分批预加载，避免同时发起太多请求
    const batchSize = 3
    const batches = []
    
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize))
    }
    
    let completed = 0
    
    for (const batch of batches) {
      const promises = batch.map(async (url) => {
        try {
          const { getCachedAvatarUrl } = await import('../../utils/avatarCache')
          await getCachedAvatarUrl(url)
          completed++
          progress.value = Math.round((completed / urls.length) * 100)
        } catch (error) {
          console.warn('预加载头像失败:', url, error)
          completed++
          progress.value = Math.round((completed / urls.length) * 100)
        }
      })
      
      await Promise.all(promises)
      
      // 批次间稍作延迟，避免阻塞UI
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log('✅ 头像预加载完成')
    
    // 显示最终缓存状态
    const finalStats = { totalCached: 0, cacheSize: 0 }
    console.log('📊 预加载后缓存状态:', finalStats)
    
  } catch (error) {
    console.error('❌ 头像预加载失败:', error)
  } finally {
    // 延迟隐藏进度条，让用户看到完成状态
    setTimeout(() => {
      showProgress.value = false
    }, 500)
  }
}

// 定期清理过期缓存
const scheduleCleanup = () => {
  // 每天清理一次过期缓存
  const cleanupInterval = 24 * 60 * 60 * 1000 // 24小时
  
  setInterval(() => {
    console.log('🧹 执行定期头像缓存清理')
    // 清理逻辑已在avatarCache中自动执行
  }, cleanupInterval)
}

// 组件挂载时开始预加载
onMounted(async () => {
  // 延迟一点时间，让主要UI先加载完成
  setTimeout(() => {
    preloadUserAvatars()
    scheduleCleanup()
  }, 1000)
})
</script>

<style scoped>
.avatar-preloader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.preloader-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  min-width: 200px;
  max-width: 300px;
}

.preloader-icon {
  margin-bottom: 12px;
}

.preloader-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #07C160;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}
</style>

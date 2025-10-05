<template>
  <div class="mobile-discover">
    <!-- 发现功能列表 -->
    <div class="discover-list">
      <div class="discover-section">
        <div class="discover-item" @click="goToMoments">
          <div class="discover-icon moments-icon">
            <iconify-icon icon="heroicons:camera" width="18" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.moments') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="14" class="arrow"></iconify-icon>
        </div>

        <div class="discover-item" @click="goToVideoChannel">
          <div class="discover-icon video-icon">
            <iconify-icon icon="heroicons:video-camera" width="18" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.videoChannel') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="14" class="arrow"></iconify-icon>
        </div>
      </div>

      <div class="discover-section">
        <div class="discover-item" @click="goToScan">
          <div class="discover-icon scan-icon">
            <iconify-icon icon="heroicons:qr-code" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.scan') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>

      </div>

      <div class="discover-section">
        <div class="discover-item" @click="goToNearby">
          <div class="discover-icon nearby-icon">
            <iconify-icon icon="heroicons:map-pin" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.nearby') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>

      <div class="discover-section">
        <div class="discover-item" @click="openAIAssistant">
          <div class="discover-icon ai-icon">
            <iconify-icon icon="heroicons:cpu-chip" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.aiAssistant') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>

        <div class="discover-item" @click="goToLive">
          <div class="discover-icon live-icon">
            <iconify-icon icon="heroicons:video-camera" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.liveStream') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>


      </div>

      <div class="discover-section">
        <div class="discover-item" @click="goToMiniPrograms">
          <div class="discover-icon mini-icon">
            <iconify-icon icon="heroicons:squares-2x2" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('discover.miniPrograms') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'
import { useDiscoverStore } from '../stores/discoverStore'

const router = useRouter()
const { safePush } = useSafeNavigation()
const discoverStore = useDiscoverStore()
// 使用全局国际化系统 - $t 在模板中直接可用

// 返回功能
const goBack = () => {
  console.log('🔙 发现页面返回')
  router.push('/')
}

// 导航方法
const goToMoments = () => {
  // 清零朋友圈未读数
  discoverStore.clearMomentsUnread()
  safePush('/moments-feed')
}

const goToVideoChannel = () => {
  // 清零视频号未读数
  discoverStore.clearVideoUnread()

  // 直接播放推荐视频，不进入列表页面
  playRecommendVideo()
}

const playRecommendVideo = () => {
  console.log('🎬 发现页面：开始播放推荐视频')

  // 直接跳转到短视频播放页面，播放推荐视频
  safePush('/short-video-player?mode=discover&autoplay=true')
}

const goToScan = () => {
  safePush('/scan')
}

const goToNearby = () => {
  // 检查位置权限
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('当前位置:', position.coords)
        safePush('/nearby')
      },
      (error) => {
        console.error('获取位置失败:', error)
        // 使用更好的提示方式，而不是alert
        console.warn('需要位置权限才能使用附近的人功能')
      }
    )
  } else {
    console.warn('您的浏览器不支持定位功能')
  }
}

const openAIAssistant = () => {
  safePush('/ai')
}

const goToLive = () => {
  safePush('/live-browse')
}

const goToMiniPrograms = () => {
  // 跳转到小程序中心
  safePush('/mini-programs')
}
</script>

<style scoped>
.mobile-discover {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #e5e5e5;
  /* 移除padding，由MobileApp.vue统一管理 */
}

.discover-list {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
}

.discover-section {
  background-color: white;
  margin-bottom: 0;
}

.discover-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 48px;
  background-color: white;
}

/* 保留所有分隔线，包括最后一个项目 */

.discover-item:hover {
  background-color: #f8f8f8;
}

.discover-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.moments-icon {
  background: #07C160;
}

.video-icon {
  background: #FF6B35;
}

.scan-icon {
  background: #1890FF;
}

.shake-icon {
  background: #722ED1;
}

.nearby-icon {
  background: #FA8C16;
}

.bottle-icon {
  background: #13C2C2;
}

.shopping-icon {
  background: #EB2F96;
}

.ai-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.live-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.mini-icon {
  background: #FAAD14;
}

.discover-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.arrow {
  color: #999;
}
</style>
<template>
  <div class="incoming-call-container">
    <!-- 背景模糊 -->
    <div class="background-blur"></div>

    <!-- 来电用户信息 -->
    <div class="caller-info">
      <img :src="callerInfo.avatar" :alt="callerInfo.name" class="caller-avatar" />
      <div class="caller-name">{{ callerInfo.name }}</div>
      <div class="call-status">{{ callTypeText }}</div>
    </div>

    <!-- 底部控制按钮 -->
    <div class="call-controls">
      <!-- 拒绝接听 -->
      <button @click="rejectCall" class="control-btn reject-btn">
        <iconify-icon icon="heroicons:phone-x-mark" width="32" />
      </button>

      <!-- 接听通话 -->
      <button @click="acceptCall" class="control-btn accept-btn">
        <iconify-icon icon="heroicons:phone" width="32" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'

// 路由和状态
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 来电参数
const callerId = ref(route.params.callerId as string)
const callType = ref(route.query.type as 'voice' | 'video' || 'voice')
const callId = ref((route.query.callId as string) || '')

// 来电者信息
const callerInfo = ref({
  name: (route.query.name as string) || `用户${callerId.value}`,
  avatar: (route.query.avatar as string) || ''
})

// 计算属性
const callTypeText = computed(() => {
  return callType.value === 'video' ? '视频通话' : '语音通话'
})

// 接听通话（优化：立即跳转，API 后台执行，减少等待时间）
const acceptCall = async () => {
  console.log('📞 接听通话:', { callId: callId.value, callerId: callerId.value, callType: callType.value })

  // 后台触发接听，不等待完成（由后端推送 answered，主叫再发 Offer）
  fetch('http://localhost:8893/api/webrtc-calls/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    },
    body: JSON.stringify({ callId: callId.value })
  }).catch(err => console.warn('⚠️ 接听API失败（后台）:', err))

  // 立即进入通话页，尽快加入房间并监听信令
  if (callType.value === 'video') {
    router.push({
      name: 'VideoCall',
      params: { id: callerId.value },
      query: {
        callId: callId.value,
        status: 'connecting',
        name: callerInfo.value.name,
        avatar: callerInfo.value.avatar
      }
    })
  } else {
    router.push({
      name: 'VoiceCall',
      params: { id: callerId.value },
      query: {
        callId: callId.value,
        status: 'connecting',
        name: callerInfo.value.name,
        avatar: callerInfo.value.avatar
      }
    })
  }
}

// 拒绝通话
const rejectCall = async () => {
  try {
    console.log('📞 拒绝通话:', { callId: callId.value })

    // 调用后端API拒绝通话
    const response = await fetch('http://localhost:8893/api/webrtc-calls/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        callId: callId.value
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('✅ 通话拒绝成功')
        appStore.showToast('已拒绝通话', 'info')
      }
    }

    // 无论API调用是否成功，都返回上一页
    router.back()
  } catch (error) {
    console.error('❌ 拒绝通话失败:', error)
    appStore.showToast('已拒绝通话', 'info')
    router.back()
  }
}

// 页面加载时的初始化
onMounted(() => {
  console.log('📞 来电页面已加载:', {
    callId: callId.value,
    callerId: callerId.value,
    callType: callType.value,
    callerName: callerInfo.value.name
  })
})
</script>

<style scoped>
.incoming-call-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 60px 20px 40px;
  z-index: 9999;
  overflow: hidden;
}

.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  backdrop-filter: blur(20px);
}

/* 来电用户信息 */
.caller-info {
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
  z-index: 1;
}

.caller-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 12px;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.caller-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.call-status {
  font-size: 14px;
  opacity: 0.8;
}

/* 底部控制按钮 */
.call-controls {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 80px;
  z-index: 1;
}

.control-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.reject-btn {
  background: rgba(255, 59, 48, 0.8);
}

.reject-btn:hover {
  background: rgba(255, 59, 48, 1);
  transform: scale(1.05);
}

.accept-btn {
  background: rgba(52, 199, 89, 0.8);
}

.accept-btn:hover {
  background: rgba(52, 199, 89, 1);
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .call-controls {
    padding: 0 60px;
  }
  
  .control-btn {
    width: 56px;
    height: 56px;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>

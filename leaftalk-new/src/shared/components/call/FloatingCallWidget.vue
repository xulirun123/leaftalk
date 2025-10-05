<template>
  <div
    v-if="visible"
    class="floating-call-widget"
    @click.stop="restoreCall"
    :title="tooltip"
  >
    <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" class="avatar" />
    <div v-else class="icon">
      <!-- simple phone icon -->
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h2.49a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.01l-2.2 2.2z" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { callManager } from '../../../modules/call/services/CallManager'
import { getRealAvatarUrl } from '../../utils/avatar'

const router = useRouter()

const status = computed(() => callManager.callStatus.value)
const isMini = computed(() => callManager.isMini.value)
const currentCall = computed(() => callManager.currentCall.value)

const visible = computed(() => {
  const s = status.value
  return isMini.value && (s === 'calling' || s === 'ringing' || s === 'connecting' || s === 'connected')
})

const peerInfo = computed(() => {
  const cc: any = currentCall.value
  if (!cc) return null
  // 优先显示对端的用户信息
  return cc.targetUserInfo || cc.fromUserInfo || null
})

const avatarUrl = computed(() => {
  const p: any = peerInfo.value
  const id = p?.id
  const raw = p?.avatar
  return id ? getRealAvatarUrl(String(id)) : (raw || '')
})

const tooltip = computed(() => {
  switch (status.value) {
    case 'calling':
    case 'ringing':
      return '正在呼叫，点击返回通话'
    case 'connecting':
    case 'connected':
      return '通话中，点击返回通话'
    default:
      return '返回通话'
  }
})

const restoreCall = () => {
  callManager.setMini(false)
  router.push({ path: '/call', query: { action: 'active' } })
}
</script>

<style scoped>
.floating-call-widget {
  position: fixed;
  right: 16px;
  top: 100px;
  width: 70px;
  height: 70px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  background: #0a0a0a;
  overflow: hidden;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 0;
}
.icon { color: #fff; display: flex; align-items: center; justify-content: center; }
</style>


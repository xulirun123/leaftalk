<template>
  <div class="page">
    <div class="body">
      <!-- 群头像 -->
      <div class="group-avatar-container">
        <img :src="groupAvatar" :alt="groupName" class="group-avatar" />
      </div>

      <!-- 群名称 -->
      <div class="group-name">{{ groupName }}</div>

      <!-- 二维码或提示文字 -->
      <div v-if="!requireApproval" class="qrcode-section">
        <div v-if="qrcodeUrl" class="qrcode-wrapper">
          <img :src="qrcodeUrl" :alt="groupName" class="qrcode-image" />
        </div>
        <div v-else class="qrcode-loading">
          <div class="loading-spinner"></div>
          <p>加载二维码中...</p>
        </div>
      </div>

      <!-- 二维码说明文本 -->
      <div v-if="!requireApproval && qrcodeUrl" class="qrcode-notice">
        该二维码7天内（{{ expiryDateText }}）有效，重新进入将更新
      </div>

      <div v-else-if="requireApproval" class="approval-notice">
        <iconify-icon icon="heroicons:shield-check" width="48" style="color: #999;"></iconify-icon>
        <p class="notice-text">该群已开启群聊验证，只能通过群聊邀请进群</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const qrcodeUrl = ref('')
const groupName = ref('')
const groupAvatar = ref('')
const requireApproval = ref(false)
const expiryDateText = ref('')

const loadGroupInfo = async () => {
  try {
    const groupId = route.params.groupId as string
    console.log('🔍 加载群组信息，groupId:', groupId)

    // 获取群组信息
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        groupName.value = result.data.name || '群聊'
        groupAvatar.value = result.data.avatar || 'https://via.placeholder.com/56'
        requireApproval.value = result.data.require_approval || false

        // 检查是否有群备注，优先显示备注名
        try {
          const savedRemark = localStorage.getItem(`group_remark_${groupId}`)
          if (savedRemark && savedRemark.trim()) {
            groupName.value = savedRemark.trim()
            console.log('✅ 使用群备注名称:', groupName.value)
          }
        } catch (e) {
          console.warn('读取群备注失败:', e)
        }

        console.log('✅ 群组信息加载成功:', { groupName: groupName.value, requireApproval: requireApproval.value })
      }
    }

    // 如果不需要审批，加载二维码
    if (!requireApproval.value) {
      await loadQRCode(groupId)
    }
  } catch (error) {
    console.error('❌ 加载群组信息失败:', error)
  }
}

const loadQRCode = async (groupId: string) => {
  try {
    // 从后端获取二维码
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/qrcode`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        qrcodeUrl.value = result.data.qr_code_url || result.data.qrcodeUrl

        // 格式化过期时间
        if (result.data.expires_at) {
          const expiryDate = new Date(result.data.expires_at)
          const month = expiryDate.getMonth() + 1
          const day = expiryDate.getDate()
          const hours = expiryDate.getHours().toString().padStart(2, '0')
          const minutes = expiryDate.getMinutes().toString().padStart(2, '0')
          expiryDateText.value = `${month}月${day}日 ${hours}:${minutes}`
        }

        console.log('✅ 群二维码加载成功')
      }
    } else {
      console.warn('⚠️ 获取二维码失败，生成默认二维码')
      // 生成默认二维码
      const qrSize = Math.floor(window.innerWidth - 116)
      qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(`leaftalk://group/${groupId}`)}`
    }
  } catch (error) {
    console.error('❌ 加载二维码失败:', error)
    // 生成默认二维码
    const qrSize = Math.floor(window.innerWidth - 116)
    qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(`leaftalk://group/${groupId}`)}`
  }
}

onMounted(() => {
  loadGroupInfo()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px; /* 距离顶部导航栏100px */
}

/* 群头像容器 */
.group-avatar-container {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}

.group-avatar {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

/* 群名称 */
.group-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
  padding: 0 16px;
}

/* 二维码区域 */
.qrcode-section {
  width: calc(100vw - 116px);
  height: calc(100vw - 116px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.qrcode-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E5E5;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 二维码说明文本 */
.qrcode-notice {
  font-size: 10px;
  color: #999;
  text-align: center;
  line-height: 1.5;
  padding: 0 16px;
}

/* 审批提示区域 */
.approval-notice {
  width: calc(100vw - 116px);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: white;
  border-radius: 8px;
  padding: 32px 16px;
}

.notice-text {
  font-size: 14px;
  color: #999;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}
</style>


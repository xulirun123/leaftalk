<template>
  <div class="group-invite-card" :class="{ 'is-inviter': isInviter }" @click.stop="handleCardClick">
    <div class="card-header">
      <iconify-icon icon="heroicons-outline:user-group" width="20" class="header-icon"></iconify-icon>
      <span class="header-text">群聊邀请</span>
    </div>

    <div class="card-body">
      <div class="group-avatar">
        <img
          v-if="inviteData.groupAvatar"
          :src="inviteData.groupAvatar"
          alt="群头像"
          @error="handleImageError"
        />
        <div v-else class="default-avatar">
          <iconify-icon icon="heroicons-outline:user-group" width="32"></iconify-icon>
        </div>
      </div>

      <div class="group-info">
        <div class="group-name">{{ inviteData.groupName }}</div>
        <div class="group-meta">
          <span v-if="isInviter" class="inviter">你邀请{{ inviteData.inviteeName || '好友' }}加入群聊</span>
          <span v-else class="inviter">{{ inviteData.inviterName }}邀请你加入</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <!-- 邀请方：点击查看 -->
      <template v-if="isInviter">
        <div class="footer-text">点击查看</div>
        <iconify-icon icon="heroicons-outline:chevron-right" width="16" class="footer-icon"></iconify-icon>
      </template>
      <!-- 被邀请方：根据状态显示不同内容 -->
      <template v-else>
        <template v-if="cardStatus === 'pending'">
          <div class="footer-text">加入群聊</div>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" class="footer-icon"></iconify-icon>
        </template>
        <template v-else-if="cardStatus === 'joined'">
          <iconify-icon icon="heroicons-outline:check-circle" width="16" class="status-icon joined"></iconify-icon>
          <div class="footer-text joined">已加入</div>
        </template>
        <template v-else-if="cardStatus === 'waiting'">
          <iconify-icon icon="heroicons-outline:clock" width="16" class="status-icon waiting"></iconify-icon>
          <div class="footer-text waiting">等待审核</div>
        </template>
        <template v-else-if="cardStatus === 'approved'">
          <div class="footer-text">进入群聊</div>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" class="footer-icon"></iconify-icon>
        </template>
        <template v-else-if="cardStatus === 'rejected'">
          <iconify-icon icon="heroicons-outline:x-circle" width="16" class="status-icon rejected"></iconify-icon>
          <div class="footer-text rejected">申请被拒</div>
        </template>
      </template>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showDialog" class="confirm-overlay" @click.self="closeDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-message">
          <div class="message-text">申请加入「{{ inviteData.groupName }}」</div>
          <textarea
            v-model="joinReason"
            class="reason-input"
            :placeholder="defaultJoinReason"
            maxlength="100"
            rows="3"
          ></textarea>
        </div>
        <div class="confirm-buttons">
          <button class="confirm-btn cancel" @click.stop="closeDialog">取消</button>
          <button class="confirm-btn confirm" @click.stop="confirmJoin">申请</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import { useChatStore } from '@/modules/chat/stores/chatStore'

interface GroupInviteData {
  type: 'group_invite'
  groupId: string
  groupName: string
  groupAvatar?: string
  memberCount: number
  inviteCode: string
  inviterName: string
  inviterId: number | string
  inviteeName?: string
  inviteeId?: number | string
}

interface Props {
  content: string | GroupInviteData
  senderId: string | number
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const chatStore = useChatStore()
const socket = inject<any>('socket', null)

// 状态：pending(待处理), joined(已加入), waiting(等待审核), approved(审核通过), rejected(审核被拒)
const cardStatus = ref<'pending' | 'joined' | 'waiting' | 'approved' | 'rejected'>('pending')
const showDialog = ref(false)
const inviteeName = ref('好友')
const joinReason = ref('')
const needApprovalForJoin = ref(false)

// 默认申请理由
const defaultJoinReason = computed(() => {
  const userName = authStore.user?.nickname || authStore.user?.username || '我'
  return `${userName}申请加入群聊`
})

// 解析邀请数据
const inviteData = computed<GroupInviteData>(() => {
  if (typeof props.content === 'string') {
    try {
      return JSON.parse(props.content)
    } catch (e) {
      console.error('解析群邀请数据失败:', e)
      return {
        type: 'group_invite',
        groupId: '',
        groupName: '未知群聊',
        memberCount: 0,
        inviteCode: '',
        inviterName: '未知',
        inviterId: 0
      }
    }
  }
  return props.content
})

// 判断当前用户是否为邀请方
const isInviter = computed(() => {
  const currentUserId = String(authStore.user?.id || '')
  const inviterId = String(inviteData.value.inviterId || '')
  return currentUserId === inviterId
})

// 处理图片加载错误
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

// 点击卡片
const handleCardClick = async () => {
  console.log('🎯 点击邀请卡片', {
    isInviter: isInviter.value,
    cardStatus: cardStatus.value,
    currentUserId: authStore.user?.id,
    inviterId: inviteData.value.inviterId,
    showDialog: showDialog.value
  })

  // 邀请方点击：直接进入群聊
  if (isInviter.value) {
    console.log('👤 邀请方点击，进入群聊')
    const groupId = inviteData.value.groupId.replace(/^group_/, '')
    router.push(`/chat/group_${groupId}`)
    return
  }

  // 被邀请方点击：先检查是否已经是群成员
  console.log('👥 被邀请方点击，检查成员状态...')

  try {
    const groupId = inviteData.value.groupId.replace(/^group_/, '')
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/check-membership`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    console.log('🔍 成员检查结果:', result)

    if (result.success && result.isMember) {
      // 已经是群成员，直接进入群聊
      console.log('✅ 已是群成员，直接进入群聊')
      cardStatus.value = 'joined'
      router.push(`/chat/group_${groupId}`)
      return
    }
  } catch (error) {
    console.error('❌ 检查成员状态失败:', error)
  }

  // 不是群成员，根据状态处理
  console.log('👥 不是群成员，状态:', cardStatus.value)

  if (cardStatus.value === 'joined') {
    // 已加入：直接进入群聊
    console.log('✅ 已是群成员，直接进入群聊')
    const groupId = inviteData.value.groupId.replace(/^group_/, '')
    router.push(`/chat/group_${groupId}`)
  } else if (cardStatus.value === 'pending') {
    // 待处理：弹出确认对话框
    console.log('✅ 不是群成员，弹出确认对话框')
    // 设置默认申请理由
    joinReason.value = defaultJoinReason.value
    // 检查是否需要审核
    await checkIfNeedApproval()
    showDialog.value = true
  } else if (cardStatus.value === 'approved') {
    // 审核通过：进入群聊
    console.log('✅ 审核通过，进入群聊')
    const groupId = inviteData.value.groupId.replace(/^group_/, '')
    router.push(`/chat/group_${groupId}`)
  } else if (cardStatus.value === 'waiting') {
    // 等待审核：提示
    console.log('⏳ 等待审核')
    appStore.showToast('申请正在审核中，请耐心等待', 'info')
  } else if (cardStatus.value === 'rejected') {
    // 被拒绝：提示
    console.log('❌ 申请被拒')
    appStore.showToast('申请被拒，无法加入群聊', 'error')
  } else {
    console.warn('⚠️ 未知状态:', cardStatus.value)
  }
}

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false
  joinReason.value = ''
}

// 检查是否需要审核
const checkIfNeedApproval = async () => {
  try {
    // 获取邀请链接信息
    const response = await fetch(`http://localhost:8893/api/groups/invite-link-info?inviteCode=${inviteData.value.inviteCode}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const inviteLinks = await response.json()

    if (inviteLinks.success && inviteLinks.data) {
      const { isInviterAdmin, requireApproval } = inviteLinks.data
      // 判断是否需要审核：邀请人是普通成员 + 群需要审核
      needApprovalForJoin.value = !isInviterAdmin && requireApproval
      console.log('🔍 是否需要审核:', needApprovalForJoin.value, { isInviterAdmin, requireApproval })
    } else if (response.status === 404) {
      // 邀请码不存在，可能已过期
      console.warn('⚠️ 邀请码不存在或已过期')
      needApprovalForJoin.value = false
    }
  } catch (error) {
    console.error('❌ 检查审核状态失败:', error)
    needApprovalForJoin.value = false
  }
}

// 确认加入
const confirmJoin = async () => {
  try {
    console.log('🔑 确认加入群聊，邀请码:', inviteData.value.inviteCode)
    console.log('📝 申请理由:', joinReason.value)

    showDialog.value = false
    appStore.showToast('正在提交申请...', 'info')

    const response = await fetch('http://localhost:8893/api/groups/join-by-invite', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inviteCode: inviteData.value.inviteCode,
        reason: joinReason.value || defaultJoinReason.value
      })
    })

    const result = await response.json()
    console.log('📡 加入群聊响应:', result)

    if (result.success) {
      if (result.requireApproval) {
        // 需要审核
        cardStatus.value = 'waiting'
        appStore.showToast('申请已提交，等待群主/管理员审核', 'success')
      } else {
        // 直接加入成功
        cardStatus.value = 'joined'
        appStore.showToast('已成功加入群聊', 'success')

        // 添加群聊会话到聊天列表
        const groupId = inviteData.value.groupId.replace('group_', '')
        const sessionId = `group_${groupId}`

        const groupSession = {
          id: sessionId,
          participants: [authStore.user?.id || ''],
          name: inviteData.value.groupName,
          avatar: inviteData.value.groupAvatar || '',
          lastMessage: '你已加入群聊',
          lastMessageTime: Date.now(),
          unreadCount: 0,
          type: 'group' as const,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        chatStore.addSession(groupSession)

        // 跳转到群聊页面
        setTimeout(() => {
          router.push(`/chat/${sessionId}`)
        }, 1500)
      }
    } else {
      // 检查是否是"已经是群成员"的错误
      if (result.error && result.error.includes('已经是群成员')) {
        console.log('✅ 用户已是群成员，更新状态并进入群聊')
        cardStatus.value = 'joined'

        // 添加群聊会话到聊天列表
        const groupId = inviteData.value.groupId.replace('group_', '')
        const sessionId = `group_${groupId}`

        const groupSession = {
          id: sessionId,
          participants: [authStore.user?.id || ''],
          name: inviteData.value.groupName,
          avatar: inviteData.value.groupAvatar || '',
          lastMessage: '',
          lastMessageTime: Date.now(),
          unreadCount: 0,
          type: 'group' as const,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        chatStore.addSession(groupSession)

        // 直接进入群聊
        router.push(`/chat/${sessionId}`)
      } else {
        appStore.showToast(result.error || '加入失败', 'error')
      }
    }
  } catch (error) {
    console.error('❌ 加入群聊失败:', error)
    appStore.showToast('加入失败，请稍后重试', 'error')
  }
}

// WebSocket 事件处理
const handleGroupJoinApproved = (data: any) => {
  console.log('✅ 收到群聊加入审核通过通知:', data)
  if (data.groupId === inviteData.value.groupId) {
    cardStatus.value = 'approved'
    appStore.showToast('群聊申请已通过', 'success')
  }
}

const handleGroupJoinRejected = (data: any) => {
  console.log('❌ 收到群聊加入审核拒绝通知:', data)
  if (data.groupId === inviteData.value.groupId) {
    cardStatus.value = 'rejected'
    appStore.showToast('群聊申请被拒绝', 'error')
  }
}

// 检查初始状态
onMounted(async () => {
  console.log('📋 GroupInviteCard 初始化', {
    currentUserId: authStore.user?.id,
    inviterId: inviteData.value.inviterId,
    groupId: inviteData.value.groupId,
    inviteCode: inviteData.value.inviteCode
  })

  // 注册 WebSocket 事件
  if (socket) {
    socket.on('group_join_approved', handleGroupJoinApproved)
    socket.on('group_join_rejected', handleGroupJoinRejected)
  }

  // 邀请方：获取被邀请人名称
  if (isInviter.value) {
    console.log('👤 当前用户是邀请方')
    const inviteeId = inviteData.value.inviteeId
    if (inviteeId) {
      try {
        const response = await fetch(`http://localhost:8893/api/users/${inviteeId}`, {
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            inviteeName.value = result.data.nickname || result.data.username || '好友'
          }
        }
      } catch (error) {
        console.error('获取被邀请人信息失败:', error)
      }
    }
    return
  }

  // 被邀请方：检查状态
  console.log('👥 当前用户是被邀请方，检查状态')

  try {
    // 1. 检查是否已是群成员
    const memberResponse = await fetch(`http://localhost:8893/api/groups/${inviteData.value.groupId}/members`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (memberResponse.ok) {
      const memberResult = await memberResponse.json()
      if (memberResult.success) {
        const isMember = memberResult.data.some((m: any) => m.user_id === authStore.user?.id)
        console.log('🔍 群成员检查:', isMember ? '已是成员' : '不是成员')
        
        if (isMember) {
          cardStatus.value = 'joined'
          console.log('✅ 状态设置为: joined')
          return
        }
      }
    }

    // 2. 检查申请状态
    const requestResponse = await fetch(`http://localhost:8893/api/groups/${inviteData.value.groupId}/join-requests/my-status`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (requestResponse.ok) {
      const requestResult = await requestResponse.json()
      if (requestResult.success && requestResult.data) {
        const status = requestResult.data.status
        console.log('📋 申请状态:', status)

        if (status === 'pending') {
          cardStatus.value = 'waiting'
          console.log('✅ 状态设置为: waiting')
        } else if (status === 'approved') {
          // 申请已批准，但用户不是群成员，说明后端没有正确处理
          // 这种情况下，应该显示为待处理，让用户重新点击加入
          // console.warn('⚠️ 申请已批准但用户不是群成员，重置为 pending')
          cardStatus.value = 'pending'
        } else if (status === 'rejected') {
          cardStatus.value = 'rejected'
          console.log('✅ 状态设置为: rejected')
        }
      }
    }

    console.log('🎯 最终状态:', cardStatus.value)
  } catch (error) {
    console.error('❌ 检查状态失败:', error)
  }
})

// 清理
onUnmounted(() => {
  if (socket) {
    socket.off('group_join_approved', handleGroupJoinApproved)
    socket.off('group_join_rejected', handleGroupJoinRejected)
  }
})
</script>

<style scoped>
.group-invite-card {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #576b95;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 280px;
}

.group-invite-card.is-inviter {
  border-color: #07c160;
}

.group-invite-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 25px;
  color: #576b95;
  font-size: 13px;
  margin-bottom: 0;
}

.header-icon {
  color: #576b95;
}

.header-text {
  font-weight: 500;
}

.card-body {
  display: flex;
  gap: 12px;
  height: 48px;
  align-items: center;
}

.group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.default-avatar iconify-icon {
  width: 24px;
  height: 24px;
}

.group-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.group-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.group-meta {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
}

.divider {
  color: #ddd;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 25px;
  gap: 4px;
  padding-right: 4px;
}

.footer-text {
  font-size: 13px;
  color: #576b95;
  line-height: 1;
}

.footer-icon {
  color: #576b95;
  flex-shrink: 0;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon.joined,
.footer-text.joined {
  color: #07c160;
}

.status-icon.waiting,
.footer-text.waiting {
  color: #fa9d3b;
}

.status-icon.rejected,
.footer-text.rejected {
  color: #fa5151;
}

/* 确认对话框 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  width: 280px;
  overflow: hidden;
}

.confirm-title {
  font-size: 17px;
  font-weight: 500;
  color: #333;
  text-align: center;
  padding: 20px 20px 12px;
}

.confirm-message {
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 0 20px 20px;
  line-height: 1.5;
}

.message-text {
  margin-bottom: 12px;
}

.reason-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  resize: none;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.reason-input:focus {
  border-color: #576b95;
}

.confirm-buttons {
  display: flex;
  border-top: 1px solid #e5e5e5;
}

.confirm-btn {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:active {
  background: #f0f0f0;
}

.confirm-btn.cancel {
  color: #666;
  border-right: 1px solid #e5e5e5;
}

.confirm-btn.confirm {
  color: #576b95;
  font-weight: 500;
}
</style>


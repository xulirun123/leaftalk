<template>
  <div class="group-info">
    <!-- 内容区域 -->
    <div class="group-info-content">
      <!-- 群成员头像区域 - 最多4排，每排5个 - 仅群成员可见 -->
      <div v-if="isGroupMember" class="members-section">
        <div class="members-grid">
          <!-- 显示的群成员头像 -->
          <div
            v-for="member in displayedAvatars"
            :key="member.id"
            class="member-avatar-item"
            @click="viewMemberProfile(member)"
          >
            <div class="avatar-wrapper">
              <img
                :src="member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`"
                :alt="member.name"
                class="member-avatar"
              />
            </div>
            <div class="member-nickname">{{ getDisplayName(member.id, groupInfo.id, member.name, true) }}</div>
          </div>

          <!-- 添加成员按钮 - 始终显示 -->
          <div class="member-avatar-item add-member-btn" @click="inviteMembers">
            <div class="avatar-wrapper">
              <div class="add-icon">
                <iconify-icon icon="heroicons-outline:plus" width="24" style="color: #666;"></iconify-icon>
              </div>
            </div>
            <div class="member-nickname">邀请</div>
          </div>

          <!-- 移除群人员按钮 - 仅群主和管理员可见 -->
          <div v-if="canManageMembers" class="member-avatar-item remove-member-btn" @click="removeMemberMode">
            <div class="avatar-wrapper">
              <div class="remove-icon">
                <iconify-icon icon="heroicons-outline:minus" width="24" style="color: #666;"></iconify-icon>
              </div>
            </div>
            <div class="member-nickname remove-text">移除</div>
          </div>


        </div>

        <!-- 查看更多按钮 - 当成员数超过限制时显示 -->
        <div v-if="showViewMoreButton" class="view-more-btn" @click="viewAllMembers">
          <span>查看更多群人员</span>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 功能列表 -->
      <div v-if="isGroupMember" class="settings-section">
        <!-- 群聊名称 -->
        <div
          class="setting-item"
          :class="{ 'disabled-item': !canEditGroupName }"
          @click="canEditGroupName ? editGroupName() : null"
        >
          <span class="setting-label">群聊名称</span>
          <div class="setting-right">
            <span class="setting-value">{{ groupInfo.name }}</span>
            <iconify-icon
              v-if="canEditGroupName"
              icon="heroicons-outline:chevron-right"
              width="16"
              style="color: #999;"
            ></iconify-icon>
          </div>
        </div>
      </div>

      <div v-if="isGroupMember" class="settings-section">
        <!-- 群公告 - 所有成员都可以查看 -->
        <div
          class="setting-item announcement-item"
          :class="{ 'has-content': announcement?.content }"
          @click="viewGroupAnnouncement()"
        >
          <span class="setting-label">群公告</span>
          <div class="setting-right">
            <span v-if="!announcement?.content" class="announcement-empty">未设置</span>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>

        <!-- 群公告内容（有内容时显示在下方） -->
        <div v-if="announcement?.content" class="announcement-content-row">
          <div class="announcement-content">{{ announcement.content }}</div>
        </div>

        <!-- 群管理 - 群主和管理员可见 -->
        <div v-if="isGroupOwner || currentUserRole === 'admin'" class="setting-item" @click="manageGroup">
          <span class="setting-label">群管理</span>
          <div class="setting-right">
            <!-- 申请人头像列表 -->
            <div v-if="pendingRequestAvatars.length > 0" class="request-avatars">
              <img
                v-for="(avatar, index) in pendingRequestAvatars"
                :key="index"
                :src="avatar"
                class="request-avatar"
                :style="{ zIndex: pendingRequestAvatars.length - index }"
              />
            </div>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>

        <!-- 邀请申请 - 仅群主和管理员可见，且群聊邀请确认已开启 -->
        <div v-if="(isGroupOwner || currentUserRole === 'admin') && groupSettings.requireApproval" class="setting-item" @click="viewInviteRequests">
          <span class="setting-label">邀请申请</span>
          <div class="setting-right">
            <!-- 申请人头像列表 -->
            <div v-if="pendingApplicantAvatars.length > 0" class="applicant-avatars">
              <img
                v-for="(avatar, index) in pendingApplicantAvatars"
                :key="index"
                :src="avatar"
                class="applicant-avatar"
                :style="{ zIndex: pendingApplicantAvatars.length - index }"
              />
            </div>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>

        <!-- 群二维码 -->
        <div class="setting-item qrcode-item" @click="showGroupQRCode">
          <span class="setting-label">群二维码</span>
          <div class="qrcode-right">
            <iconify-icon icon="heroicons-outline:qr-code" width="20" style="color: #666; margin-right: 8px;"></iconify-icon>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>

        <!-- 备注 -->
        <div class="setting-item" @click="editGroupRemark">
          <span class="setting-label">备注</span>
          <div class="setting-value-container">
            <span class="setting-value">{{ groupRemark || '未设置' }}</span>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <!-- 查找聊天内容 -->
        <div class="setting-item" @click="searchChatContent">
          <span class="setting-label">查找聊天内容</span>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <div class="settings-section">
        <!-- 消息免打扰 -->
        <div class="setting-item">
          <span class="setting-label">消息免打扰</span>
          <div class="setting-toggle" :class="{ active: isMuted }" @click="toggleMute">
            <div class="toggle-thumb"></div>
          </div>
        </div>

        <!-- 置顶聊天 -->
        <div class="setting-item">
          <span class="setting-label">置顶聊天</span>
          <div class="setting-toggle" :class="{ active: isPinned }" @click="togglePin">
            <div class="toggle-thumb"></div>
          </div>
        </div>

        <!-- 保存到通讯录 -->
        <div class="setting-item">
          <span class="setting-label">保存到通讯录</span>
          <div class="setting-toggle" :class="{ active: isSavedToContacts }" @click="toggleSaveToContacts">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <!-- 我在本群的昵称 -->
        <div class="setting-item" @click="editMyNickname">
          <span class="setting-label">我在本群的昵称</span>
          <div class="setting-right">
            <span class="setting-value">{{ myNickname || '未设置' }}</span>
            <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <!-- 设置当前聊天背景 -->
        <div class="setting-item" @click="setChatBackground">
          <span class="setting-label">设置当前聊天背景</span>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <div class="settings-section">
        <!-- 删除聊天记录 -->
        <div class="setting-item" @click="deleteChatHistory">
          <span class="setting-label">删除聊天记录</span>
          <iconify-icon icon="heroicons-outline:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 退出群聊 -->
      <div class="settings-section">
        <div class="setting-item danger-item" @click="showLeaveGroupDialog">
          <span class="setting-label danger-text">退出群聊</span>
        </div>
      </div>
    </div>

    <!-- 删除聊天记录确认对话框 -->
    <ConfirmDialog
      ref="deleteChatDialogRef"
      message="确定要删除聊天记录吗？删除后无法恢复。"
      confirm-text="删除"
      @confirm="handleDeleteChatConfirm"
      @cancel="() => {}"
    />

    <!-- 退出群聊确认对话框 -->
    <ConfirmDialog
      ref="leaveGroupDialogRef"
      message="退出后不会再接收此群聊消息，确定要退出群聊吗？"
      confirm-text="退出"
      @confirm="handleLeaveGroupConfirm"
      @cancel="() => {}"
    />

    <!-- 删除群聊确认对话框 -->
    <ConfirmDialog
      ref="deleteGroupDialogRef"
      message="删除群聊后，所有成员都将无法访问此群聊，确定要删除吗？"
      confirm-text="删除"
      @confirm="handleDeleteGroupConfirm"
      @cancel="() => {}"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '../stores/chatStore'
import { useGroupPermissionsStore } from '../stores/groupPermissions'
import { getDisplayName } from '@/modules/chat/utils/groupNicknameManager'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const stableGroupId = ref<string>(route.params.id as string)

const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const groupPerms = useGroupPermissionsStore()

// 当前用户角色（从后端获取）
const currentUserRole = ref<'owner' | 'creator' | 'admin' | 'member'>('member')

// 群组信息
const groupInfo = ref({
  id: '',
  name: '',
  memberCount: 0,

  members: [] as any[],
  creatorId: null as string | number | null  // 群主ID
})

// 群组设置
const groupSettings = ref({
  onlyAdminCanRename: false,
  requireApproval: false  // 群聊邀请确认
})

// 待审核的邀请申请数量
const pendingInviteCount = ref(0)
// 待审核的申请人头像列表（最多5个）
const pendingApplicantAvatars = ref<string[]>([])

// 计算属性：最多显示5个申请人头像
const pendingRequestAvatars = computed(() => {
  return pendingApplicantAvatars.value.slice(0, 5)
})

// 个人设置
const isMuted = ref(false)
const isPinned = ref(false)
const isSavedToContacts = ref(false) // 默认不保存到通讯录
const myNickname = ref('')
const groupRemark = ref('') // 群备注

// 计算是否可以编辑群名称（优先使用全局权限存储）
const canEditGroupName = computed(() => {
  const gid = stableGroupId.value || (route.params.id as string)
  const s = groupPerms.getSettings(gid)
  const onlyAdmin = s?.onlyAdminCanRename ?? groupSettings.value.onlyAdminCanRename
  if (!onlyAdmin) return true
  return currentUserRole.value !== 'member'
})


// 群公告
const announcement = ref<any>(null)

// 群二维码
const groupQRCode = ref<string>('')

// 对话框引用
const deleteChatDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)
const leaveGroupDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)
const deleteGroupDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)

// 用户是否是群成员
const isGroupMember = ref(true)

// 加载群组信息
const loadGroupInfo = async () => {
  try {
    const groupId = route.params.id as string
    if (!groupId) {
      console.error('❌ 无法获取群组ID')
      return
    }

    console.log('🔍 加载群组信息，群组ID:', groupId)

    // 1️⃣ 先尝试从本地存储获取群聊信息
    let groupData = null
    let membersData = []

    // 从 chatStore 的 sessions 中查找
    const chatSession = chatStore.sessions?.find((s: any) => s.id === groupId)
    if (chatSession) {
      console.log('✅ 从 chatStore 找到群聊信息:', chatSession)
      groupData = chatSession
      // 注意：不再从 participants 构建成员列表，因为这个列表可能是旧的
      // 我们将从后端获取最新的成员列表
    }

    // 总是从后端获取最新的成员列表（确保显示最新的成员状态）
    if (true) {  // 改为总是从后端获取
      console.log('📡 从本地存储未找到，尝试从后端获取...')

      try {
        // 获取群聊详情
        const groupResponse = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (groupResponse.ok) {
          const groupResult = await groupResponse.json()
          console.log('✅ 从后端获取群聊详情成功:', groupResult)
          groupData = groupResult.data
        } else {
          console.warn('⚠️ 后端返回404，使用本地数据')
        }
      } catch (error) {
        console.warn('⚠️ 从后端获取群聊详情失败:', error)
      }

      // 如果后端也没有，尝试从 localStorage 获取
      if (!groupData) {
        try {
          const localChats = JSON.parse(localStorage.getItem('leaftalk_chats') || '[]')
          const localChat = localChats.find((c: any) => c.id === groupId)
          if (localChat) {
            console.log('✅ 从 localStorage 找到群聊信息:', localChat)
            groupData = localChat

            // 从 participants 构建成员列表
            if (localChat.participants && Array.isArray(localChat.participants)) {
              membersData = localChat.participants.map((userId: string) => ({
                id: userId,
                name: '用户' + userId,
                groupNickname: '',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                role: userId === authStore.user?.id ? 'creator' : 'member'
              }))
              console.log('📋 从 localStorage 构建的成员列表:', membersData)
            }
          }
        } catch (error) {
          console.warn('⚠️ 从 localStorage 获取群聊信息失败:', error)
        }
      }
    }

    // 2️⃣ 从后端获取最新的成员列表
    try {
      const membersResponse = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (membersResponse.ok) {
        const membersResult = await membersResponse.json()
        console.log('✅ 从后端获取群成员成功:', membersResult)

        if (membersResult.success && membersResult.data) {
          membersData = membersResult.data.map((member: any) => {
            // 使用真实用户头像和昵称
            const userAvatar = member.avatar || member.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`
            const userNickname = member.nickname || member.user_nickname || member.username || '未知用户'

            // 处理角色字段（可能是 role, member_role, user_role 等）
            const memberRole = member.role || member.member_role || member.user_role || 'member'

            console.log('👤 成员信息:', {
              id: member.id,
              nickname: userNickname,
              avatar: userAvatar,
              role: memberRole,
              rawRole: member.role,
              allFields: Object.keys(member)
            })

            return {
              id: member.id,
              name: userNickname,
              groupNickname: member.group_nickname || '',
              avatar: userAvatar,
              role: memberRole
            }
          })
          console.log('✅ 成员列表已更新，共', membersData.length, '个成员')
        }
      } else {
        console.warn('⚠️ 后端返回错误状态:', membersResponse.status)
      }
    } catch (error) {
      console.warn('⚠️ 从后端获取群成员失败:', error)
      // 如果后端获取失败，尝试从 chatStore 的 participants 构建成员列表
      if (chatSession && chatSession.participants && Array.isArray(chatSession.participants)) {
        membersData = chatSession.participants.map((userId: string) => ({
          id: userId,
          name: '用户' + userId,
          groupNickname: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          role: userId === authStore.user?.id ? 'creator' : 'member'
        }))
        console.log('📋 从 chatStore 构建的备选成员列表:', membersData)
      }
    }

    // 3️⃣ 如果还是没有数据，显示错误
    if (!groupData) {
      console.error('❌ 无法获取群聊信息')
      appStore.showToast('无法加载群聊信息', 'error')
      return
    }

    // 3.5️⃣ 获取成员的真实用户信息（头像和昵称）
    if (membersData && membersData.length > 0) {
      try {
        console.log('🔄 获取成员的真实用户信息...')
        const userIds = membersData.map(m => m.id).join(',')
        const usersResponse = await fetch(`http://localhost:8893/api/users/batch?ids=${userIds}`, {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (usersResponse.ok) {
          const usersResult = await usersResponse.json()
          if (usersResult.success && usersResult.data) {
            const userMap = new Map(usersResult.data.map((u: any) => [String(u.id), u]))
            console.log('✅ 获取用户信息成功，用户数:', userMap.size)

            // 更新成员数据，使用真实的用户头像和昵称
            membersData = membersData.map((member: any) => {
              const userInfo = userMap.get(String(member.id))
              if (userInfo) {
                console.log('👤 更新成员信息:', {
                  id: member.id,
                  oldName: member.name,
                  newName: userInfo.nickname || userInfo.username,
                  avatar: userInfo.avatar
                })
                return {
                  ...member,
                  name: userInfo.nickname || userInfo.username || member.name,
                  avatar: userInfo.avatar || member.avatar
                }
              }
              return member
            })
          }
        }
      } catch (error) {
        console.warn('⚠️ 获取用户信息失败，使用本地数据:', error)
      }
    }

    // 4️⃣ 按角色排序：群主 > 管理员 > 普通成员
    const sortedMembers = membersData.sort((a: any, b: any) => {
      const roleOrder: any = {
        'creator': 1,
        'owner': 1,
        'admin': 2,
        'member': 3
      }
      return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3)
    })

    // 5️⃣ 更新 groupInfo
    groupInfo.value = {
      id: groupId,
      name: groupData?.name || '群聊',
      memberCount: sortedMembers.length,
      members: sortedMembers,
      creatorId: groupData?.creatorId || groupData?.creator_id || null
    }

    console.log('📋 群组详细信息:', {
      id: groupInfo.value.id,
      name: groupInfo.value.name,
      creatorId: groupInfo.value.creatorId,
      memberCount: groupInfo.value.memberCount
    })

    // 获取群二维码
    if (groupData?.qr_code_url) {
      groupQRCode.value = groupData.qr_code_url
      console.log('✅ 群二维码加载成功')
    }

    // 获取当前用户的角色
    const currentUserId = authStore.user?.id
    console.log('🔍 查找当前用户:', {
      currentUserId,
      sortedMembersCount: sortedMembers.length,
      sortedMembers: sortedMembers.map((m: any) => ({ id: m.id, name: m.name, role: m.role }))
    })

    const currentMember = sortedMembers.find((m: any) => String(m.id) === String(currentUserId))
    if (currentMember) {
      currentUserRole.value = currentMember.role || 'member'
      isGroupMember.value = true
      console.log('✅ 找到当前用户，设置为群成员:', {
        id: currentUserId,
        role: currentUserRole.value,
        name: currentMember.name
      })
    } else {
      // 用户不在群成员列表中 - 但仍然应该显示功能列表
      // 因为用户可能是通过其他方式加入的
      isGroupMember.value = true  // 改为 true，确保显示功能列表
      console.log('⚠️ 当前用户不在成员列表中，但仍然显示功能列表')
    }

    console.log('✅ 群组信息加载完成:', groupInfo.value)
    console.log('👤 当前用户角色:', currentUserRole.value)
    console.log('👤 是否是群成员:', isGroupMember.value)
    console.log('👑 是否是群主:', currentUserRole.value === 'owner' || currentUserRole.value === 'creator')

    // 加载群组设置
    await loadGroupSettings()

  } catch (error) {
    console.error('❌ 加载群组信息失败:', error)
    appStore.showToast('加载群组信息失败', 'error')
  }
}

// 加载群组设置
const loadGroupSettings = async () => {
  try {
    const groupId = route.params.id as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/settings`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        groupSettings.value.onlyAdminCanRename = result.data.only_admin_can_rename === 1 || result.data.only_admin_can_rename === true
        groupSettings.value.requireApproval = result.data.invite_confirm_enabled === 1 || result.data.invite_confirm_enabled === true || result.data.require_approval === 1 || result.data.require_approval === true
        console.log('✅ 群组设置加载成功:', groupSettings.value)
        // 同步到全局权限存储，便于其他页面实时读取
        try { groupPerms.setSettings(groupId, { onlyAdminCanRename: groupSettings.value.onlyAdminCanRename, requireApproval: groupSettings.value.requireApproval }) } catch {}

      }
    }

    // 加载免打扰状态（从localStorage）
    try {
      const savedMuteStatus = localStorage.getItem(`group_mute_${groupId}`)
      if (savedMuteStatus !== null) {
        isMuted.value = JSON.parse(savedMuteStatus)
        console.log('✅ 群聊免打扰状态已加载:', isMuted.value)
      }

      // 同步到unreadStore
      const { useUnreadStore } = await import('@/modules/chat/stores/unread')
      const unreadStore = useUnreadStore()
      unreadStore.setMuteStatus(groupId, isMuted.value)
    } catch (error) {
      console.warn('⚠️ 加载免打扰状态失败:', error)
    }

    // 加载置顶状态（从localStorage）
    try {
      const pinnedChats = JSON.parse(localStorage.getItem('pinned_chats') || '[]')
      isPinned.value = pinnedChats.includes(groupId)
      console.log('✅ 群聊置顶状态已加载:', isPinned.value)

      // 同步到chatStore
      const { useChatStore } = await import('@/modules/chat/stores/chatStore')
      const chatStore = useChatStore()
      const session = chatStore.sessions.find(s => s.id === groupId)
      if (session) {
        session.isPinned = isPinned.value
      }
    } catch (error) {
      console.warn('⚠️ 加载置顶状态失败:', error)
    }

    // 加载保存到通讯录状态（从localStorage）
    try {
      const savedGroups = JSON.parse(localStorage.getItem('saved_to_contacts_groups') || '[]')
      isSavedToContacts.value = savedGroups.includes(groupId)
      console.log('✅ 保存到通讯录状态已加载:', isSavedToContacts.value)
    } catch (error) {
      console.warn('⚠️ 加载保存到通讯录状态失败:', error)
    }

    // 加载我在本群的昵称（从localStorage）
    try {
      const savedNickname = localStorage.getItem(`group_nickname_${groupId}`)
      if (savedNickname) {
        myNickname.value = savedNickname
        console.log('✅ 群昵称已加载:', myNickname.value)
      }
    } catch (error) {
      console.warn('⚠️ 加载群昵称失败:', error)
    }

    // 加载群备注（从localStorage）
    try {
      const savedRemark = localStorage.getItem(`group_remark_${groupId}`)
      if (savedRemark) {
        groupRemark.value = savedRemark.trim()
        console.log('✅ 群备注已加载:', groupRemark.value)
      }
    } catch (error) {
      console.warn('⚠️ 加载群备注失败:', error)
    }
  } catch (error) {
    console.error('❌ 加载群组设置失败:', error)
  }
}

// 加载待审核的申请人头像
const loadPendingRequestAvatars = async () => {
  try {
    const groupId = route.params.id as string

    // 只有群主和管理员才加载
    if (!isGroupOwner.value && currentUserRole.value !== 'admin') {
      return
    }

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/invite-requests`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // 筛选出待处理的申请
        const pendingRequests = result.data.filter((req: any) => req.status === 'pending')

        // 获取最新的5个申请人头像
        pendingApplicantAvatars.value = pendingRequests
          .slice(0, 5)
          .map((req: any) => req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user_id}`)

        console.log('✅ 申请人头像已加载:', pendingApplicantAvatars.value.length)
      }
    }
  } catch (error) {
    console.error('❌ 加载申请人头像失败:', error)
  }
}

// 计算属性
// 是否是群主
const isGroupOwner = computed(() => {
  const currentUserId = authStore.user?.id

  // 方法1：通过角色判断
  if (currentUserRole.value === 'owner' || currentUserRole.value === 'creator') {
    return true
  }

  // 方法2：通过 creatorId 判断
  if (groupInfo.value.creatorId && String(groupInfo.value.creatorId) === String(currentUserId)) {
    console.log('✅ 通过 creatorId 判断为群主')
    return true
  }

  // 方法3：通过成员列表中的第一个成员判断（备选方案）
  if (groupInfo.value.members.length > 0) {
    const firstMember = groupInfo.value.members[0]
    if (String(firstMember.id) === String(currentUserId)) {
      console.log('✅ 通过第一个成员判断为群主')
      return true
    }
  }

  return false
})

// 是否可以管理成员（群主或管理员）
const canManageMembers = computed(() => {
  return isGroupOwner.value || currentUserRole.value === 'admin'
})

// 显示的头像（根据角色显示不同数量）
// 群主/管理员：最多18个成员 + 添加按钮 + 踢出按钮 = 20个位置
// 普通成员：最多19个成员 + 添加按钮 = 20个位置
const displayedAvatars = computed(() => {
  const maxAvatars = canManageMembers.value ? 18 : 19
  return groupInfo.value.members.slice(0, maxAvatars)
})

// 是否显示"查看更多"按钮
const showViewMoreButton = computed(() => {
  const maxAvatars = canManageMembers.value ? 18 : 19
  return groupInfo.value.memberCount > maxAvatars
})

// 方法
const viewMemberProfile = (member: any) => {
  console.log('查看成员资料:', member)
  // 跳转到用户详细资料页面
  router.push(`/friend-profile/${member.id}`)
}

const inviteMembers = () => {
  console.log('邀请成员')

  // 检查用户角色和群设置
  const isAdminOrOwner = currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
  const requireApproval = groupSettings.value.requireApproval

  // 如果群不需要审核，所有人都直接跳转到邀请好友页面
  if (!requireApproval) {
    router.push(`/invite-to-group/${groupInfo.value.id}`)
  } else {
    // 群需要审核时：
    // - 群主/管理员：直接跳转到邀请好友页面
    // - 普通成员：跳转到输入邀请理由页面
    if (isAdminOrOwner) {
      router.push(`/invite-to-group/${groupInfo.value.id}`)
    } else {
      router.push(`/invite-with-reason/${groupInfo.value.id}`)
    }
  }
}

const editGroupName = () => {
  console.log('修改群聊名称')

  // 检查是否只允许管理员修改群名称
  if (groupSettings.value.onlyAdminCanRename) {
    // 检查当前用户角色
    if (currentUserRole.value === 'member') {
      appStore.showToast('您不能修改群名称', 'error')
      return
    }
  }

  // 跳转到编辑群聊名称页面
  router.push(`/edit-group-name/${groupInfo.value.id}`)
}

const viewGroupAnnouncement = () => {
  console.log('查看群公告')
  router.push(`/group-announcement/${groupInfo.value.id}`)
}

// 加载群公告
const loadAnnouncement = async () => {
  try {
    const groupId = route.params.id as string
    console.log('🔍 开始加载群公告，群ID:', groupId)

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/announcement`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('🔍 群公告API响应:', result)

      if (result.success) {
        announcement.value = result.data
        console.log('✅ 群公告加载成功:', announcement.value)
        console.log('✅ 群公告内容:', announcement.value?.content)
      } else {
        console.log('⚠️ 群公告API返回失败')
      }
    } else {
      console.log('⚠️ 群公告API请求失败，状态码:', response.status)
    }
  } catch (error) {
    console.error('❌ 加载群公告失败:', error)
  }
}

const manageGroup = () => {
  console.log('群管理')

  // 验证是否是群主或管理员
  if (!isGroupOwner.value && currentUserRole.value !== 'admin') {
    appStore.showToast('只有群主或管理员可以管理群聊', 'error')
    return
  }

  // 跳转到群管理页面
  router.push(`/group-management/${groupInfo.value.id}`)
}

const viewInviteRequests = () => {
  console.log('查看邀请申请')
  router.push(`/group-invite-requests/${groupInfo.value.id}`)
}

const showGroupQRCode = () => {
  console.log('显示群二维码')
  router.push(`/group-qrcode/${groupInfo.value.id}`)
}

const removeMemberMode = () => {
  console.log('踢出成员模式')
  // 跳转到移除群成员页面
  router.push(`/remove-group-members/${groupInfo.value.id}`)
}

const viewAllMembers = () => {
  console.log('查看所有群成员')
  router.push(`/group-members/${groupInfo.value.id}`)
}

const editGroupRemark = () => {
  console.log('编辑群聊备注')
  // 跳转到备注群聊名称页面
  router.push(`/edit-group-remark/${groupInfo.value.id}`)
}

const searchChatContent = () => {
  console.log('🔍 跳转到搜索聊天记录页面（群聊）')
  const groupId = groupInfo.value.id

  console.log('🔍 跳转到搜索页面，groupId:', groupId)
  router.push(`/chat-search/${groupId}`)
}

const toggleMute = async () => {
  try {
    const groupId = groupInfo.value.id
    if (!groupId) return

    // 切换免打扰状态
    isMuted.value = !isMuted.value

    // 保存到unreadStore
    const { useUnreadStore } = await import('@/modules/chat/stores/unread')
    const unreadStore = useUnreadStore()
    unreadStore.setMuteStatus(groupId, isMuted.value)

    // 保存到localStorage（持久化）
    localStorage.setItem(`group_mute_${groupId}`, JSON.stringify(isMuted.value))

    console.log('🔕 群聊消息免打扰:', isMuted.value, 'groupId:', groupId)
    appStore.showToast(isMuted.value ? '已开启消息免打扰' : '已关闭消息免打扰', 'success')
  } catch (error) {
    console.error('❌ 设置免打扰失败:', error)
    // 回滚状态
    isMuted.value = !isMuted.value
  }
}

const togglePin = async () => {
  try {
    const groupId = route.params.id as string
    if (!groupId) return

    // 切换置顶状态
    isPinned.value = !isPinned.value

    // 更新chatStore中的会话状态
    const session = chatStore.sessions.find(s => s.id === groupId)
    if (session) {
      session.isPinned = isPinned.value
      // 保存到缓存
      chatStore.saveToCache()
      console.log('✅ 已更新会话置顶状态:', isPinned.value)
    }

    // 保存到localStorage
    try {
      const pinnedChats = JSON.parse(localStorage.getItem('pinned_chats') || '[]')
      if (isPinned.value) {
        // 添加到置顶列表
        if (!pinnedChats.includes(groupId)) {
          pinnedChats.push(groupId)
        }
      } else {
        // 从置顶列表移除
        const index = pinnedChats.indexOf(groupId)
        if (index > -1) {
          pinnedChats.splice(index, 1)
        }
      }
      localStorage.setItem('pinned_chats', JSON.stringify(pinnedChats))
      console.log('📌 置顶状态已保存:', groupId, isPinned.value)
    } catch (error) {
      console.error('❌ 保存置顶状态失败:', error)
    }

    appStore.showToast(isPinned.value ? '已置顶聊天' : '已取消置顶', 'success')
  } catch (error) {
    console.error('❌ 设置置顶失败:', error)
    // 回滚状态
    isPinned.value = !isPinned.value
  }
}

const toggleSaveToContacts = async () => {
  try {
    const groupId = route.params.id as string
    if (!groupId) return

    // 切换保存状态
    isSavedToContacts.value = !isSavedToContacts.value

    // 保存到localStorage
    try {
      const savedGroups = JSON.parse(localStorage.getItem('saved_to_contacts_groups') || '[]')
      if (isSavedToContacts.value) {
        // 添加到保存列表
        if (!savedGroups.includes(groupId)) {
          savedGroups.push(groupId)
        }
      } else {
        // 从保存列表移除
        const index = savedGroups.indexOf(groupId)
        if (index > -1) {
          savedGroups.splice(index, 1)
        }
      }
      localStorage.setItem('saved_to_contacts_groups', JSON.stringify(savedGroups))
      console.log('📇 保存到通讯录状态已保存:', groupId, isSavedToContacts.value)

      // 触发事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('saved-to-contacts-changed', {
        detail: { groupId, isSaved: isSavedToContacts.value }
      }))
      console.log('✅ 已触发saved-to-contacts-changed事件')
    } catch (error) {
      console.error('❌ 保存到通讯录状态失败:', error)
    }

    appStore.showToast(isSavedToContacts.value ? '已保存到通讯录' : '已从通讯录移除', 'success')
  } catch (error) {
    console.error('❌ 设置保存到通讯录失败:', error)
    // 回滚状态
    isSavedToContacts.value = !isSavedToContacts.value
  }
}

const editMyNickname = () => {
  console.log('编辑我在本群的昵称')
  // 跳转到编辑群昵称页面
  router.push(`/edit-group-nickname/${groupInfo.value.id}`)
}

const setChatBackground = () => {
  console.log('设置聊天背景')
  // 保存当前聊天ID到localStorage（用于背景设置页面获取）
  localStorage.setItem('yeyu_last_chat_id', groupInfo.value.id)
  // 跳转到聊天背景设置页面
  router.push('/settings/chat-background')
}

// 显示删除聊天记录对话框
const deleteChatHistory = () => {
  console.log('显示删除聊天记录对话框')
  deleteChatDialogRef.value?.show()
}

// 处理删除聊天记录确认
const handleDeleteChatConfirm = async () => {
  try {
    const groupId = route.params.id as string
    console.log('🗑️ 删除群聊记录:', groupId)

    // 使用chatStore的clearChatHistory方法清除聊天记录
    await chatStore.clearChatHistory(groupId)

    console.log('✅ 群聊记录已删除')
    appStore.showToast('聊天记录已删除', 'success')
  } catch (error) {
    console.error('❌ 删除聊天记录失败:', error)
    appStore.showToast('删除失败', 'error')
  }
}

// 显示删除群聊对话框
const showDeleteGroupDialog = () => {
  console.log('显示删除群聊对话框')
  deleteGroupDialogRef.value?.show()
}

// 处理删除群聊确认
const handleDeleteGroupConfirm = async () => {
  try {
    const groupId = route.params.id as string

    console.log('🗑️ 删除群聊:', groupId)

    // 调用后端API删除群聊
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('✅ 删除群聊成功')

        // 使用chatStore的deleteChatItem方法删除会话和消息
        await chatStore.deleteChatItem(groupId)

        appStore.showToast('群聊已删除', 'success')

        // 跳转到聊天列表
        router.push('/chat')
      } else {
        console.error('❌ 删除群聊失败:', result.message)
        appStore.showToast(result.message || '删除失败', 'error')
      }
    } else {
      console.error('❌ 删除群聊请求失败')
      appStore.showToast('删除失败', 'error')
    }
  } catch (error) {
    console.error('❌ 删除群聊失败:', error)
    appStore.showToast('删除失败', 'error')
  }
}

// 显示退出群聊对话框
const showLeaveGroupDialog = () => {
  console.log('显示退出群聊对话框')
  leaveGroupDialogRef.value?.show()
}

// 处理退出群聊确认
const handleLeaveGroupConfirm = async () => {
  try {
    const groupId = route.params.id as string
    const userId = authStore.user?.id

    console.log('🚪 退出群聊:', { groupId, userId })

    // 调用后端API退出群聊
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ userId })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('✅ 退出群聊成功')

        // 使用chatStore的deleteChatItem方法删除会话和消息
        await chatStore.deleteChatItem(groupId)

        appStore.showToast('已退出群聊', 'success')

        // 跳转到聊天列表
        router.push('/chat')
      } else {
        console.error('❌ 退出群聊失败:', result.message)
        appStore.showToast(result.message || '退出失败', 'error')
      }
    } else {
      console.error('❌ 退出群聊请求失败')
      appStore.showToast('退出失败', 'error')
    }
  } catch (error) {
    console.error('❌ 退出群聊失败:', error)
    appStore.showToast('退出失败', 'error')
  }
}

// 处理群公告更新事件
const handleAnnouncementUpdated = async (event: any) => {
  const { groupId: updatedGroupId } = event.detail || {}
  const currentGroupId = route.params.id as string

  if (updatedGroupId === currentGroupId) {
    console.log('🔔 检测到群公告更新，重新加载')
    await loadAnnouncement()
  }
}

// 处理群昵称更新事件
const handleNicknameChanged = (event: any) => {
  const { groupId: updatedGroupId, nickname } = event.detail || {}
  const currentGroupId = route.params.id as string

  if (updatedGroupId === currentGroupId) {
    console.log('📝 检测到群昵称更新:', nickname)
    myNickname.value = nickname
  }
}

// 加载待审核的邀请申请数量
const loadPendingInviteCount = async () => {
  try {
    // 只有群主和管理员才需要加载
    if (currentUserRole.value !== 'owner' && currentUserRole.value !== 'admin') {
      return
    }

    const response = await fetch(`http://localhost:8893/api/groups/${groupInfo.value.id}/invite-requests`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    if (result.success) {
      pendingInviteCount.value = result.data.requests.length
    }
  } catch (error) {
    console.error('加载邀请申请数量失败:', error)
  }
}

// 处理群名称更新事件
const handleGroupNameChanged = (event: any) => {
  const { groupId, newGroupName } = event.detail
  if (groupId === groupInfo.value.id) {
    groupInfo.value.name = newGroupName
    console.log('✅ 群名称已更新:', newGroupName)
  }
}

// 处理群备注更新事件
const handleRemarkChanged = (event: any) => {
  const { groupId, remarkName } = event.detail || {}
  const currentGroupId = route.params.id as string

  if (groupId === currentGroupId) {
    console.log('📝 检测到群备注更新:', remarkName)
    groupRemark.value = remarkName
  }
}

onMounted(async () => {
  console.log('🔄 GroupInfo 页面已挂载')
  try {
    // 设置超时，如果加载超过 10 秒则返回
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ 加载超时，返回上一页')
      router.back()
    }, 10000)

    await loadGroupInfo()
    await loadAnnouncement()
    await loadPendingInviteCount()
    await loadPendingRequestAvatars()

    clearTimeout(timeoutId)
    console.log('✅ GroupInfo 页面加载完成')
  } catch (error) {
    console.error('❌ GroupInfo 页面加载失败:', error)
    appStore.showToast('加载失败，请重试', 'error')
    router.back()
  }

  // 监听群公告更新事件
  window.addEventListener('group-announcement-updated', handleAnnouncementUpdated)

  // 监听群昵称更新事件
  window.addEventListener('group-nickname-changed', handleNicknameChanged)

  // 监听群名称更新事件
  window.addEventListener('group-name-changed', handleGroupNameChanged)

  // 监听群备注更新事件
  window.addEventListener('group-remark-changed', handleRemarkChanged)

  // 监听权限设置变化事件
  window.addEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})

// 处理权限变化事件
const handlePermissionChanged = (event: Event) => {
  const customEvent = event as CustomEvent
  const { groupId, nameEditRestricted } = customEvent.detail

  if (groupId === stableGroupId.value) {
    groupSettings.value.onlyAdminCanRename = nameEditRestricted
    console.log('✅ 权限设置已实时更新:', { onlyAdminCanRename: nameEditRestricted })
  }
}

// 监听路由变化，当从编辑页面返回时重新加载
onActivated(async () => {
  console.log('🔄 GroupInfo 页面已激活，重新加载数据')
  try {
    await loadGroupSettings()  // 重新加载权限设置
    await loadPendingRequestAvatars()  // 重新加载申请人头像
    console.log('✅ GroupInfo 权限设置已刷新')
  } catch (error) {
    console.error('❌ GroupInfo 权限设置刷新失败:', error)
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('group-announcement-updated', handleAnnouncementUpdated)
  window.removeEventListener('group-nickname-changed', handleNicknameChanged)
  window.removeEventListener('group-name-changed', handleGroupNameChanged)
  window.removeEventListener('group-remark-changed', handleRemarkChanged)
  window.removeEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})
</script>

<style scoped>
.group-info {
  height: 100vh;
  background-color: #EDEDED;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 隐藏滚动条 */
.group-info::-webkit-scrollbar {
  display: none;
}

.group-info {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.group-info-content {
  padding-bottom: 80px;
}

/* 群成员头像区域 */
.members-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
  margin-top: 0; /* 与顶部导航栏间距为0 */
  /* 不需要padding-top，因为MobileTopBar使用正常文档流，已经占据了空间 */
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px 8px; /* 行间距12px，列间距8px */
}

.member-avatar-item {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.avatar-wrapper {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.member-nickname {
  font-size: 9px;
  color: #666666;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 14px;
}

/* 查看更多按钮 */
.view-more-btn {
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  height: 25px; /* 固定高度25px */
  margin-top: 0; /* 与头像项间距为0 */
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 4px;
  line-height: 25px; /* 行高等于容器高度，确保文本垂直居中 */
}

.view-more-btn:active {
  background: #F7F7F7;
}

.view-more-btn span {
  font-size: 12px; /* 字体12px */
  color: #576B95;
  line-height: 1; /* 重置行高，避免继承父元素的行高 */
  display: flex;
  align-items: center; /* 确保文本内容垂直居中 */
}

.add-icon,
.remove-icon,
.delete-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #CCCCCC;
  border-radius: 8px;
  background: #F7F7F7;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-icon {
  border-color: #ff3b30;
  background: #fff5f5;
}

.add-member-btn:active .add-icon,
.remove-member-btn:active .remove-icon,
.delete-group-btn:active .delete-icon {
  background: #E5E5E5;
}

.delete-group-btn:active .delete-icon {
  background: #ffe5e5;
}

.remove-text,
.delete-text {
  color: #666666;
}

.delete-text {
  color: #ff3b30;
}

/* 功能列表区域 */
.settings-section {
  background: white;
  margin-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 0.5px solid #E5E5E5;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 48px; /* 固定高度48px */
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background: #F7F7F7;
}

.setting-label {
  font-size: 14px;
  font-weight: normal;
  color: #333;
  flex: 1;
}

.setting-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 申请人头像列表 */
.request-avatars {
  display: flex;
  align-items: center;
  margin-right: 4px;
}

.request-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #fff;
  margin-left: -8px;
  object-fit: cover;
}

.request-avatar:first-child {
  margin-left: 0;
}

.badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #FA5151;
  color: white;
  font-size: 11px;
  font-weight: 500;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-value-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-value {
  font-size: 14px;
  color: #999999;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 群公告样式 */
.announcement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px !important;
  height: 48px;
}

.announcement-item.has-content {
  border-bottom: none;
  height: auto !important;
  padding-top: 12px !important;
  padding-bottom: 6px !important;
}

.announcement-item.disabled-item {
  opacity: 0.5;
  cursor: not-allowed;
}

.announcement-item.disabled-item:active {
  background: #FFFFFF;
}

.announcement-content-row {
  background: #FFFFFF;
  padding: 0 16px 12px 16px;
  border-bottom: 0.5px solid #E5E5E5;
}

.announcement-content {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.6em * 3);
}

.announcement-empty {
  font-size: 14px;
  color: #999999;
  margin-right: 4px;
}

/* 群二维码样式 */
.qrcode-item {
  align-items: center;
}

.qrcode-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qrcode-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #E5E5E5;
}

/* 开关按钮 */
.setting-toggle {
  width: 51px;
  height: 31px;
  background: #E5E5E5;
  border-radius: 31px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 27px;
  height: 27px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}

/* 退出群聊按钮 */
.danger-item {
  justify-content: center;
}

.danger-text {
  color: #FA5151;
  text-align: center;
  flex: none;
}



</style>
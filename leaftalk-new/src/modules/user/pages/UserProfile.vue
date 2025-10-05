<template>
  <div class="user-profile">
    <!-- 朋友资料功能列表 -->
    <div class="settings-section">
      <!-- 备注名 -->
      <div class="setting-item" @click="editRemarkName">
        <div class="setting-info">
          <iconify-icon icon="heroicons:pencil" class="setting-icon"></iconify-icon>
          <span class="setting-text">备注名</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.remarkName || '未设置' }}</span>
          <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 标签 -->
      <div class="setting-item" @click="editTags">
        <div class="setting-info">
          <iconify-icon icon="heroicons:tag" class="setting-icon"></iconify-icon>
          <span class="setting-text">标签</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.tags.length > 0 ? friendData.tags.join(', ') : '未设置' }}</span>
          <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 电话 -->
      <div class="setting-item" @click="editPhone">
        <div class="setting-info">
          <iconify-icon icon="heroicons:phone" class="setting-icon"></iconify-icon>
          <span class="setting-text">电话</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.phone || '未设置' }}</span>
          <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 描述 -->
      <div class="setting-item" @click="editDescription">
        <div class="setting-info">
          <iconify-icon icon="heroicons:document-text" class="setting-icon"></iconify-icon>
          <span class="setting-text">描述</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.description || '未设置' }}</span>
          <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 我和他的共同群聊 -->
      <div class="setting-item" @click="viewCommonGroups">
        <div class="setting-info">
          <iconify-icon icon="heroicons:user-group" class="setting-icon"></iconify-icon>
          <span class="setting-text">我和他的共同群聊</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.commonGroups.length }}个群聊</span>
          <iconify-icon icon="heroicons:chevron-right" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 签名 -->
      <div class="setting-item signature-item">
        <div class="setting-info">
          <iconify-icon icon="heroicons:chat-bubble-left-ellipsis" class="setting-icon"></iconify-icon>
          <span class="setting-text">签名</span>
        </div>
        <div class="signature-content">
          <span class="signature-text">{{ friendData.signature || '暂无签名' }}</span>
        </div>
      </div>

      <!-- 来源 -->
      <div class="setting-item">
        <div class="setting-info">
          <iconify-icon icon="heroicons:map-pin" class="setting-icon"></iconify-icon>
          <span class="setting-text">来源</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ friendData.source || '通过搜索添加' }}</span>
        </div>
      </div>

      <!-- 添加时间 -->
      <div class="setting-item">
        <div class="setting-info">
          <iconify-icon icon="heroicons:calendar" class="setting-icon"></iconify-icon>
          <span class="setting-text">添加时间</span>
        </div>
        <div class="setting-status">
          <span class="status-text">{{ formatAddTime(friendData.addTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 黑名单确认弹窗 -->
    <div v-if="showBlacklistDialog" class="dialog-overlay" @click="hideBlacklistDialog">
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">{{ isBlacklisted ? '移出黑名单' : '加入黑名单' }}</h3>
        <p class="dialog-message">
          {{ isBlacklisted 
            ? `确定要将 ${userInfo.nickname} 移出黑名单吗？移出后可以正常接收对方消息。`
            : `确定要将 ${userInfo.nickname} 加入黑名单吗？加入后将拒收对方消息，但您仍可以发消息给对方。`
          }}
        </p>
        <div class="dialog-buttons">
          <button class="dialog-btn cancel-btn" @click="hideBlacklistDialog">取消</button>
          <button class="dialog-btn confirm-btn" @click="confirmBlacklist">确定</button>
        </div>
      </div>
    </div>

    <!-- 自定义输入弹窗 -->
    <div v-if="showInputDialog" class="dialog-overlay" @click="closeInputDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ inputDialogTitle }}</h3>
        </div>
        <div class="dialog-body">
          <input
            v-if="inputDialogType === 'input'"
            v-model="inputDialogValue"
            :placeholder="inputDialogPlaceholder"
            class="dialog-input"
            :maxlength="inputDialogMaxLength"
          />
          <textarea
            v-if="inputDialogType === 'textarea'"
            v-model="inputDialogValue"
            :placeholder="inputDialogPlaceholder"
            class="dialog-textarea"
            :maxlength="inputDialogMaxLength"
            rows="4"
          ></textarea>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel" @click="closeInputDialog">取消</button>
          <button class="dialog-btn confirm" @click="confirmInputDialog">确定</button>
        </div>
      </div>
    </div>

    <!-- 加载提示 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>处理中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiClient } from '../../services/apiClient'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const userInfo = ref({
  id: '',
  nickname: '用户',
  yeyuId: '',
  avatar: '',
  signature: '',
  region: ''
})

const isBlacklisted = ref(false)
const userRemark = ref('')
const showBlacklistDialog = ref(false)
const loading = ref(false)
const isFriend = ref(false)
const isAddingFriend = ref(false)

// 朋友资料数据
const friendData = ref({
  remarkName: '',
  tags: [] as string[],
  phone: '',
  description: '',
  commonGroups: [
    { id: '1', name: '家庭群', memberCount: 8 },
    { id: '2', name: '工作群', memberCount: 15 }
  ],
  signature: '生活就像一盒巧克力，你永远不知道下一颗是什么味道',
  source: '通过手机号添加',
  addTime: '2024-01-15'
})

// 自定义输入弹窗
const showInputDialog = ref(false)
const inputDialogTitle = ref('')
const inputDialogType = ref('input') // 'input' 或 'textarea'
const inputDialogPlaceholder = ref('')
const inputDialogValue = ref('')
const inputDialogMaxLength = ref(50)
const inputDialogCallback = ref<((value: string) => void) | null>(null)

// 返回功能
const goBack = () => {
  console.log('🔙 用户资料页面返回')
  router.back()
}

// 格式化添加时间
const formatAddTime = (time: string) => {
  if (!time) return '未知'
  return new Date(time).toLocaleDateString('zh-CN')
}

// 显示自定义输入弹窗
const showCustomDialog = (title: string, placeholder: string, currentValue: string, type: 'input' | 'textarea' = 'input', maxLength: number = 50) => {
  return new Promise<string>((resolve) => {
    inputDialogTitle.value = title
    inputDialogPlaceholder.value = placeholder
    inputDialogValue.value = currentValue
    inputDialogType.value = type
    inputDialogMaxLength.value = maxLength
    inputDialogCallback.value = resolve
    showInputDialog.value = true
  })
}

// 关闭输入弹窗
const closeInputDialog = () => {
  showInputDialog.value = false
  if (inputDialogCallback.value) {
    inputDialogCallback.value('')
    inputDialogCallback.value = null
  }
}

// 确认输入弹窗
const confirmInputDialog = () => {
  const value = inputDialogValue.value.trim()
  showInputDialog.value = false
  if (inputDialogCallback.value) {
    inputDialogCallback.value(value)
    inputDialogCallback.value = null
  }
}

// 编辑备注名
const editRemarkName = async () => {
  const newRemark = await showCustomDialog('设置备注名', '请输入备注名', friendData.value.remarkName, 'input', 20)
  if (newRemark) {
    friendData.value.remarkName = newRemark
  }
}

// 编辑标签
const editTags = async () => {
  const newTag = await showCustomDialog('设置标签', '请输入标签（多个标签用逗号分隔）', friendData.value.tags.join(', '), 'input', 50)
  if (newTag) {
    const tags = newTag.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    friendData.value.tags = tags.slice(0, 5) // 最多5个标签
  }
}

// 编辑电话
const editPhone = async () => {
  const newPhone = await showCustomDialog('设置电话', '请输入电话号码', friendData.value.phone, 'input', 20)
  if (newPhone) {
    friendData.value.phone = newPhone
  }
}

// 编辑描述
const editDescription = async () => {
  const newDesc = await showCustomDialog('设置描述', '请输入描述信息', friendData.value.description, 'textarea', 200)
  if (newDesc) {
    friendData.value.description = newDesc
  }
}

// 查看共同群聊
const viewCommonGroups = () => {
  console.log('查看共同群聊:', friendData.value.commonGroups)
  // 这里可以跳转到共同群聊列表页面
}

// 加载用户信息
const loadUserInfo = async () => {
  const userId = route.params.userId || route.query.userId
  if (!userId) {
    console.error('❌ 缺少用户ID')
    return
  }

  try {
    // 使用FriendsService获取用户信息
    const { FriendsService } = await import('../../contacts/services/friendsService')
    const friendsService = FriendsService.getInstance()
    const friend = await friendsService.getFriendById(userId)

    if (friend) {
      userInfo.value = {
        id: friend.id,
        nickname: friend.nickname || friend.name,
        name: friend.name,
        avatar: friend.avatar,
        region: friend.region || '未知地区',
        signature: friend.signature || '这个人很懒，什么都没留下',
        phone: friend.phone || '',
        email: friend.email || '',
        yeyuId: friend.yeyuId || friend.id
      }
      console.log('✅ 用户信息加载成功:', userInfo.value)
    } else {
      // 使用模拟数据
      userInfo.value = {
        id: userId as string,
        nickname: '用户' + userId,
        name: '用户' + userId,
        yeyuId: 'yeyu_' + userId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        signature: '这个人很懒，什么都没留下',
        region: '北京',
        phone: '',
        email: ''
      }
      console.log('⚠️ 未找到用户信息，使用模拟数据')
    }

    // 检查黑名单状态
    await checkBlacklistStatus()

    // 检查好友关系状态
    await checkFriendStatus()
  } catch (error) {
    console.error('❌ 加载用户信息失败:', error)
    appStore.showToast('加载用户信息失败', 'error')
  }
}

// 检查黑名单状态
const checkBlacklistStatus = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/user/blacklist/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('yeyu_token') || 'mock_token'}`
      },
      body: JSON.stringify({
        targetUserId: userInfo.value.id
      })
    })

    if (response.ok) {
      const data = await response.json()
      isBlacklisted.value = data.isBlacklisted || false
    } else {
      // 从本地存储检查
      const blacklist = JSON.parse(localStorage.getItem('yeyu_blacklist') || '[]')
      isBlacklisted.value = blacklist.includes(userInfo.value.id)
    }
  } catch (error) {
    console.error('❌ 检查黑名单状态失败:', error)
  }
}

// 添加好友
const addFriend = async () => {
  if (isAddingFriend.value) return

  isAddingFriend.value = true

  try {
    console.log('👥 添加好友:', userInfo.value.nickname)

    const response = await fetch('http://localhost:8893/api/contacts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('yeyu_token') || 'mock_token'}`
      },
      body: JSON.stringify({
        friendId: userInfo.value.id,
        nickname: userInfo.value.nickname,
        yeyu_id: userInfo.value.yeyuId,
        phone: userInfo.value.phone,
        avatar: userInfo.value.avatar,
        message: '我想加你为好友'
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        isFriend.value = true
        console.log('✅ 添加好友成功')
        // 可以添加成功提示
      } else {
        console.error('❌ 添加好友失败:', data.message)
      }
    } else {
      console.error('❌ 添加好友请求失败')
    }
  } catch (error) {
    console.error('❌ 添加好友异常:', error)
  } finally {
    isAddingFriend.value = false
  }
}

// 检查好友关系状态
const checkFriendStatus = async () => {
  const userId = route.params.userId || route.query.userId
  if (!userId) return

  try {
    // 暂时设置为好友，这样可以显示设置选项
    // 在实际项目中，这里应该调用API检查好友关系
    isFriend.value = true
    console.log('✅ 好友状态检查:', isFriend.value ? '是好友' : '不是好友')
  } catch (error) {
    console.error('❌ 检查好友状态失败:', error)
    isFriend.value = false
  }
}




// 显示黑名单确认弹窗
const toggleBlacklist = () => {
  showBlacklistDialog.value = true
}

// 隐藏黑名单确认弹窗
const hideBlacklistDialog = () => {
  showBlacklistDialog.value = false
}

// 确认黑名单操作
const confirmBlacklist = async () => {
  loading.value = true
  hideBlacklistDialog()

  try {
    const action = isBlacklisted.value ? 'remove' : 'add'
    const response = await fetch(`http://localhost:8893/api/user/blacklist/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('yeyu_token') || 'mock_token'}`
      },
      body: JSON.stringify({
        targetUserId: userInfo.value.id,
        targetNickname: userInfo.value.nickname
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        isBlacklisted.value = !isBlacklisted.value
        console.log(`✅ ${action === 'add' ? '加入' : '移出'}黑名单成功`)
        
        // 同步到本地存储
        const blacklist = JSON.parse(localStorage.getItem('yeyu_blacklist') || '[]')
        if (action === 'add') {
          if (!blacklist.includes(userInfo.value.id)) {
            blacklist.push(userInfo.value.id)
          }
        } else {
          const index = blacklist.indexOf(userInfo.value.id)
          if (index > -1) {
            blacklist.splice(index, 1)
          }
        }
        localStorage.setItem('yeyu_blacklist', JSON.stringify(blacklist))
      }
    } else {
      console.error('❌ 黑名单操作失败')
    }
  } catch (error) {
    console.error('❌ 黑名单操作错误:', error)
  } finally {
    loading.value = false
  }
}

// 发送消息
const sendMessage = () => {
  router.push(`/chat/${userInfo.value.id}`)
}

// 视频通话
const videoCall = () => {
  console.log('📹 发起视频通话:', userInfo.value.nickname)
  // TODO: 实现视频通话功能
}

// 语音通话
const voiceCall = () => {
  console.log('📞 发起语音通话:', userInfo.value.nickname)
  // TODO: 实现语音通话功能
}

// 设置备注
const setRemark = () => {
  console.log('✏️ 设置备注:', userInfo.value.nickname)
  const userId = route.params.userId || route.query.userId
  router.push(`/friend-remark/${userId}`)
}

// 查看更多信息
const viewMore = () => {
  console.log('ℹ️ 查看更多信息:', userInfo.value.nickname)
  const userId = route.params.userId || route.query.userId
  router.push(`/friend-more-info/${userId}`)
}

// 页面加载时获取用户信息
onMounted(() => {
  // loadUserInfo() // 暂时注释掉，因为页面只显示功能项
})
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 76px;
}



.user-info {
  flex: 1;
}

.nickname {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.yeyu-id {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px 0;
}

.signature {
  font-size: 14px;
  color: #888;
  margin: 4px 0;
}

.region {
  font-size: 14px;
  color: #888;
  margin: 4px 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.message-btn {
  background: #07C160;
  color: white;
}

.message-btn:hover {
  background: #06AD56;
}

.video-call-btn, .voice-call-btn {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.video-call-btn:hover, .voice-call-btn:hover {
  background: #f5f5f5;
}

.settings-section {
  background: white;
  border-radius: 8px;
  margin: 0 16px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

/* 签名项特殊样式 */
.signature-item {
  align-items: flex-start;
  min-height: 80px;
}

.signature-content {
  flex: 1;
  margin-left: 16px;
  padding-top: 2px;
}

.signature-text {
  font-size: 15px;
  color: #666;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 200px;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  font-size: 20px;
  color: #666;
}

.setting-text {
  font-size: 16px;
  color: #333;
}

.setting-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  color: #888;
}

.arrow-icon {
  font-size: 16px;
  color: #ccc;
}

/* 黑名单确认弹窗 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 0 24px;
  max-width: 320px;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  text-align: center;
}

.dialog-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 24px 0;
  text-align: center;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.confirm-btn {
  background: #ff4444;
  color: white;
}

.confirm-btn:hover {
  background: #dd3333;
}

/* 加载提示 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  font-size: 14px;
  margin: 0;
}

/* 自定义输入弹窗样式 */
.dialog-header {
  text-align: center;
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-input, .dialog-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: #f8f8f8;
  box-sizing: border-box;
}

.dialog-input:focus, .dialog-textarea:focus {
  outline: none;
  border-color: #07C160;
  background: white;
}

.dialog-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-btn.cancel {
  background: #f0f0f0;
  color: #666;
}

.dialog-btn.cancel:hover {
  background: #e0e0e0;
}

.dialog-btn.confirm {
  background: #07C160;
  color: white;
}

.dialog-btn.confirm:hover {
  background: #06a552;
}
</style>

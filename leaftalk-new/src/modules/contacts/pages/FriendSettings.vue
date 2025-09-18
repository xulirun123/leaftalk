<template>
  <div class="friend-settings">
    <!-- 使用全局导航栏，移除自定义 MobileTopBar -->

    <!-- 设置列表（扁平结构，项间距5px） -->
    <div class="settings-list">
      <div class="settings-item" @click="setRemark">
        <div class="item-content"><span class="item-label yy-function-item-text">设置备注和标签</span></div>
        <div class="item-right">
          <span class="arrow" aria-hidden="true"></span>
        </div>
      </div>

      <div class="settings-item" @click="goFriendPermissions">
        <div class="item-content"><span class="item-label yy-function-item-text">朋友权限</span></div>
        <span class="arrow" aria-hidden="true"></span>
      </div>

      <div class="settings-item" @click="recommendToFriend">
        <div class="item-content"><span class="item-label yy-function-item-text">把他推荐给好友</span></div>
        <span class="arrow" aria-hidden="true"></span>
      </div>

      <div class="settings-item" @click="toggleStarFriend">
        <div class="item-content"><span class="item-label yy-function-item-text">设为星标朋友</span></div>
        <div class="toggle-switch" :class="{ active: isStarred }" @click.stop="toggleStarFriend">
          <div class="toggle-handle"></div>
        </div>
      </div>

      <div class="settings-item" @click="addToBlacklist">
        <div class="item-content"><span class="item-label yy-function-item-text blacklist-label">{{ isBlacklisted ? '移出黑名单' : '加入黑名单' }}</span></div>
        <div class="toggle-switch" :class="{ active: isBlacklisted }" @click.stop="addToBlacklist">
          <div class="toggle-handle"></div>
        </div>
      </div>

      <div class="settings-item danger-item center-text spaced-15" @click="deleteFriend">
        <div class="item-content"><span class="item-label yy-function-item-text">删除联系人</span></div>
      </div>
    </div>


    <!-- 黑名单确认弹窗（自定义对话框） -->
    <div v-if="showBlacklistDialog" class="dialog-overlay" @click="cancelBlacklistChange">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ isBlacklisted ? '移出黑名单' : '加入黑名单' }}</h3>
        </div>
        <div class="dialog-content">
          <p v-if="!isBlacklisted">加入黑名单后，对方将无法给你发消息，且从通讯录移至黑名单中。</p>
          <p v-else>移出黑名单后，对方可恢复与你的聊天。</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel" @click="cancelBlacklistChange">取消</button>
          <button class="dialog-btn confirm" @click="confirmBlacklistChange">确定</button>
        </div>
      </div>
    </div>

    <!-- 删除联系人确认弹窗（自定义对话框） -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="cancelDeleteFriend">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>删除联系人</h3>
        </div>
        <div class="dialog-content">
          <p>删除后将同时删除聊天记录，且无法恢复。</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel" @click="cancelDeleteFriend">取消</button>
          <button class="dialog-btn confirm" @click="confirmDeleteFriend">确定</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlacklistStore } from '../stores/blacklistStore'
import { apiClient } from '../../../shared/services/apiClient'
import { eventBus } from '../../../shared/utils/eventBus'
import { userApi } from '../../../shared/services/userApi'

const router = useRouter()
const route = useRoute()
const blacklistStore = useBlacklistStore()

// 好友ID
const friendId = computed(() => route.params.id as string)

// 响应式数据
const friendInfo = ref<any>({})
const isBlacklisted = ref(false)

// 朋友权限
const generalPermission = ref(true)  // 聊天、朋友圈总权限（暂未使用）
const isChatOnly = ref(false)
const isStarred = ref(false)

// 朋友圈状态
const blockHimSeeMe = ref(false)  // 不让他（她）看
const dontSeeHim = ref(false)     // 不看他（她）


// 生成头像
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${color}"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">${initial}</text></svg>`
}

// 加载好友信息
const loadFriendInfo = () => {
  try {
    // 从localStorage获取通讯录数据
    const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')
    const friend = contacts.find((c: any) => c.id === friendId.value)

    if (friend) {
      friendInfo.value = {
        id: friend.id,
        name: friend.name || friend.nickname,
        avatar: friend.avatar || generateAvatar(friend.name || friend.nickname),
        remark: friend.remark || '',
        phone: friend.phone,
        yeyuId: friend.yeyuId
      }
    } else {
      // 如果在通讯录中找不到，使用默认数据
      const knownUsers: { [key: string]: any } = {
        'user_1000000002': { name: '小叶', yeyuId: '1000000002' },
        'admin_001': { name: '系统管理员', yeyuId: '1000000000' }
      }

      const defaultUser = knownUsers[friendId.value] || { name: friendId.value, yeyuId: friendId.value }
      friendInfo.value = {
        id: friendId.value,
        name: defaultUser.name,
        avatar: generateAvatar(defaultUser.name),
        remark: '',
        yeyuId: defaultUser.yeyuId
      }
    }

    // 检查黑名单状态
    const blacklist = JSON.parse(localStorage.getItem('yeyu_blacklist') || '[]')
    isBlacklisted.value = blacklist.includes(friendId.value)

    console.log('👤 加载好友信息:', friendInfo.value)
  } catch (error) {
    console.error('加载好友信息失败:', error)
  }
}

const setRemark = () => {
  router.push(`/friend-remark/${friendId.value}`)
}



// 朋友权限控制
const toggleGeneralPermission = () => {
  generalPermission.value = !generalPermission.value
  if (!generalPermission.value) {
    isChatOnly.value = false
  }
  console.log('聊天、朋友圈权限:', generalPermission.value)
}

const setChatOnly = () => {
  if (isChatOnly.value) {
    // 取消仅聊天，恢复完整权限
    isChatOnly.value = false
    generalPermission.value = true
  } else {
    // 设置为仅聊天
    isChatOnly.value = true
    generalPermission.value = true  // 仅聊天也需要基础权限
  }
  console.log('仅聊天模式:', isChatOnly.value)
}

// 朋友圈状态控制
const toggleBlockHimSeeMe = () => {
  blockHimSeeMe.value = !blockHimSeeMe.value
  console.log('不让他（她）看:', blockHimSeeMe.value)
}

const toggleDontSeeHim = () => {
  dontSeeHim.value = !dontSeeHim.value
  console.log('不看他（她）:', dontSeeHim.value)
}

const recommendToFriend = () => {
  //  -> 
  //















  router.push(`/select-chat?from=recommend&friendId=${friendId.value}`)
}

const goFriendPermissions = () => {
  router.push(`/friend-permissions/${friendId.value}`)
}

const loadStarState = async () => {
  try {
    const res = await apiClient.get<any>('/contacts/starred')
    const ids: Array<number|string> = res?.data?.ids || []
    const idStr = String(friendId.value)
    isStarred.value = ids.map(String).includes(idStr)
  } catch (e) {
    console.warn('加载星标状态失败:', e)
  }
}

const toggleStarFriend = async () => {
  try {
    const endpoint = isStarred.value ? '/contacts/star/remove' : '/contacts/star/add'
    const r = await apiClient.post(endpoint, { friendId: Number(friendId.value) })
    if (!r?.success) throw new Error(r?.error || '更新星标失败')
    isStarred.value = !isStarred.value
  } catch (e) {
    console.warn('更新星标失败:', e)
  }
}

const showBlacklistDialog = ref(false)

const addToBlacklist = async () => {
  showBlacklistDialog.value = true
}

const confirmBlacklistChange = async () => {
  try {
    // 兼容路由参数为叶语号的情况：先解析为数字ID，不行则通过 /users/:id(支持id或yeyu_id) 获取
    let targetUserId: number | null = Number.isFinite(Number(friendId.value)) ? Number(friendId.value) : null
    if (targetUserId === null) {
      try {
        const res = await userApi.getUserInfo(String(friendId.value))
        const u: any = res?.data
        if (u && u.id) targetUserId = Number(u.id)
      } catch {}
    }
    if (!Number.isFinite(targetUserId as number)) throw new Error('无效的好友ID')

    const prev = isBlacklisted.value
    // 乐观更新开关
    isBlacklisted.value = !prev

    let res
    if (prev) {
      res = await apiClient.post('/user/blacklist/remove', { targetUserId })
      console.log('黑名单移出响应:', res)
      if (res?.success === false) throw new Error(res.message || '移除黑名单失败')
      // 本地也立即移除，确保黑名单页面立刻显示
      try { blacklistStore.removeFromBlacklist(String(targetUserId)) } catch {}
    } else {
      res = await apiClient.post('/user/blacklist/add', { targetUserId, reason: '' })
      console.log('加入黑名单响应:', res)
      if (res?.success === false) throw new Error(res.message || '加入黑名单失败')
      // 本地也立即加入，确保黑名单页面立刻显示
      try {
        blacklistStore.addToBlacklist({
          id: String(targetUserId),
          name: friendInfo.value?.name || `用户${targetUserId}`,
          avatar: friendInfo.value?.avatar || '',
          yeyuId: friendInfo.value?.yeyuId || ''
        })
      } catch {}
    }

    // 之后再以服务端为准同步一次，确保一致
    await blacklistStore.loadFromServer()
    isBlacklisted.value = blacklistStore.isInBlacklist(String(targetUserId))

    // 广播事件，通知黑名单页面刷新
    eventBus.emit('blacklist:updated', { userId: String(targetUserId), action: isBlacklisted.value ? 'add' : 'remove' })
  } catch (e: any) {
    console.error('黑名单操作失败:', e?.message || e)
    // 失败回滚开关
    isBlacklisted.value = !isBlacklisted.value
  } finally {
    showBlacklistDialog.value = false
  }
}

const cancelBlacklistChange = () => {
  showBlacklistDialog.value = false
}

const showDeleteDialog = ref(false)

const deleteFriend = async () => {
  showDeleteDialog.value = true
}

const confirmDeleteFriend = async () => {
  try {
    // 从本地通讯录中删除
    const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')
    const updatedContacts = contacts.filter((c: any) => c.id !== friendId.value)
    localStorage.setItem('yeyu_contacts', JSON.stringify(updatedContacts))

    // 删除相关的聊天记录
    const chats = JSON.parse(localStorage.getItem('yeyu_chats') || '[]')
    const updatedChats = chats.filter((c: any) => c.id !== friendId.value)
    localStorage.setItem('yeyu_chats', JSON.stringify(updatedChats))

    // 删除聊天消息
    localStorage.removeItem(`yeyu_chat_messages_${friendId.value}`)

    // 从chatStore中删除
    chatStore.removeChat(friendId.value)

    console.log('✅ 好友删除成功:', friendInfo.value.name)
    showDeleteDialog.value = false

    // 返回通讯录页面
    router.push('/contacts')
  } catch (error) {
    console.error('❌ 删除好友失败:', error)
    showDeleteDialog.value = false
  }
}

const cancelDeleteFriend = () => {
  showDeleteDialog.value = false
}

onMounted(async () => {
  loadFriendInfo()
  await loadStarState()
  await blacklistStore.loadFromServer()
  isBlacklisted.value = blacklistStore.isInBlacklist(friendId.value)
})
</script>

<style scoped>
.friend-settings {
  min-height: 100vh;
  background: #e5e5e5;
}

/* 移除自创导航栏样式，使用全局导航栏 */



.settings-list {
  padding: 12px 0;
  margin-top: 5px; /* 与顶部导航栏拉开 5px 间距 */
}

/* 扁平结构：每项间隔5px */
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px; /* 固定容器高度 48px */
  padding: 0 16px; /* 垂直靠 height 控制，左右 16px */
  background: white;
  margin-bottom: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* 删除联系人与上方项间距15px */
.settings-item.spaced-15 { margin-top: 15px; }

/* 删除联系人文本水平居中在容器内 */
.settings-item.center-text { justify-content: center; }
.settings-item.center-text .item-content { flex: 1; }
.settings-item.center-text .item-label { display: block; width: 100%; text-align: center; }

.settings-item:last-child { margin-bottom: 0; }

/* 黑名单条目字体颜色使用黑色 */
.blacklist-label { color: #000; }

.settings-item:hover {
  background: #f8f8f8;
}

.item-content {
  flex: 1;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 纯CSS 小箭头 */
.arrow {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-right: 2px solid #999;
  border-bottom: 2px solid #999;
  transform: rotate(-45deg);
  margin-left: 8px;
}

/* 危险项的箭头颜色 */
.settings-item.danger-item .arrow {
  border-color: #ff4444;
}

.item-label {
  font-size: 14px;
  color: #333;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.item-desc {
  font-size: 14px;
  color: #666;
  margin-top: 2px;
  display: block;
}

.item-desc-small {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  display: block;
}

.item-value {
  font-size: 14px;
  color: #666;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-switch.active {
  background: #07C160;
}

.toggle-handle {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.toggle-switch.active .toggle-handle {
  transform: translateX(20px);
}

/* 复选框样式 */
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #07C160;
  border-color: #07C160;
}

.checkbox:hover {
  border-color: #07C160;
}



.danger-item {
  color: #ff4444;
}

.danger-item .item-label {
  color: #ff4444;
}

/* 弹窗样式 */
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

.dialog {
  background: white;
  border-radius: 12px;
  width: 300px;
  max-width: 90vw;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 0;
  text-align: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-content {
  padding: 20px;
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
}

.remark-input:focus {
  border-color: #07C160;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.dialog-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-btn.cancel {
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.dialog-btn.confirm {
  color: #07C160;
  font-weight: 500;
}

.dialog-btn:hover {
  background: #f8f8f8;
}
</style>

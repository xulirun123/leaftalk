<template>
  <div class="friend-profile-simple">

    <!-- 用户信息 -->
    <div class="user-info">
      <div class="avatar-section">
        <img
          :src="normalizedAvatar"
          :alt="friendInfo.nickname || friendInfo.name"
          class="avatar"
          @error="handleAvatarError"
        />
      </div>
      <div class="star-flag" v-if="isStarred">★</div>
      <div class="info-section">
        <p v-if="friendInfo.remark" class="remark">{{ friendInfo.remark }}</p>
        <p v-if="friendInfo.remark" class="name-line"><span class="name-label">昵称：</span><span class="name-text">{{ friendInfo.nickname || friendInfo.name }}</span></p>
        <p v-else class="display-name">{{ friendInfo.nickname || friendInfo.name }}</p>
        <p class="yeyu-id">叶语号：{{ friendInfo.yeyuId || friendInfo.id }}</p>
        <p class="region">地区：{{ friendInfo.region || '未知地区' }}</p>
      </div>
    </div>

    <!-- 功能模块 -->
    <div class="function-modules">
      <!-- 未设置任何标签/电话/描述时，显示“备注和标签”入口 -->
      <div class="module-item" v-if="!hasExtras" @click="goRemarkTags">
        <span>备注和标签</span>
      </div>

      <!-- 已设置任一项时，直接展示对应内容，且隐藏“备注和标签”入口 -->
      <template v-else>
        <div v-if="profileTags.length" class="module-item tags-inline-row">
          <span>标签：</span>
          <span class="item-value tag-value">{{ profileTags.join('、') }}</span>
        </div>
        <div v-if="profilePhones.length" class="phone-block">
          <div v-for="(p,i) in profilePhones" :key="i" class="module-item phone-item-row" @click="openPhoneSheet(p)">
            <span v-if="i===0" class="phone-label">电话：</span>
            <span v-else class="phone-label placeholder"></span>
            <span class="item-value phone">{{ p }}</span>
          </div>
        </div>
        <div v-if="profileDescription" class="module-item desc-row">
          <span>描述：</span>
          <span class="item-value desc-value">{{ profileDescription }}</span>
        </div>
      </template>

      <div class="module-item" @click="manageFriendPermissions">
        <span>朋友权限</span>
      </div>

      <div class="module-item" @click="viewFriendMoments">
        <span>朋友圈</span>
      </div>

      <div class="module-item" @click="viewFriendMore">
        <span>更多</span>
      </div>
    </div>


    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn primary" @click="sendMessage">
        <iconify-icon icon="heroicons:chat-bubble-left-right" width="24"></iconify-icon>
        <span>发消息</span>
      </button>

    </div>



    <!-- 电话操作底部弹窗（独立于上面的通话选择弹窗） -->
    <div v-if="showPhoneSheet" class="modal-overlay" @click="closePhoneSheet">
      <div class="call-modal" @click.stop>
        <div class="modal-options">
          <button class="modal-option" @click="callPhone">
            <iconify-icon icon="heroicons:phone" width="24"></iconify-icon>
            <span>呼叫</span>
          </button>
          <button class="modal-option" @click="copyPhone">
            <iconify-icon icon="heroicons:document-duplicate" width="24"></iconify-icon>
            <span>复制</span>
          </button>
          <button class="modal-option cancel" @click="closePhoneSheet">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
            <span>取消</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="debug-info" v-if="showDebug">
      <h3>调试信息</h3>
      <pre>{{ JSON.stringify(friendInfo, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import { contactsApi } from '../services/contactsApi'
import { generateChatUrl } from '../../chat/utils/chatUrlGenerator'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
import { apiClient } from '../../../shared/services/apiClient'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// 好友ID
const friendId = computed(() => {
  // 尝试多种可能的参数名
  const id = route.params.id || route.params.userId || route.params.friendId || route.query.id
  console.log('🔍 计算friendId:', id, '路由参数:', route.params, '查询参数:', route.query)
  return id as string
})

// 好友信息
const friendInfo = ref({
  id: '',
  name: '加载中...',
  nickname: '',
  remark: '',
  avatar: '',
  yeyuId: '',
  region: '',
  phone: '',
  email: '',
  signature: ''
})

// 调试模式
const showDebug = ref(false)

// 通话选择弹窗
const showCallModal = ref(false)

// 电话底部操作弹窗
const showPhoneSheet = ref(false)
const selectedPhone = ref('')
const openPhoneSheet = (p: string) => { selectedPhone.value = p; showPhoneSheet.value = true }
const closePhoneSheet = () => { showPhoneSheet.value = false }
const callPhone = () => { if (selectedPhone.value) { window.location.href = `tel:${selectedPhone.value}` }; showPhoneSheet.value = false }
const copyPhone = async () => { try { await navigator.clipboard.writeText(selectedPhone.value); appStore.showToast('已复制电话号码') } catch (e) { console.warn('复制失败', e) } finally { showPhoneSheet.value = false } }

// 顶部导航栏按钮配置
const topBarButtons = ref([
  {
    icon: 'heroicons:ellipsis-horizontal',
    action: 'settings'
  }
])

// 头像错误处理：统一回退到真实头像API
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getRealAvatarUrl(friendInfo.value.id)
}


// 统一规范化头像：无论数据来源（缓存/接口）都强制走真实头像API
const normalizedAvatar = computed(() => {
  try {
    const idStr = String(friendInfo.value.id || '')
    const raw = friendInfo.value.avatar
    if (!idStr) return raw || ''
    if (!raw) return getRealAvatarUrl(idStr)
    const u = String(raw)
    if (u.includes('/uploads/avatars/')) return getRealAvatarUrl(idStr)
    if (u.startsWith('http://localhost:8893/api/users/')) return u
    return getRealAvatarUrl(idStr)
  } catch {
    return ''
  }
})


// 本地保存的数据读取
const getSavedPack = () => {
  try {
    const id = String(friendId.value || friendInfo.value.id || '')
    if (!id) return null
    return JSON.parse(localStorage.getItem(`friend_remark_${id}`) || 'null')
  } catch { return null }
}

// 详情页展示用数据
const profileTags = computed<string[]>(() => {
  const saved = getSavedPack(); return Array.isArray(saved?.tags) ? saved!.tags : []
})
const profilePhones = computed<string[]>(() => {
  const saved = getSavedPack(); return Array.isArray(saved?.phones) ? saved!.phones : []
})
const profileDescription = computed(() => {
  const saved = getSavedPack(); return (saved?.description || '').toString().trim()
})
const hasExtras = computed(() => profileTags.value.length > 0 || profilePhones.value.length > 0 || !!profileDescription.value)


// 显示通话选择
const showCallOptions = () => {
  showCallModal.value = true
}

// 隐藏通话选择
const hideCallOptions = () => {
  showCallModal.value = false
}

// 发送消息
const sendMessage = () => {
  console.log('💬 发送消息给:', friendInfo.value.nickname || friendInfo.value.name)

  const currentUserId = authStore.user?.id?.toString() || '1'

  // 🛡️ 防护：检查是否为自聊天
  if (currentUserId === friendId.value) {
    console.error('🛡️ 阻止与自己发送消息:', { currentUserId, friendId: friendId.value })
    appStore.showToast('不能与自己聊天', 'error')
    return
  }

  // 生成统一的chatId格式：小ID_大ID（不包含chat_前缀，因为路由已经有/chat/）
  const otherUserId = friendId.value
  const chatId = `${Math.min(Number(currentUserId), Number(otherUserId))}_${Math.max(Number(currentUserId), Number(otherUserId))}`
  const chatUrl = `/chat/${chatId}`

  console.log('🚀 跳转到聊天页面:', chatUrl, '参数:', { currentUserId, otherUserId, chatId })
  router.push(chatUrl)
}

// 备注和标签页面
const goRemarkTags = () => {
  router.push(`/friend-remark/${friendId.value}`)
}

// 语音通话
const makeVoiceCall = async () => {
  try {
    // 调用后端API发起语音通话
    const response = await fetch('http://localhost:8893/api/webrtc-calls/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        toUserId: friendId.value,
        type: 'voice'
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 跳转到语音通话页面
        router.push({
          name: 'VoiceCall',
          params: { id: friendId.value },
          query: {
            callId: result.data.callId,
            status: 'calling'
          }
        })
      } else {
        throw new Error(result.error || '发起语音通话失败')
      }
    } else {
      throw new Error('网络请求失败')
    }
  } catch (error) {
    console.error('❌ 发起语音通话失败:', error)
    appStore.showToast('发起语音通话失败', 'error')
  }
}

// 视频通话
const makeVideoCall = async () => {
  try {
    // 调用后端API发起视频通话
    const response = await fetch('http://localhost:8893/api/webrtc-calls/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        toUserId: friendId.value,
        type: 'video'
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 跳转到视频通话页面
        router.push({
          name: 'VideoCall',
          params: { id: friendId.value },
          query: {
            callId: result.data.callId,
            status: 'calling',
            name: friendInfo.value.nickname,
            avatar: friendInfo.value.avatar
          }
        })
      } else {
        throw new Error(result.error || '发起视频通话失败')
      }
    } else {
      throw new Error('网络请求失败')
    }
  } catch (error) {
    console.error('❌ 发起视频通话失败:', error)
    appStore.showToast('发起视频通话失败', 'error')
  }
}

// 管理朋友权限
const manageFriendPermissions = () => {
  console.log('🔒 管理朋友权限:', friendInfo.value.nickname || friendInfo.value.name)
  router.push(`/friend-permissions/${friendId.value}`)
}

// 查看朋友圈
const viewFriendMoments = () => {
  console.log('📸 查看朋友圈:', friendInfo.value.nickname || friendInfo.value.name)
  router.push(`/moments/${friendId.value}`)
}

// 更多（社交资料）
const viewFriendMore = () => {
  console.log('📄 查看社交资料:', friendInfo.value.nickname || friendInfo.value.name)
  router.push(`/friend-social/${friendId.value}`)
}

// 缓存机制 - 永久缓存好友信息
const FRIEND_CACHE_KEY = 'friend_profile_cache'

const getFriendFromCache = (friendId: string) => {
  try {
    const cached = localStorage.getItem(FRIEND_CACHE_KEY)
    if (cached) {
      const cacheData = JSON.parse(cached)
      const friend = cacheData[friendId]
      if (friend) {
        console.log('📱 从缓存获取好友信息:', friend.name)
        return friend
      }
    }
  } catch (error) {
    console.warn('读取好友缓存失败:', error)
  }
  return null
}

const saveFriendToCache = (friendId: string, friendData: any) => {
  try {
    const cached = localStorage.getItem(FRIEND_CACHE_KEY)
    const cacheData = cached ? JSON.parse(cached) : {}
    cacheData[friendId] = friendData
    localStorage.setItem(FRIEND_CACHE_KEY, JSON.stringify(cacheData))
    console.log('📱 好友信息已缓存:', friendData.name)
  } catch (error) {
    console.warn('保存好友缓存失败:', error)
  }
}

// 加载好友信息
const loadFriendInfo = async (forceRefresh = false) => {
  try {
    console.log('👤 加载好友资料:', friendId.value)

    if (!friendId.value || friendId.value === 'undefined') {
      console.error('❌ 好友ID无效:', friendId.value)
      appStore.showToast('好友ID无效', 'error')
      router.back()
      return
    }

    // 如果不是强制刷新，先尝试从缓存加载（并在需要时补齐地区/签名）
    if (!forceRefresh) {
      const cachedFriend = getFriendFromCache(friendId.value)
      if (cachedFriend) {
        friendInfo.value = cachedFriend
        console.log('✅ 使用缓存的好友资料:', cachedFriend.name)
        try {
          if (!cachedFriend.region || cachedFriend.region === '未知地区' || typeof cachedFriend.signature !== 'string') {
            const detail = await apiClient.get<any>(`/users/${friendId.value}`)
            if (detail?.success && detail.data) {
              const u = detail.data
              const region = u.region || u.location || u.area || ''
              const signature = (u.signature ?? '')
              let changed = false
              if (region && friendInfo.value.region === '未知地区') { friendInfo.value.region = region; changed = true }
              if (typeof signature === 'string') { friendInfo.value.signature = signature; changed = true }
              if (changed) saveFriendToCache(friendId.value, friendInfo.value)
            }
          }
        } catch (e) { console.warn('缓存补齐用户详情失败:', e) }
        return
      }
    }

    // 直接使用联系人API获取好友列表
    const response = await contactsApi.getContacts()

    if (!response.success || !response.data) {
      throw new Error('获取联系人列表失败')
    }

    // 调试信息：显示所有朋友列表
    const allFriends = response.data
    console.log('🔍 所有朋友列表:', allFriends.map(f => ({
      id: f.id,
      idType: typeof f.id,
      name: f.name,
      nickname: f.nickname,
      yeyuId: f.yeyuId
    })))
    console.log('🔍 查找的好友ID:', friendId.value, '类型:', typeof friendId.value)
    console.log('🔍 路由参数:', route.params)
    console.log('🔍 路由路径:', route.path)

    // 查找指定的好友
    let friend = null

    // 在所有朋友中查找
    friend = allFriends.find(f => {
      const fId = f.id
      const searchId = friendId.value

      // 尝试多种匹配方式
      return fId === searchId ||                    // 直接匹配
             fId == searchId ||                     // 类型转换匹配
             fId.toString() === searchId ||         // ID转字符串匹配
             fId === Number(searchId) ||            // 搜索ID转数字匹配
             String(fId) === String(searchId)       // 都转字符串匹配
    })

    console.log('🔍 查找结果:', friend)
    console.log('🔍 原始数据详情:', {
      id: friend?.id,
      name: friend?.name,
      nickname: friend?.nickname,
      avatar: friend?.avatar,
      yeyuId: friend?.yeyuId,
      region: friend?.region
    })

    if (friend) {
      const normalizedAvatar = (() => {
        const raw = friend.avatar
        const idStr = String(friend.id)
        if (!raw) return getRealAvatarUrl(idStr)
        const u = String(raw)
        if (u.includes('/uploads/avatars/')) return getRealAvatarUrl(idStr)
        if (u.startsWith('http://localhost:8893/api/users/')) return u
        return getRealAvatarUrl(idStr)
      })()

      friendInfo.value = {
        id: friend.id,
        name: friend.name,
        nickname: friend.nickname || friend.name,
        avatar: normalizedAvatar,
        yeyuId: friend.yeyuId || friend.yeyu_id || friend.yeyuNumber || `YY${friend.id}`,
        region: friend.region || friend.location || friend.area || '未知地区',
        phone: friend.phone || '未知',
        email: friend.email || 'friend@example.com',
        signature: friend.signature || '这个人很懒，什么都没留下'
      }
      console.log('✅ 好友资料加载成功:', friendInfo.value)
      // 保存到缓存
      saveFriendToCache(friendId.value, friendInfo.value)

      // 如缺少地区信息，尝试从用户详情补齐
      if (!friendInfo.value.region || friendInfo.value.region === '未知地区') {
        try {
          const detail = await apiClient.get<any>(`/users/${friendId.value}`)
          if (detail.success && detail.data) {
            const u = detail.data
            const region = u.region || u.location || u.area || ''
            const signature = (u.signature ?? '')
            let changed = false
            if (region && friendInfo.value.region === '未知地区') {
              friendInfo.value.region = region
              changed = true
            }
            // 同步个性签名（允许空字符串表示未设置）
            if (typeof signature === 'string') {
              friendInfo.value.signature = signature
              changed = true
            }
            if (changed) {
              saveFriendToCache(friendId.value, friendInfo.value)
            }
          }
        } catch (e) {
          console.warn('获取用户详情补齐地区失败:', e)
        }
      }
    } else {
      // 如果找不到好友，使用模拟数据
      console.warn('⚠️ 未找到好友信息，使用模拟数据')
      friendInfo.value = {
        id: friendId.value,
        name: `好友${friendId.value}`,
        nickname: `昵称${friendId.value}`,
        avatar: getRealAvatarUrl(friendId.value),
        yeyuId: `YY${friendId.value}`,
        region: '北京市朝阳区',
        phone: '未知',
        email: 'friend@example.com',
        signature: '这个人很懒，什么都没留下'
        , remark: ''
      }
    }

  } catch (error) {
    console.error('❌ 加载好友资料失败:', error)
    appStore.showToast('加载好友资料失败', 'error')

    // 出错时使用模拟数据
    friendInfo.value = {
      id: friendId.value,
      name: `好友${friendId.value}`,
      nickname: `昵称${friendId.value}`,
      avatar: getRealAvatarUrl(friendId.value),
      yeyuId: `YY${friendId.value}`,
      region: '未知地区',
      phone: '未知',
      email: 'friend@example.com',
      remark: '',
      signature: '这个人很懒，什么都没留下'
    }

    // 失败情况下也尝试补齐地区信息
    try {
      const detail = await apiClient.get<any>(`/users/${friendId.value}`)
      if (detail.success && detail.data) {
        const u = detail.data
        const region = u.region || u.location || u.area || ''
        if (region) {
          friendInfo.value.region = region
          saveFriendToCache(friendId.value, friendInfo.value)
        }
      }
    } catch {}
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadFriendInfo()
  // 后台拉取备注包并合并
  const fetchRemarkPackImmediate = async () => {
    try {
      const resp = await apiClient.get<any>(`/contacts/${friendId.value}/remark-pack`)
      if (resp?.success && resp?.data) {
        const pack = resp.data
        const payload = {
          name: pack.remark || '',
          tags: Array.isArray(pack.tags) ? pack.tags : [],
          phones: Array.isArray(pack.phones) ? pack.phones : [],
          description: pack.description || ''
        }
        try { localStorage.setItem(`friend_remark_${friendId.value}`, JSON.stringify(payload)) } catch {}
        if (payload.name) friendInfo.value.remark = payload.name
      }
    } catch (e) { console.warn('获取备注包失败:', e) }
  }

  fetchRemarkPackImmediate()


// 从本地存储合并备注到资料
const mergeLocalRemark = () => {
  try {
    const id = friendId.value
    if (!id) return
    let remark: string | undefined
    const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')
    const c = contacts.find((x: any) => x.id === id)
    if (c && typeof c.remark === 'string') remark = c.remark
    const cacheKey = 'friend_profile_cache'
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
    if (!remark && cached[id] && typeof cached[id].remark === 'string') remark = cached[id].remark
    if (typeof remark === 'string') friendInfo.value.remark = remark
  } catch {}
}

watch(() => friendInfo.value.id, (val) => { if (val) mergeLocalRemark() })

  loadStarState()
})
// 星标好友状态（从服务端判断“我是否标星了他”）
const isStarred = ref(false)

const loadStarState = async () => {
  try {
    const res = await apiClient.get<any>('/contacts/starred')
    const ids: Array<number|string> = res?.data?.ids || []
    const idStr = String(friendId.value)
    isStarred.value = ids.map(String).includes(idStr)
  } catch {}
}

</script>

<style scoped>
.friend-profile-simple {
  height: 100%;
  background: #e5e5e5;
  display: flex;
  flex-direction: column;
  /* 贴顶：自身包含状态栏+导航栏，无需额外间距 */
  padding-top: 0;
}

/* 用户信息区域 */
.user-info {
  background: white;
  padding: 6px 16px 24px 16px; /* 顶部6px间距，与个人资料页面一致 */
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  gap: 16px;
  border-bottom: 1px solid #e0e0e0;
  position: relative; /* 供星标定位到右侧 */
}

.avatar-section {
  flex-shrink: 0;
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box; /* 确保尺寸计算正确 */
}


.display-name { margin: 0; font-size: 16px; color: #111; line-height: 20px; }

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4px;
}

.name-line { margin: 0; font-size: 12px; color: #333; line-height: 16px; }
.name-label { font-weight: 400; color: #333; }
.name-text { font-weight: 400; }

.yeyu-id { font-size: 12px; color: #666; margin: 0; line-height: 16px; }

.region { font-size: 12px; color: #666; margin: 0; line-height: 16px; }
.remark { font-size: 15px; color: #333; margin: 0; line-height: 20px; text-transform: uppercase; }

/* 操作按钮 */
.action-buttons {
  padding: 16px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 42px; /* 按钮高度42px */
  padding: 0 20px; /* 只设置左右内边距 */
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.action-btn.primary:hover {
  background: #06AD56;
}

/* 功能模块 */
.function-modules {
  background: transparent;
  margin-top: 5px; /*   -> 5px */
}

.module-item {
  display: flex;
  align-items: center;
  height: 42px; /* 容器高度42px */
  padding: 0 16px; /* 只设置左右内边距 */
  background: #fff;
  margin-bottom: 5px; /* 功能项之间5px间距 */
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 标签/电话/描述行样式（与模块项风格对齐） */
.tags-inline-row { display: flex; align-items: center; }
.item-value { color: #333; font-size: 16px; margin-left: auto; }
.tag-value { font-size: 13px; color: #666; margin-left: 4px; margin-right: auto; }
.phone-block { margin-bottom: 5px; }
.phone-item-row { margin-bottom: 0; display: flex; align-items: center; }
.phone-label { display: inline-block; width: 48px; color: #333; }
.phone-label.placeholder { visibility: hidden; }
.phone-item-row .item-value.phone { font-size: 16px; color: #333; margin-left: 0; }
/* 资料页描述内容 14px，字体与“新朋友”一致 */
.desc-value { font-size: 14px; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif; }

.module-item:last-child {
  margin-bottom: 0;
}

.module-item:hover {
  background: #f8f8f8;
}

.module-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 备注扩展信息块 */
.info-block { background: #fff; padding: 12px 16px; margin-top: 5px; }
.info-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.info-label { font-size: 12px; color: #666; flex-shrink: 0; }
.info-value { font-size: 14px; color: #333; }
.tags-row { align-items: flex-start; }
.tags-container { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-chip { background: #f5f5f5; color: #333; border-radius: 12px; padding: 3px 8px; font-size: 12px; }


/* 通话选择弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.call-modal {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  padding: 0;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-options {
  padding: 8px 0 20px;
}

.modal-option {
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: white;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: background-color 0.2s ease;
}

.modal-option:hover {
  background: #f8f8f8;
}

.modal-option.cancel {
  color: #ff4444;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.modal-option iconify-icon {
  color: #07C160;
}

.modal-option.cancel iconify-icon {
  color: #ff4444;
}

/* 调试信息 */
.debug-info {
  margin: 16px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 12px;
}

.debug-info h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.star-flag {
  color: #F6C02D;
  font-size: 18px;
  line-height: 1;
  position: absolute;
  right: 16px;
  top: 10px;
}

</style>

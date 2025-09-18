<template>
  <div class="mobile-contacts">
    <!-- 联系人列表 -->
    <div class="contacts-list">
      <!-- 功能入口 -->
      <div class="function-section">
        <div class="function-item" @click="goToNewFriends">
          <div class="function-icon">
            <iconify-icon icon="heroicons:user-plus" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('contacts.newFriends') }}</span>
          <div v-if="newFriendsCount > 0" class="badge">{{ newFriendsCount }}</div>
        </div>

        <div class="function-item" @click="goToMyGroups">
          <div class="function-icon group-icon">
            <iconify-icon icon="heroicons:user-group" width="20" style="color: #ffffff;"></iconify-icon>
          </div>
          <span>{{ $t('contacts.groupChats') }}</span>
        </div>
      </div>

      <!-- 联系人列表 -->
      <div class="contacts-section">
        <div
          v-for="contact in visibleContacts"
          :key="contact.id"
          class="contact-item-wrapper"
        >
          <div class="contact-item" @click="viewFriendProfile(contact)">
            <!-- 直接使用头像和昵称，无容器 -->
            <div class="contact-avatar">
              <CachedAvatar
                :src="getUserAvatarUrl(contact)"
                :alt="contact.nickname || contact.name"
                :custom-size="36"
                :rounded="false"
                :enable-cache="true"
                :show-online-status="false"
              />
            </div>
            <div class="contact-info inline-row">
              <span class="contact-name">{{ contact.nickname || contact.name || $t('contacts.unknownUser') }}</span>
              <span v-if="getSecondary(contact)" class="contact-desc">{{ getSecondary(contact) }}</span>
            </div>
          </div>
        </div>

        <!-- 加载更多指示器 -->
        <div v-if="hasMoreContacts" class="load-more" @click="loadMoreContacts">
          <span>{{ $t('contacts.loadMore') }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="visibleContacts.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:user-group" width="64" style="color: #cccccc;"></iconify-icon>
        <p>{{ $t('contacts.noContacts') }}</p>
        <p class="empty-tip">{{ $t('contacts.addFriendTip') }}</p>
      </div>

      <!-- 移除加载状态，实现即时显示 -->
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar />

    <!-- 添加菜单弹窗 -->
    <div v-if="showAddMenu" class="add-menu" @click="showAddMenu = false">
      <div class="add-menu-content" @click.stop>
        <div class="add-menu-item" @click="startGroupChat">
          <iconify-icon icon="heroicons:user-group" width="24" style="color: #07C160;"></iconify-icon>
          <span>发起群聊</span>
        </div>
        <div class="add-menu-item" @click="addFriend">
          <iconify-icon icon="heroicons:user-plus" width="24" style="color: #07C160;"></iconify-icon>
          <span>添加朋友</span>
        </div>
        <div class="add-menu-item" @click="scanQR">
          <iconify-icon icon="heroicons:qr-code" width="24" style="color: #07C160;"></iconify-icon>
          <span>扫一扫</span>
        </div>
        <div class="add-menu-item" @click="payment">
          <iconify-icon icon="heroicons:credit-card" width="24" style="color: #07C160;"></iconify-icon>
          <span>收付款</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUnifiedAvatar } from '../composables/useUnifiedAvatar'
import { contactsApi } from '../services/contactsApi'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'
import CachedAvatar from '../../../shared/components/CachedAvatar.vue'
import { apiClient } from '../../../shared/services/apiClient'


const router = useRouter()
const appStore = useAppStore()
const eventBus = inject('eventBus')

// 使用统一用户信息管理
const { getUserAvatarUrl } = useUnifiedAvatar()

// 响应式数据
const contacts = ref<any[]>([])
const visibleContacts = ref<any[]>([])
const loading = ref(false)
const newFriendsCount = ref(0)
// 本地读取备注包
const getSavedRemarkPack = (id: string | number) => {
  try { return JSON.parse(localStorage.getItem(`friend_remark_${id}`) || 'null') } catch { return null }
}

// 计算联系人副标题（描述优先，其次标签/电话）
const getSecondary = (c: any) => {
  const p = c.__savedRemarkPack || getSavedRemarkPack(c.id)
  if (p && p.description && String(p.description).trim()) return String(p.description).trim()
  if (p && Array.isArray(p.tags) && p.tags.length) return p.tags.join('、')
  if (p && Array.isArray(p.phones) && p.phones.length) return p.phones.join('、')
  return ''
}

// 懒加载后端备注包并合并到当前联系人项
const fetchedRemarkIds = new Set<string>()
const ensureRemarkPack = async (id: string | number) => {
  const key = String(id)
  if (!key) return
  if (fetchedRemarkIds.has(key)) return
  try {
    const existing = getSavedRemarkPack(key)
    if (existing && (existing.name || (existing.description && String(existing.description).trim()) || (Array.isArray(existing.tags) && existing.tags.length))) {
      fetchedRemarkIds.add(key)
      return
    }
  } catch {}
  fetchedRemarkIds.add(key)
  try {
    const resp = await apiClient.get<any>(`/contacts/${key}/remark-pack`)
    if (resp?.success && resp?.data) {
      const pack = resp.data
      const payload = {
        name: pack.remark || '',
        tags: Array.isArray(pack.tags) ? pack.tags : [],
        phones: Array.isArray(pack.phones) ? pack.phones : [],
        description: pack.description || ''
      }
      try { localStorage.setItem(`friend_remark_${key}`, JSON.stringify(payload)) } catch {}
      const idx = contacts.value.findIndex((x:any) => String(x.id) === key)
      if (idx >= 0) {
        const updated = { ...contacts.value[idx] }
        if (payload.name) {
          updated.remark = payload.name
          updated.nickname = payload.name
        }
        updated.__savedRemarkPack = payload
        contacts.value.splice(idx, 1, updated)
      }
      // 同步可见列表
      const vIdx = visibleContacts.value.findIndex((x:any) => String(x.id) === key)
      if (vIdx >= 0) {
        const updated = { ...visibleContacts.value[vIdx] }
        if (payload.name) {
          updated.remark = payload.name
          updated.nickname = payload.name
        }
        updated.__savedRemarkPack = payload
        visibleContacts.value.splice(vIdx, 1, updated)
      }
    }
  } catch {}
}

// 备注更新事件：局部刷新当前联系人
const onFriendRemarkUpdated = (e:any) => {
  try {
    const id = String(e?.id || '')
    if (!id) return
    const saved = e?.payload || getSavedRemarkPack(id)
    const idx = contacts.value.findIndex((c:any) => String(c.id) === id)
    if (idx >= 0 && saved) {
      const u = { ...contacts.value[idx] }
      u.remark = saved.name || ''
      u.nickname = saved.name || u.nickname || u.name
      u.__savedRemarkPack = saved
      contacts.value.splice(idx, 1, u)
    }
    const vIdx = visibleContacts.value.findIndex((c:any) => String(c.id) === id)
    if (vIdx >= 0 && saved) {
      const u = { ...visibleContacts.value[vIdx] }
      u.remark = saved.name || ''
      u.nickname = saved.name || u.nickname || u.name
      u.__savedRemarkPack = saved
      visibleContacts.value.splice(vIdx, 1, u)
    }
  } catch {}
}

const showAddMenu = ref(false)
const isPreloading = ref(false)

// 初始化缓存加载函数（延迟执行）
const initializeFromCache = () => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (data && Array.isArray(data) && Date.now() - timestamp < CACHE_DURATION * 1000) {
        console.log('📱 初始化时加载缓存数据:', data.length, '个联系人')
        contacts.value = data
        // 延迟调用resetVisibleContacts，确保函数已定义
        nextTick(() => {
          resetVisibleContacts()
        })
      }
    } catch (error) {
      console.warn('📱 初始化缓存加载失败:', error)
    }
  }
}

// 分批渲染配置
const BATCH_SIZE = 20 // 每批渲染20个联系人，减少批次
const currentBatch = ref(1)

// 计算属性
const hasMoreContacts = computed(() => {
  return visibleContacts.value && contacts.value && visibleContacts.value.length < contacts.value.length
})

// 缓存机制 - 使用统一缓存服务
const CACHE_KEY = 'contacts_list'
const CACHE_DURATION = 60 * 60 // 1小时缓存

// 头像处理已迁移到CachedAvatar组件

// 分批渲染函数
const updateVisibleContacts = () => {
  if (!contacts.value || !Array.isArray(contacts.value)) {
    visibleContacts.value = []

    return
  }

  const endIndex = currentBatch.value * BATCH_SIZE
  visibleContacts.value = contacts.value.slice(0, endIndex)
  console.log('📱 显示联系人:', visibleContacts.value.length, '/', contacts.value.length)
}

const loadMoreContacts = () => {
  currentBatch.value++
  updateVisibleContacts()
}

const resetVisibleContacts = () => {
  currentBatch.value = 1
  updateVisibleContacts()
}

// 基本方法
const goToNewFriends = () => {
  newFriendsCount.value = 0
  router.push('/new-friends')
}

const goToMyGroups = () => {
  router.push('/my-groups')
}

const viewFriendProfile = (contact: any) => {
  if (!contact || !contact.id) {
    console.error('❌ 好友ID无效:', contact?.id)
    appStore.showToast('好友信息无效', 'error')
    return
  }

  console.log('📋 跳转到好友资料页面:', `/friend-profile/${contact.id}`)
  console.log('📋 好友信息:', contact)
  router.push(`/friend-profile/${contact.id}`)
}

// 缓存相关函数已迁移到统一缓存服务

const saveContactsToCache = (data: any[]) => {
  try {
    // 简单的本地缓存
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
    console.log('📱 联系人数据已保存到本地缓存:', data.length, '个联系人')
  } catch (error) {
    console.warn('保存联系人缓存失败:', error)
  }
}

// 预加载联系人数据
const preloadContacts = async () => {
  if (isPreloading.value || loading.value) return

  isPreloading.value = true
  try {
    console.log('📱 预加载联系人数据...')
    const response = await contactsApi.getContacts()
    if (response?.data) {
      contacts.value = response.data
      resetVisibleContacts()
      saveContactsToCache(response.data)
      console.log('📱 预加载完成，联系人数量:', response.data.length)
    }
  } catch (error) {
    console.warn('📱 预加载失败:', error)
  } finally {
    isPreloading.value = false
  }
}

// 加载联系人数据 - 优化版本，立即显示
const loadContacts = async (forceRefresh = false) => {
  // 移除loading阻塞，允许并发加载

  // 简单的本地缓存检查
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {

        const { data, timestamp } = JSON.parse(cached)
        // 缓存1小时有效
        if (data && Array.isArray(data) && Date.now() - timestamp < CACHE_DURATION * 1000) {
          console.log('📱 使用本地缓存的联系人数据:', data.length, '个联系人')
          contacts.value = data
          resetVisibleContacts()
          // 后台懒加载备注包，确保换设备后也能展示备注/描述
          try { setTimeout(() => { contacts.value.forEach((c:any) => ensureRemarkPack(c.id)) }, 0) } catch {}
          return
        }

      } catch (error) {
        console.warn('📱 缓存解析失败:', error)
      }
    }
  }

  // 设置loading状态，但不阻塞显示
  loading.value = true
  try {
    console.log('📱 开始加载联系人数据...')

    const currentToken = appStore.token
    if (!currentToken) {
      console.log('⚠️ 没有token，跳过加载联系人')
      contacts.value = []
      resetVisibleContacts()
      return
    }

    const response = await contactsApi.getContacts()
    console.log('📱 联系人API响应:', response)
    console.log('📱 响应数据类型:', typeof response?.data)
    console.log('📱 响应数据内容:', response?.data)

    let contactsData = []

    if (response?.data) {
      if (Array.isArray(response.data)) {
        contactsData = response.data
        console.log('📱 使用 response.data 作为联系人数据')
      } else if (response.data.data && Array.isArray(response.data.data)) {
        contactsData = response.data.data
        console.log('📱 使用 response.data.data 作为联系人数据')
      } else {
        console.warn('📱 未知的数据结构:', response.data)
        // 尝试其他可能的数据结构
        if (response.data.contacts && Array.isArray(response.data.contacts)) {
          contactsData = response.data.contacts
          console.log('📱 使用 response.data.contacts 作为联系人数据')
        } else if (response.data.friends && Array.isArray(response.data.friends)) {
          contactsData = response.data.friends
          console.log('📱 使用 response.data.friends 作为联系人数据')
        }
      }

  // 备注更新事件：刷新单个联系人
  if (eventBus && eventBus.on) {
    eventBus.on('friendRemarkUpdated', onFriendRemarkUpdated)
  }

    }

    console.log('📱 提取的联系人数据:', contactsData)
    console.log('📱 联系人数据长度:', contactsData.length)

    const processedContacts = contactsData
      .filter((contact: any) => {
        // 保守过滤，避免把正常数据过滤掉导致“联系人不显示”
        const isValid = !!(contact && (contact.id || contact.user_id))
        if (!isValid) {
          console.log('📱 过滤掉无效联系人:', contact)
        }
        return isValid
      })
      .map((contact: any) => {
        const id = String(contact.id || contact.user_id)
        const saved = getSavedRemarkPack(id)
        const baseName = contact.remark || contact.nickname || contact.name || contact.yeyu_id || `YY${id}`
        const displayName = (saved?.name && String(saved.name).trim()) || baseName
        return {
          id,
          name: contact.name || contact.nickname || contact.yeyu_id || `YY${id}`,
          nickname: displayName,
          remark: saved?.name || contact.remark || '',
          avatar: contact.avatar || getUserAvatarUrl(contact),
          phone: contact.phone || '',
          yeyu_id: contact.yeyu_id || contact.yeyuId || `YY${id}`,
          region: contact.region || contact.location || '未知地区',
          __savedRemarkPack: saved || null
        }
      })

    console.log('📱 处理后的联系人数据:', processedContacts)
    console.log('📱 有效联系人数量:', processedContacts.length)

    // 兜底：如果经过处理为空但原始数据有内容，使用宽松映射，保证通讯录可见
    if (processedContacts.length === 0 && Array.isArray(contactsData) && contactsData.length > 0) {
      const fallback = contactsData.map((c:any) => {
        const id = String(c.id || c.user_id || '')
        return {
          id,
          name: c.name || c.nickname || c.yeyu_id || `YY${id}`,
          nickname: c.remark || c.nickname || c.name || c.yeyu_id || `YY${id}`,
          remark: c.remark || '',
          avatar: c.avatar || getUserAvatarUrl(c),
          phone: c.phone || '',
          yeyu_id: c.yeyu_id || c.yeyuId || `YY${id}`,
          region: c.region || c.location || '未知地区',
          __savedRemarkPack: null
        }
      }).filter((x:any) => x.id)
      console.warn('⚠️ 使用兜底联系人映射，数量:', fallback.length)
      contacts.value = fallback
    } else {
      contacts.value = processedContacts
    }

    // 保存到缓存
    saveContactsToCache(processedContacts)

    // 分批渲染
    resetVisibleContacts()
    // 后台懒加载备注包，确保换设备也能展示备注/描述
    try { setTimeout(() => { contacts.value.forEach((c:any) => ensureRemarkPack(c.id)) }, 0) } catch {}


    console.log('✅ 联系人加载成功:', contacts.value.length, '个联系人')

  } catch (error) {
    console.error('❌ 加载联系人失败:', error)
    contacts.value = []
    resetVisibleContacts()
    appStore.showToast('联系人加载失败', 'error')
  } finally {
    loading.value = false
  }
}

// 弹窗菜单功能
const startGroupChat = () => {
  router.push('/create-group')
  showAddMenu.value = false
}

const addFriend = () => {
  router.push('/add-friend')
  showAddMenu.value = false
}

const scanQR = () => {
  router.push('/scan')
  showAddMenu.value = false
}

const payment = () => {
  router.push('/payment-code')
  showAddMenu.value = false
}

// 手动刷新联系人数据
const refreshContacts = async () => {
  console.log('📱 手动刷新联系人数据')
  // 清除缓存
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem('contacts_last_update')
  // 强制重新加载
  await loadContacts(true)
  appStore.showToast('联系人列表已刷新', 'success')
}

onMounted(async () => {
  console.log('📱 通讯录页面已挂载')

  // 首先尝试初始化缓存数据
  initializeFromCache()

  // 监听顶部导航栏的添加按钮点击事件
  if (eventBus) {
    eventBus.on('showAddMenu', () => {
      console.log('📱 收到显示添加菜单事件')
      showAddMenu.value = true
    })
  }

  // 立即显示缓存数据，然后后台更新
  console.log('📱 立即加载缓存数据')
  await loadContacts(false) // 先加载缓存

  // 后台更新数据
  setTimeout(async () => {
    console.log('📱 后台更新数据')
    await loadContacts(true) // 后台强制刷新
  }, 100)
})

// 页面激活时重新加载数据（从其他页面返回时）
onActivated(async () => {
  console.log('📱 通讯录页面已激活')

  // 立即显示现有数据，无需等待
  if (contacts.value.length === 0) {
    console.log('📱 没有联系人数据，立即加载缓存')
    await loadContacts(false) // 立即加载缓存
  } else {
    console.log('📱 已有联系人数据，直接显示')
    resetVisibleContacts() // 确保显示数据
  }
})

onUnmounted(() => {
  // 清理事件监听
  if (eventBus) {
    eventBus.off('showAddMenu')
    eventBus.off('friendRemarkUpdated', onFriendRemarkUpdated)
  }
})
</script>

<style scoped>

.mobile-contacts {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #e5e5e5;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
}

.function-section {
  background-color: white;
  margin-bottom: 0;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  position: relative;
  height: 48px;
  background-color: white;
}

.function-item:hover {
  background-color: #f8f8f8;
}

.function-item span {
  font-size: 14px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}


.function-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background: #07C160;
}

.group-icon {
  background: #1989fa;
}

.contacts-section {
  background-color: white;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  height: 48px;
  box-sizing: border-box;
  background-color: white;
}

.contact-item:hover {
  background-color: #f8f8f8;
}

.contact-avatar {
  margin-right: 12px;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 36px;
}

.contact-name {
  font-size: 15px;
  font-weight: 400;
  color: #1a1a1a;
  line-height: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.contact-desc {
  margin-left: 0;
  font-size: 11px;
  color: #666;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tip {
  font-size: 14px;
  margin-top: 8px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.badge {
  background: #ff4757;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  margin-left: auto;
}

/* 添加菜单弹窗 */
.add-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 100px 20px 0 0;
}

.add-menu-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 140px;
}

.add-menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e0e0e0;
}

/* 保留所有分隔线，包括最后一个项目 */

.add-menu-item:hover {
  background-color: #f8f8f8;
}

.add-menu-item span {
  font-size: 14px;
  color: #333;
}

/* 加载更多样式 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
  transition: background-color 0.2s;
}

.load-more:hover {
  background-color: #f0f0f0;
}

.load-more:active {
  background-color: #e8e8e8;
}
</style>

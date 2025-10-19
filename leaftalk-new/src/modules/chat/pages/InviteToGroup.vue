<template>
  <div class="invite-to-group-page">
    <MobileTopBar
      title="邀请好友"
      :showBack="true"
      :rightButtons="topBarButtons"
      @back="goBack"
      @buttonClick="handleTopBarClick"
    />

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-bar">
        <!-- 搜索图标 - 只在没有选中头像时显示 -->
        <iconify-icon
          v-if="selectedFriends.length === 0"
          icon="heroicons:magnifying-glass"
          width="16"
          color="#999"
          class="search-icon"
        ></iconify-icon>

        <!-- 已选择的好友头像 -->
        <div v-if="selectedFriends.length > 0" class="selected-avatars">
          <div
            v-for="friend in selectedFriends"
            :key="friend.id"
            class="selected-avatar-item"
          >
            <img :src="friend.avatar" :alt="friend.name" />
          </div>
        </div>

        <!-- 搜索输入框 - 永远在头像后面 -->
        <input
          v-model="searchKeyword"
          :placeholder="selectedFriends.length > 0 ? '' : '搜索'"
          class="search-input"
        />
      </div>
    </div>

    <div class="page-content scroll-container">
      <!-- 好友列表 -->
      <div class="friends-list">
        <div v-if="filteredFriends.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-group" width="48" color="#ccc"></iconify-icon>
          <p>{{ searchKeyword ? '未找到匹配的好友' : '暂无可邀请的好友' }}</p>
        </div>

        <div v-else class="friend-items">
          <!-- 按字母分组显示 -->
          <template v-for="(group, letter) in groupedFriends" :key="letter">
            <div class="letter-section" :id="`letter-${letter}`">
              <div class="letter-header">{{ letter }}</div>
              <div
                v-for="friend in group"
                :key="friend.id"
                class="friend-item"
                :class="{ selected: isSelected(friend), disabled: friend.isInGroup }"
                @click="toggleFriend(friend)"
              >
                <!-- 勾选框 -->
                <div class="selection-indicator">
                  <div v-if="isSelected(friend)" class="selected-icon">
                    <iconify-icon icon="heroicons:check" width="12" color="white"></iconify-icon>
                  </div>
                  <div v-else-if="friend.isInGroup" class="disabled-icon">
                    <iconify-icon icon="heroicons:check" width="12" color="#ccc"></iconify-icon>
                  </div>
                  <div v-else class="unselected-icon"></div>
                </div>

                <!-- 头像 -->
                <div class="friend-avatar">
                  <img :src="friend.avatar" :alt="friend.name" />
                </div>

                <!-- 名称 -->
                <div class="friend-info">
                  <div class="friend-name">{{ friend.name }}</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 字母索引 -->
    <div class="letter-index">
      <div
        v-for="letter in availableLetters"
        :key="letter"
        class="index-letter"
        :class="{ active: activeLetter === letter }"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import pinyin from 'pinyin'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// 响应式数据
const searchKeyword = ref('')
const selectedFriends = ref<any[]>([])
const friends = ref<any[]>([])
const groupMemberIds = ref<number[]>([])
const activeLetter = ref<string>('')

// 顶部导航栏按钮
const topBarButtons = computed(() => {
  if (selectedFriends.value.length > 0) {
    return [{ text: '完成', action: 'complete' }]
  }
  return []
})

// 获取拼音首字母（支持星标分类）
const getFirstLetter = (friend: any): string => {
  // 星标朋友归类到 ★
  if (friend.isStarred) {
    return '★'
  }

  const name = friend.name
  if (!name) return '#'

  // 获取第一个字符
  const firstChar = name.charAt(0)

  // 如果是中文，转换为拼音
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    const pinyinArray = pinyin(name, { style: pinyin.STYLE_FIRST_LETTER })
    const firstLetter = pinyinArray[0][0].toUpperCase()

    if (/[A-Z]/.test(firstLetter)) {
      return firstLetter
    }
  }

  // 如果是英文字母
  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase()
  }

  // 其他符号归类到 #
  return '#'
}

// 计算属性 - 过滤后的好友列表
const filteredFriends = computed(() => {
  let filtered = friends.value

  // 按搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 按字母分组
const groupedFriends = computed(() => {
  const groups: Record<string, any[]> = {}

  filteredFriends.value.forEach(friend => {
    const letter = getFirstLetter(friend)
    if (!groups[letter]) {
      groups[letter] = []
    }
    groups[letter].push(friend)
  })

  // 排序每个分组内的好友
  Object.keys(groups).forEach(letter => {
    groups[letter].sort((a, b) => {
      const pinyinA = pinyin(a.name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      const pinyinB = pinyin(b.name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      return pinyinA.localeCompare(pinyinB)
    })
  })

  return groups
})

// 可用的字母索引（星标排在最前面）
const availableLetters = computed(() => {
  const letters = Object.keys(groupedFriends.value)

  return letters.sort((a, b) => {
    // ★ 排在最前面
    if (a === '★') return -1
    if (b === '★') return 1

    // # 排在最后面
    if (a === '#') return 1
    if (b === '#') return -1

    // A-Z 按字母顺序排序
    return a.localeCompare(b)
  })
})

// 方法
const goBack = () => {
  router.back()
}

const isSelected = (friend: any) => {
  return selectedFriends.value.some(f => f.id === friend.id)
}

const toggleFriend = (friend: any) => {
  if (friend.isInGroup) return // 已在群内的不能选择

  if (isSelected(friend)) {
    removeFriend(friend)
  } else {
    selectedFriends.value.push(friend)
  }
}

const removeFriend = (friend: any) => {
  const index = selectedFriends.value.findIndex(f => f.id === friend.id)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  }
}

// 处理顶部导航栏按钮点击
const handleTopBarClick = (button: any) => {
  if (button.action === 'complete') {
    confirmInvite()
  }
}

const confirmInvite = async () => {
  if (selectedFriends.value.length === 0) return

  try {
    const groupId = route.params.groupId as string
    const inviteeIds = selectedFriends.value.map(f => f.id)

    console.log('📨 发送群邀请:', { groupId, inviteeIds })

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/invite-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ inviteeIds })
    })

    const result = await response.json()

    if (result.success) {
      appStore.showToast(result.message || '邀请已发送', 'success')
      selectedFriends.value = []

      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      appStore.showToast(result.error || '邀请失败', 'error')
    }
  } catch (error) {
    console.error('❌ 发送邀请失败:', error)
    appStore.showToast('邀请失败', 'error')
  }
}

// 滚动到指定字母
const scrollToLetter = (letter: string) => {
  activeLetter.value = letter
  const element = document.getElementById(`letter-${letter}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 获取显示名称（优先级：备注名 > 群昵称 > 昵称）
const getDisplayName = (friend: any): string => {
  const groupId = route.params.groupId as string

  // 1. 优先使用备注名
  if (friend.remark && friend.remark !== 'null' && friend.remark !== 'undefined') {
    return friend.remark
  }

  // 2. 使用群昵称
  const groupNicknameKey = `group_member_nickname_${groupId}_${friend.id}`
  const groupNickname = localStorage.getItem(groupNicknameKey)
  if (groupNickname && groupNickname !== 'null' && groupNickname !== 'undefined') {
    // 如果是JSON字符串，尝试解析
    try {
      const parsed = JSON.parse(groupNickname)
      if (typeof parsed === 'string') {
        return parsed
      }
    } catch {
      // 不是JSON，直接返回
      return groupNickname
    }
  }

  // 3. 使用真实昵称
  return friend.nickname || `用户${friend.id}`
}

// 检查是否星标朋友
const isStarred = (friendId: number): boolean => {
  const starKey = `friend_star_${friendId}`
  return localStorage.getItem(starKey) === 'true'
}

// 加载好友列表
const loadFriends = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/contacts', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()

    if (result.success && result.data) {
      friends.value = result.data.map((friend: any) => {
        const displayName = getDisplayName(friend)
        return {
          id: friend.id,
          name: displayName,
          avatar: friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`,
          isInGroup: groupMemberIds.value.includes(friend.id),
          isStarred: isStarred(friend.id)
        }
      })

      console.log('✅ 加载好友列表成功:', friends.value.length)
    }
  } catch (error) {
    console.error('❌ 加载好友列表失败:', error)
  }
}

// 加载群成员ID列表
const loadGroupMembers = async () => {
  try {
    const groupId = route.params.groupId as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()

    if (result.success && result.data) {
      groupMemberIds.value = result.data.map((m: any) => m.id)
      console.log('✅ 加载群成员列表成功:', groupMemberIds.value.length)
    }
  } catch (error) {
    console.error('❌ 加载群成员列表失败:', error)
  }
}

// 监听滚动，更新激活的字母
const handleScroll = () => {
  const container = document.querySelector('.page-content')
  if (!container) return

  const scrollTop = container.scrollTop
  const letterSections = document.querySelectorAll('.letter-section')

  // 找到当前可见的第一个分组
  for (let i = 0; i < letterSections.length; i++) {
    const section = letterSections[i] as HTMLElement
    const sectionTop = section.offsetTop - container.getBoundingClientRect().top - 75 - 42 // 减去顶部导航栏和搜索栏高度

    if (sectionTop <= scrollTop + 10) {
      const letter = section.id.replace('letter-', '')
      activeLetter.value = letter
    }
  }
}

// 初始化激活字母（默认选中第一个）
const initActiveLetter = () => {
  if (availableLetters.value.length > 0) {
    activeLetter.value = availableLetters.value[0]
  }
}

onMounted(async () => {
  console.log('邀请好友页面加载:', route.params.groupId)
  await loadGroupMembers()
  await loadFriends()

  // 初始化激活字母
  setTimeout(() => {
    initActiveLetter()
  }, 100)

  // 添加滚动监听
  const container = document.querySelector('.page-content')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  // 移除滚动监听
  const container = document.querySelector('.page-content')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.invite-to-group-page {
  height: 100vh;
  background: #EDEDED;
  position: relative;
}

/* 搜索栏 */
.search-section {
  height: 42px;
  background: #EDEDED;
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin: 0;
}

.search-bar {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  padding: 0 8px;
  position: relative;
  gap: 6px;
}

.search-icon {
  flex-shrink: 0;
  pointer-events: none;
}

.selected-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.selected-avatar-item {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.selected-avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  height: 100%;
  background: transparent;
  padding: 0 4px;
  min-width: 50px;
}

/* 页面内容 */
.page-content {
  height: calc(100vh - 75px - 42px);
  overflow-y: auto;
  background: white;
}

/* 好友列表 */
.friends-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

/* 字母分组 */
.letter-section {
  margin: 0;
}

.letter-header {
  height: 25px;
  line-height: 25px;
  padding: 0 16px;
  background: #EDEDED;
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

/* 好友项 */
.friend-item {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.friend-item:active {
  background: #F0F0F0;
}

.friend-item.selected {
  background: #F0F0F0;
}

.friend-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 勾选框 - 在左侧 */
.selection-indicator {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unselected-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #D0D0D0;
  background: white;
}

.disabled-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 头像 - 在勾选框右侧 */
.friend-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 名称 */
.friend-info {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.friend-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 字母索引 */
.letter-index {
  position: fixed;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 100;
}

.index-letter {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #07C160;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  border-radius: 50%;
  transition: all 0.15s;
}

.index-letter.active {
  background: #07C160;
  color: white;
  font-weight: 600;
  width: 16px;
  height: 16px;
  font-size: 10px;
}

.index-letter:active {
  background: #07C160;
  color: white;
  font-weight: 600;
  width: 16px;
  height: 16px;
  font-size: 10px;
}
</style>

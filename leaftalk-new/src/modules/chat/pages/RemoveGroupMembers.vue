<template>
  <div class="remove-group-members-page">
    <MobileTopBar
      title="移除群成员"
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
          v-if="selectedMembers.length === 0"
          icon="heroicons:magnifying-glass"
          width="16"
          color="#999"
          class="search-icon"
        ></iconify-icon>

        <!-- 已选择的成员头像 -->
        <div v-if="selectedMembers.length > 0" class="selected-avatars">
          <div
            v-for="member in selectedMembers"
            :key="member.id"
            class="selected-avatar-item"
          >
            <img :src="member.avatar" :alt="member.name" />
          </div>
        </div>

        <!-- 搜索输入框 -->
        <input
          v-model="searchKeyword"
          :placeholder="selectedMembers.length > 0 ? '' : '搜索'"
          class="search-input"
        />
      </div>
    </div>

    <div class="page-content scroll-container">
      <!-- 成员列表 -->
      <div class="members-list">
        <div v-if="filteredMembers.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-group" width="48" color="#ccc"></iconify-icon>
          <p>{{ searchKeyword ? '未找到匹配的成员' : '暂无可移除的成员' }}</p>
        </div>

        <div v-else class="member-items">
          <!-- 按字母分组显示 -->
          <template v-for="(group, letter) in groupedMembers" :key="letter">
            <div class="letter-section" :id="`letter-${letter}`">
              <div class="letter-header">{{ letter }}</div>
              <div
                v-for="member in group"
                :key="member.id"
                class="member-item"
                :class="{
                  selected: isSelected(member),
                  disabled: !canRemoveMember(member)
                }"
                @click="toggleMember(member)"
              >
                <!-- 勾选框 -->
                <div class="selection-indicator">
                  <div v-if="isSelected(member)" class="selected-icon">
                    <iconify-icon icon="heroicons:check" width="12" color="white"></iconify-icon>
                  </div>
                  <div v-else-if="!canRemoveMember(member)" class="disabled-icon"></div>
                  <div v-else class="unselected-icon"></div>
                </div>

                <!-- 头像 -->
                <div class="member-avatar">
                  <img :src="member.avatar" :alt="member.name" />
                </div>

                <!-- 名称 -->
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div v-if="member.role === 'owner' || member.role === 'creator'" class="member-role">群主</div>
                  <div v-else-if="member.role === 'admin'" class="member-role">管理员</div>
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
const selectedMembers = ref<any[]>([])
const members = ref<any[]>([])
const activeLetter = ref<string>('')
const currentUserRole = ref<string>('member') // 当前用户在群内的角色

// 顶部导航栏按钮
const topBarButtons = computed(() => {
  if (selectedMembers.value.length > 0) {
    return [{ text: '完成', action: 'complete' }]
  }
  return []
})

// 处理顶部导航栏按钮点击
const handleTopBarClick = (button: any) => {
  if (button.action === 'complete') {
    confirmRemove()
  }
}

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!searchKeyword.value) {
    return members.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return members.value.filter(member =>
    member.name.toLowerCase().includes(keyword) ||
    (member.yeyuId && member.yeyuId.toLowerCase().includes(keyword))
  )
})

// 按字母分组
const groupedMembers = computed(() => {
  const groups: Record<string, any[]> = {}

  filteredMembers.value.forEach(member => {
    const firstChar = getFirstLetter(member)
    if (!groups[firstChar]) {
      groups[firstChar] = []
    }
    groups[firstChar].push(member)
  })

  // 对每个分组内的成员按拼音排序
  Object.keys(groups).forEach(letter => {
    groups[letter].sort((a, b) => {
      const pinyinA = pinyin(a.name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      const pinyinB = pinyin(b.name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      return pinyinA.localeCompare(pinyinB)
    })
  })

  return groups
})

// 可用的字母列表（星标排在最前面）
const availableLetters = computed(() => {
  const letters = Object.keys(groupedMembers.value)

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

// 获取首字母（支持星标分类）
const getFirstLetter = (member: any): string => {
  // 星标朋友归类到 *
  if (member.isStarred) {
    return '★'
  }

  const name = member.name
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

// 判断是否选中
const isSelected = (member: any) => {
  return selectedMembers.value.some(m => m.id === member.id)
}

// 判断是否可以移除该成员
const canRemoveMember = (member: any): boolean => {
  console.log('🔍 检查移除权限:', {
    currentUserRole: currentUserRole.value,
    memberRole: member.role,
    memberName: member.name
  })

  // 群主可以移除任何人（除了自己，但自己已经被过滤掉了）
  // API返回的角色可能是 'owner' 或 'creator'
  if (currentUserRole.value === 'owner' || currentUserRole.value === 'creator') {
    console.log('✅ 群主可以移除任何人')
    return true
  }

  // 管理员不能移除群主和其他管理员
  if (currentUserRole.value === 'admin') {
    const canRemove = member.role !== 'owner' && member.role !== 'creator' && member.role !== 'admin'
    console.log('👮 管理员权限:', canRemove)
    return canRemove
  }

  // 普通成员不能移除任何人
  console.log('❌ 普通成员无权移除')
  return false
}

// 切换选中状态
const toggleMember = (member: any) => {
  // 检查是否可以移除
  if (!canRemoveMember(member)) {
    appStore.showToast('无权移除该成员', 'error')
    return
  }

  const index = selectedMembers.value.findIndex(m => m.id === member.id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(member)
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 滚动到指定字母
const scrollToLetter = (letter: string) => {
  activeLetter.value = letter
  const element = document.getElementById(`letter-${letter}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 监听滚动，更新激活的字母
const handleScroll = () => {
  const container = document.querySelector('.page-content')
  if (!container) return

  const scrollTop = container.scrollTop
  const letterSections = document.querySelectorAll('.letter-section')

  for (let i = 0; i < letterSections.length; i++) {
    const section = letterSections[i] as HTMLElement
    const sectionTop = section.offsetTop - container.getBoundingClientRect().top - 75 - 42

    if (sectionTop <= scrollTop + 10) {
      const letter = section.id.replace('letter-', '')
      activeLetter.value = letter
    }
  }
}

// 初始化激活字母
const initActiveLetter = () => {
  if (availableLetters.value.length > 0) {
    activeLetter.value = availableLetters.value[0]
  }
}

// 获取显示名称（优先级：备注名 > 群昵称 > 昵称）
const getDisplayName = (member: any): string => {
  const groupId = route.params.groupId as string

  // 1. 优先使用备注名
  const remarkKey = `friend_remark_${member.id}`
  const remark = localStorage.getItem(remarkKey)
  if (remark && remark !== 'null' && remark !== 'undefined') {
    // 如果是JSON字符串，尝试解析
    try {
      const parsed = JSON.parse(remark)
      if (typeof parsed === 'string') {
        return parsed
      }
    } catch {
      // 不是JSON，直接返回
      return remark
    }
  }

  // 2. 使用群昵称
  const groupNicknameKey = `group_member_nickname_${groupId}_${member.id}`
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
  return member.nickname || `用户${member.id}`
}

// 检查是否星标朋友
const isStarred = (memberId: number): boolean => {
  const starKey = `friend_star_${memberId}`
  return localStorage.getItem(starKey) === 'true'
}

// 加载群成员
const loadMembers = async () => {
  try {
    const groupId = route.params.groupId as string
    console.log('📋 加载群成员列表:', groupId)

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ 获取群成员成功:', result)
      console.log('📋 原始成员数据:', result.data)

      if (result.success && result.data) {
        // 获取当前用户的角色
        console.log('🔍 当前用户ID:', authStore.user?.id)
        const currentUser = result.data.find((m: any) => String(m.id) === String(authStore.user?.id))
        console.log('🔍 找到的当前用户:', currentUser)

        if (currentUser) {
          currentUserRole.value = currentUser.role || 'member'
          console.log('✅ 当前用户角色:', currentUserRole.value)
        } else {
          console.warn('⚠️ 未找到当前用户，默认角色为 member')
          currentUserRole.value = 'member'
        }

        // 排除当前用户自己
        members.value = result.data
          .filter((m: any) => String(m.id) !== String(authStore.user?.id))
          .map((m: any) => {
            const displayName = getDisplayName(m)
            console.log('📝 处理成员:', { id: m.id, name: displayName, role: m.role })
            return {
              id: m.id,
              name: displayName,
              avatar: m.avatar || '/default-avatar.png',
              yeyuId: m.yeyu_id,
              role: m.role,
              isStarred: isStarred(m.id)
            }
          })

        console.log('✅ 处理后的成员列表:', members.value)
        console.log('✅ 最终当前用户角色:', currentUserRole.value)
      }
    } else {
      console.error('❌ 获取群成员失败:', response.status)
      appStore.showToast('获取群成员失败', 'error')
    }
  } catch (error) {
    console.error('❌ 加载群成员失败:', error)
    appStore.showToast('加载失败，请重试', 'error')
  }
}

// 确认移除
const confirmRemove = async () => {
  if (selectedMembers.value.length === 0) return

  try {
    const groupId = route.params.groupId as string
    const userIds = selectedMembers.value.map(m => m.id)

    console.log('🚫 移除群成员:', { groupId, userIds })

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/remove-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ userIds })
    })

    const result = await response.json()

    if (result.success) {
      appStore.showToast(result.message || '移除成功', 'success')
      selectedMembers.value = []

      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      appStore.showToast(result.message || '移除失败', 'error')
    }
  } catch (error) {
    console.error('❌ 移除失败:', error)
    appStore.showToast('移除失败，请重试', 'error')
  }
}

onMounted(async () => {
  console.log('移除群成员页面加载:', route.params.groupId)
  await loadMembers()

  setTimeout(() => {
    initActiveLetter()
  }, 100)

  const container = document.querySelector('.page-content')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  const container = document.querySelector('.page-content')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.remove-group-members-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #EDEDED;
}

/* 搜索栏 */
.search-section {
  background: #EDEDED;
  padding: 0 16px;
  height: 42px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-bar {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  padding: 0 8px;
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

.search-input::placeholder {
  color: #999;
}

/* 页面内容 */
.page-content {
  flex: 1;
  overflow-y: auto;
  background: #EDEDED;
}

.scroll-container {
  -webkit-overflow-scrolling: touch;
}

/* 成员列表 */
.members-list {
  background: white;
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

.member-items {
  background: white;
}

/* 字母分组 */
.letter-section {
  background: white;
}

.letter-header {
  height: 25px;
  line-height: 25px;
  padding: 0 16px;
  background: #F7F7F7;
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

/* 成员项 */
.member-item {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:active {
  background: #F7F7F7;
}

.member-item.selected {
  background: #F0F9FF;
}

.member-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.member-item.disabled:active {
  background: white;
}

/* 勾选框 */
.selection-indicator {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  flex-shrink: 0;
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
  border: 1px solid #D9D9D9;
  background: white;
}

.disabled-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #E0E0E0;
  background: #F5F5F5;
}

/* 头像 */
.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 成员信息 */
.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-role {
  font-size: 11px;
  color: #999;
  background: #F0F0F0;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
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
}

.index-letter:active {
  background: #07C160;
  color: white;
  font-weight: 600;
}
</style>


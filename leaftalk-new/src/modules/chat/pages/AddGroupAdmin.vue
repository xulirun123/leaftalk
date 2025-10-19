<template>
  <div class="page">
    <!-- 搜索框容器 -->
    <div class="search-container">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" style="color: #999;"></iconify-icon>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索"
          class="search-input"
        />
        <iconify-icon
          v-if="searchKeyword"
          icon="heroicons:x-circle-solid"
          width="16"
          style="color: #999; cursor: pointer;"
          @click="searchKeyword = ''"
        ></iconify-icon>
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="members-container">
      <!-- 分类列表 -->
      <div class="members-list" ref="membersListRef">
        <!-- 星标成员 -->
        <div v-if="starredMembers.length > 0" class="member-category">
          <div class="category-header" :id="`category-star`">
            <iconify-icon icon="heroicons:star-solid" width="14" style="color: #ffd700;"></iconify-icon>
          </div>
          <div
            v-for="member in starredMembers"
            :key="member.id"
            class="member-item"
            :class="{ selected: selectedMembers.includes(member.id) || member.isAdmin, disabled: member.isAdmin }"
            @click="toggleMember(member.id)"
          >
            <div class="member-checkbox">
              <div v-if="selectedMembers.includes(member.id) || member.isAdmin" class="checkbox-checked">
                <iconify-icon icon="heroicons:check" width="14" style="color: #fff;"></iconify-icon>
              </div>
              <div v-else class="checkbox-unchecked"></div>
            </div>
            <img :src="member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`" :alt="member.displayName" class="member-avatar" />
            <div class="member-info">
              <div class="member-name" :class="{ disabled: member.isAdmin }">{{ member.displayName }}</div>
            </div>
          </div>
        </div>

        <!-- 字母分类 -->
        <div v-for="letter in sortedLetters" :key="letter" class="member-category">
          <div class="category-header" :id="`category-${letter}`">{{ letter }}</div>
          <div
            v-for="member in categorizedMembers[letter]"
            :key="member.id"
            class="member-item"
            :class="{ selected: selectedMembers.includes(member.id) || member.isAdmin, disabled: member.isAdmin }"
            @click="toggleMember(member.id)"
          >
            <div class="member-checkbox">
              <div v-if="selectedMembers.includes(member.id) || member.isAdmin" class="checkbox-checked">
                <iconify-icon icon="heroicons:check" width="14" style="color: #fff;"></iconify-icon>
              </div>
              <div v-else class="checkbox-unchecked"></div>
            </div>
            <img :src="member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`" :alt="member.displayName" class="member-avatar" />
            <div class="member-info">
              <div class="member-name" :class="{ disabled: member.isAdmin }">{{ member.displayName }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 字母索引 -->
      <div class="letter-index">
        <div
          v-if="starredMembers.length > 0"
          class="index-item"
          :class="{ active: currentLetter === 'star' }"
          @click="scrollToCategory('star')"
        >
          <iconify-icon icon="heroicons:star-solid" width="10" style="color: currentColor;"></iconify-icon>
        </div>
        <div
          v-for="letter in sortedLetters"
          :key="letter"
          class="index-item"
          :class="{ active: currentLetter === letter }"
          @click="scrollToCategory(letter)"
        >
          {{ letter }}
        </div>
      </div>
    </div>

    <!-- 底部确认按钮 -->
    <div class="bottom-bar" v-if="selectedMembers.length > 0">
      <button class="confirm-btn" @click="confirmAdd">
        确定（{{ selectedMembers.length }}）
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import pinyin from 'pinyin'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const groupId = ref(route.params.groupId as string)
const searchKeyword = ref('')
const members = ref<any[]>([])
const selectedMembers = ref<number[]>([])
const currentLetter = ref('')
const membersListRef = ref<HTMLElement | null>(null)

// 加载群成员
const loadMembers = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // 包含所有成员，但排除自己，标记已经是管理员的
        const currentUserId = authStore.user?.id
        members.value = result.data
          .filter((m: any) => m.id !== currentUserId) // 排除自己
          .map((m: any) => ({
            ...m,
            displayName: m.group_nickname || m.nickname || `用户${m.id}`,
            isStarred: false, // TODO: 从后端获取星标状态
            isAdmin: m.role === 'admin' || m.role === 'owner' || m.role === 'creator'
          }))
        console.log('✅ 群成员加载成功:', members.value)
      }
    }
  } catch (error) {
    console.error('❌ 加载群成员失败:', error)
  }
}

// 获取拼音首字母
const getFirstLetter = (name: string): string => {
  if (!name) return '#'

  const firstChar = name.charAt(0)

  // 检查是否是中文字符
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    try {
      const pinyinArray = pinyin(firstChar, { style: pinyin.STYLE_FIRST_LETTER })
      const letter = pinyinArray[0][0].toUpperCase()
      return /[A-Z]/.test(letter) ? letter : '#'
    } catch (e) {
      return '#'
    }
  }

  // 检查是否是英文字母
  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase()
  }

  return '#'
}

// 星标成员
const starredMembers = computed(() => {
  return filteredMembers.value.filter(m => m.isStarred)
})

// 过滤后的成员
const filteredMembers = computed(() => {
  if (!searchKeyword.value) {
    return members.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return members.value.filter(m =>
    m.displayName.toLowerCase().includes(keyword) ||
    m.nickname?.toLowerCase().includes(keyword)
  )
})

// 分类后的成员（不包含星标）
const categorizedMembers = computed(() => {
  const result: Record<string, any[]> = {}

  filteredMembers.value
    .filter(m => !m.isStarred)
    .forEach(member => {
      const letter = getFirstLetter(member.displayName)
      if (!result[letter]) {
        result[letter] = []
      }
      result[letter].push(member)
    })

  // 对每个分类内的成员按拼音排序
  Object.keys(result).forEach(letter => {
    result[letter].sort((a, b) => {
      return a.displayName.localeCompare(b.displayName, 'zh-CN')
    })
  })

  return result
})

// 排序后的字母列表
const sortedLetters = computed(() => {
  const letters = Object.keys(categorizedMembers.value)
  return letters.sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })
})

// 切换选中状态
const toggleMember = (memberId: number) => {
  // 检查是否已经是管理员
  const member = members.value.find(m => m.id === memberId)
  if (member?.isAdmin) {
    appStore.showToast('该成员已经是管理员', 'error')
    return
  }

  const index = selectedMembers.value.indexOf(memberId)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    // 检查是否超过最大管理员数量
    if (selectedMembers.value.length >= 3) {
      appStore.showToast('最多只能设置3个管理员', 'error')
      return
    }
    selectedMembers.value.push(memberId)
  }
}

// 滚动到指定分类
const scrollToCategory = (letter: string) => {
  const categoryId = letter === 'star' ? 'category-star' : `category-${letter}`
  const element = document.getElementById(categoryId)
  if (element && membersListRef.value) {
    const container = membersListRef.value
    const offsetTop = element.offsetTop - container.offsetTop
    container.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    })
    currentLetter.value = letter
  }
}

// 监听滚动，更新当前字母
const handleScroll = () => {
  if (!membersListRef.value) return

  const container = membersListRef.value
  const scrollTop = container.scrollTop

  // 检查星标分类
  if (starredMembers.value.length > 0) {
    const starElement = document.getElementById('category-star')
    if (starElement && scrollTop < starElement.offsetTop + starElement.offsetHeight) {
      currentLetter.value = 'star'
      return
    }
  }

  // 检查字母分类
  for (const letter of sortedLetters.value) {
    const element = document.getElementById(`category-${letter}`)
    if (element) {
      const offsetTop = element.offsetTop - container.offsetTop
      if (scrollTop >= offsetTop - 10) {
        currentLetter.value = letter
      }
    }
  }
}

// 确认添加
const confirmAdd = async () => {
  if (selectedMembers.value.length === 0) {
    appStore.showToast('请选择要添加的成员', 'error')
    return
  }

  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        memberIds: selectedMembers.value
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('添加成功', 'success')
        router.back()
      } else {
        appStore.showToast(result.error || '添加失败', 'error')
      }
    }
  } catch (error) {
    console.error('❌ 添加管理员失败:', error)
    appStore.showToast('添加失败', 'error')
  }
}

onMounted(async () => {
  await loadMembers()

  // 设置默认选中第一个字母
  await nextTick()
  if (starredMembers.value.length > 0) {
    currentLetter.value = 'star'
  } else if (sortedLetters.value.length > 0) {
    currentLetter.value = sortedLetters.value[0]
  }

  // 监听滚动
  if (membersListRef.value) {
    membersListRef.value.addEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

/* 搜索框容器 */
.search-container {
  background: #fff;
  padding: 3px 16px;
  height: 36px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-box {
  height: 30px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  flex: 1;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

/* 成员容器 */
.members-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fff;
}

.members-list {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 100px;
}

/* 分类 */
.member-category {
  margin-bottom: 0;
}

.category-header {
  height: 25px;
  padding: 0 16px;
  background: #f5f5f5;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
}

/* 成员项 */
.member-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f9f9f9;
}

.member-item.selected {
  background: #f0f9ff;
}

.member-item.disabled {
  cursor: not-allowed;
}

.member-checkbox {
  margin-right: 12px;
  flex-shrink: 0;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  margin-right: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-name.disabled {
  color: #999;
}

.checkbox-unchecked {
  width: 18px;
  height: 18px;
  border: 2px solid #333;
  border-radius: 50%;
}

.checkbox-checked {
  width: 18px;
  height: 18px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 字母索引 */
.letter-index {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 2;
}

.index-item {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.index-item.active {
  background: #07c160;
  color: #fff;
  width: 18px;
  height: 18px;
  font-size: 11px;
  font-weight: 500;
}

/* 底部确认按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  z-index: 10;
}

.confirm-btn {
  width: 100%;
  height: 44px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #06ad56;
}
</style>


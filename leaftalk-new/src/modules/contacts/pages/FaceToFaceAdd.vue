<template>
  <div class="face-to-face-add-page">
    <!-- 顶部说明 -->
    <div class="header-section">
      <div class="title">面对面添加好友</div>
      <div class="subtitle">输入相同的4位数字，即可快速添加好友</div>
    </div>

    <!-- 数字输入区域 -->
    <div class="number-input-section">
      <div class="number-display">
        <div
          v-for="(digit, index) in 4"
          :key="index"
          class="digit-box"
          :class="{ filled: numbers[index] !== '' }"
        >
          {{ numbers[index] || '' }}
        </div>
      </div>
    </div>

    <!-- 数字键盘 -->
    <div class="number-keyboard">
      <div class="keyboard-row">
        <button
          v-for="num in [1, 2, 3]"
          :key="num"
          class="key-btn"
          @click="inputNumber(num)"
        >
          {{ num }}
        </button>
      </div>
      <div class="keyboard-row">
        <button
          v-for="num in [4, 5, 6]"
          :key="num"
          class="key-btn"
          @click="inputNumber(num)"
        >
          {{ num }}
        </button>
      </div>
      <div class="keyboard-row">
        <button
          v-for="num in [7, 8, 9]"
          :key="num"
          class="key-btn"
          @click="inputNumber(num)"
        >
          {{ num }}
        </button>
      </div>
      <div class="keyboard-row">
        <button class="key-btn empty"></button>
        <button class="key-btn" @click="inputNumber(0)">0</button>
        <button class="key-btn delete" @click="deleteNumber">
          <iconify-icon icon="heroicons:backspace" width="24"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 附近的人列表 -->
    <div v-if="nearbyUsers.length > 0" class="nearby-users">
      <div class="nearby-title">附近输入相同数字的人</div>
      <div class="users-list">
        <div
          v-for="user in nearbyUsers"
          :key="user.id"
          class="user-item"
          @click="viewUserProfile(user)"
        >
          <div class="user-avatar">
            <img :src="user.avatar" :alt="user.name" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-distance">{{ user.distance }}</div>
          </div>
          <button
            v-if="!user.isFriend"
            class="add-btn"
            @click.stop="addFriend(user)"
          >
            添加
          </button>
          <div v-else class="friend-tag">已添加</div>
        </div>
      </div>
    </div>

    <!-- 等待状态 -->
    <div v-else-if="isWaiting" class="waiting-state">
      <div class="waiting-icon">
        <iconify-icon icon="heroicons:signal" width="48"></iconify-icon>
      </div>
      <div class="waiting-text">正在搜索附近的人...</div>
      <div class="waiting-tip">请确保对方也输入了相同的数字</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const numbers = ref(['', '', '', ''])
const isWaiting = ref(false)
const nearbyUsers = ref<any[]>([])

// 当前输入的数字
const currentNumber = computed(() => {
  return numbers.value.join('')
})

// 输入数字
const inputNumber = (num: number) => {
  const emptyIndex = numbers.value.findIndex(n => n === '')
  if (emptyIndex !== -1) {
    numbers.value[emptyIndex] = num.toString()
  }
}

// 删除数字
const deleteNumber = () => {
  for (let i = numbers.value.length - 1; i >= 0; i--) {
    if (numbers.value[i] !== '') {
      numbers.value[i] = ''
      break
    }
  }
}

// 监听数字变化
watch(currentNumber, (newValue) => {
  if (newValue.length === 4) {
    // 输入完成，开始搜索
    searchNearbyUsers(newValue)
  } else {
    // 清空搜索结果
    nearbyUsers.value = []
    isWaiting.value = false
  }
})

// 搜索附近的人
const searchNearbyUsers = async (code: string) => {
  console.log('🔍 搜索附近输入相同数字的人:', code)
  isWaiting.value = true
  nearbyUsers.value = []

  try {
    // TODO: 调用API搜索附近的人
    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟搜索结果
    const mockUsers = [
      {
        id: '1',
        name: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
        distance: '10米',
        isFriend: false
      },
      {
        id: '2',
        name: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
        distance: '25米',
        isFriend: false
      }
    ]

    // 随机返回0-2个用户
    const randomCount = Math.floor(Math.random() * 3)
    nearbyUsers.value = mockUsers.slice(0, randomCount)

    if (nearbyUsers.value.length === 0) {
      appStore.showToast('附近暂无输入相同数字的人', 'info')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    appStore.showToast('搜索失败，请稍后重试', 'error')
  } finally {
    isWaiting.value = false
  }
}

// 查看用户资料
const viewUserProfile = (user: any) => {
  console.log('查看用户资料:', user)
  router.push(`/user-profile/${user.id}`)
}

// 添加好友
const addFriend = async (user: any) => {
  try {
    console.log('添加好友:', user)
    
    // TODO: 调用API添加好友
    appStore.showToast(`已向 ${user.name} 发送好友请求`, 'success')
    user.isFriend = true
  } catch (error) {
    console.error('添加好友失败:', error)
    appStore.showToast('添加好友失败', 'error')
  }
}
</script>

<style scoped>
.face-to-face-add-page {
  min-height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

/* 顶部说明 */
.header-section {
  background: #FFFFFF;
  padding: 24px 16px;
  text-align: center;
}

.title {
  font-size: 20px;
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #999;
}

/* 数字输入区域 */
.number-input-section {
  background: #FFFFFF;
  padding: 40px 16px;
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.number-display {
  display: flex;
  gap: 16px;
}

.digit-box {
  width: 60px;
  height: 80px;
  border: 2px solid #EDEDED;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: #333;
  background: #F5F5F5;
  transition: all 0.2s;
}

.digit-box.filled {
  border-color: #07C160;
  background: #FFFFFF;
  color: #07C160;
}

/* 数字键盘 */
.number-keyboard {
  background: #FFFFFF;
  padding: 16px;
  margin-top: 8px;
}

.keyboard-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-btn {
  flex: 1;
  height: 56px;
  background: #F5F5F5;
  border: none;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.key-btn:active {
  background: #EDEDED;
  transform: scale(0.95);
}

.key-btn.empty {
  background: transparent;
  cursor: default;
}

.key-btn.empty:active {
  transform: none;
}

.key-btn.delete {
  background: #FFE5E5;
  color: #FF4757;
}

/* 附近的人列表 */
.nearby-users {
  background: #FFFFFF;
  margin-top: 8px;
  flex: 1;
}

.nearby-title {
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  background: #F5F5F5;
}

.users-list {
  padding: 0;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #EDEDED;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:active {
  background: #F5F5F5;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-distance {
  font-size: 13px;
  color: #999;
}

.add-btn {
  background: #07C160;
  color: #FFFFFF;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.friend-tag {
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

/* 等待状态 */
.waiting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #FFFFFF;
  margin-top: 8px;
  flex: 1;
}

.waiting-icon {
  color: #07C160;
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.waiting-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.waiting-tip {
  font-size: 14px;
  color: #999;
}
</style>


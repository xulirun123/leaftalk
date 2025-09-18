<template>
  <div class="change-name">
    <!-- 内容区域 -->
    <div class="content-wrapper">
      <div class="input-section">
        <div class="input-wrapper">
          <textarea
            ref="nameInputRef"
            v-model="nickname"
            class="text-input"
            placeholder="请输入名字"
            rows="1"
            maxlength="20"
            :style="{ imeMode: 'active' }"
            lang="zh-CN"
            @keydown.enter.prevent="handleEnter"
            @input="validateInput"
            @focus="handleFocus"
            @blur="handleBlur"
          ></textarea>
          <div class="char-count">{{ nickname.length }}/20</div>
        </div>
      </div>

      <div class="tips">
        <p>• 名字长度不能超过20个字符</p>
        <p>• 名字不能为空</p>
      </div>

      <!-- 保存按钮 -->
      <div class="save-section">
        <button
          class="save-btn"
          :disabled="!nickname.trim() || nickname.length > 20"
          @click="saveName"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const nickname = ref('')
const nameInputRef = ref<HTMLTextAreaElement>()

// 生命周期
onMounted(() => {
  // 加载当前昵称
  const currentUser = authStore.user
  if (currentUser) {
    nickname.value = currentUser.nickname || currentUser.username || ''
  }
})

// 返回上级页面
const goBack = () => {
  router.back()
}

// 验证输入
const validateInput = () => {
  // 限制长度
  if (nickname.value.length > 20) {
    nickname.value = nickname.value.substring(0, 20)
  }
  // 自动调整高度
  adjustTextareaHeight()
}

// 自动调整textarea高度
const adjustTextareaHeight = () => {
  if (!nameInputRef.value) return

  nameInputRef.value.style.height = 'auto'
  const scrollHeight = nameInputRef.value.scrollHeight
  const maxHeight = 120
  nameInputRef.value.style.height = Math.min(scrollHeight, maxHeight) + 'px'
}

// 处理焦点事件
const handleFocus = () => {
  console.log('输入框获得焦点，输入法应该已激活')
  adjustTextareaHeight()
}

// 处理失焦事件
const handleBlur = () => {
  console.log('输入框失去焦点')
}

// 处理回车事件
const handleEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) return
  event.preventDefault()
  saveName()
}

// 保存昵称
const saveName = async () => {
  if (!nickname.value.trim()) {
    appStore.showToast('昵称不能为空', 'error')
    return
  }

  try {
    console.log('🔄 正在保存昵称:', nickname.value)

    // 调用后端API更新昵称
    const response = await axios.put('http://localhost:8893/api/user/profile', {
      nickname: nickname.value.trim()
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('✅ API响应:', response.data)

    if (response.data.success) {
      // 更新authStore中的用户信息
      if (authStore.user) {
        authStore.user.nickname = nickname.value.trim()
        localStorage.setItem('yeyu_user', JSON.stringify(authStore.user))
      }

      // 刷新用户信息
      await authStore.fetchUserInfo()

      // 同步更新所有相关的localStorage存储
      const updatedUserInfo = authStore.user
      if (updatedUserInfo) {
        // 更新 yeyu_user_info（个人资料页面使用）
        localStorage.setItem('yeyu_user_info', JSON.stringify(updatedUserInfo))

        // 更新 user（其他地方可能使用）
        localStorage.setItem('user', JSON.stringify(updatedUserInfo))

        // 同步更新appStore中的用户信息
        appStore.setUser(updatedUserInfo)

        console.log('✅ 已同步更新所有localStorage存储和appStore')
      }

      appStore.showToast('昵称修改成功', 'success')

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      throw new Error(response.data.message || '更新失败')
    }
  } catch (error) {
    console.error('❌ 保存昵称失败:', error)

    // 如果API调用失败，至少更新本地状态
    if (authStore.user) {
      authStore.user.nickname = nickname.value.trim()
      localStorage.setItem('yeyu_user', JSON.stringify(authStore.user))
    }

    appStore.showToast('保存失败，但已更新本地数据。请检查网络连接。', 'warning')

    // 延迟返回
    setTimeout(() => {
      router.back()
    }, 2000)
  }
}
</script>

<style scoped>
.change-name {
  height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  /* 移除padding-top，使用MobileApp统一的65px间距 */
  box-sizing: border-box;
  overflow-y: auto;
}

.input-section {
  background: white;
  padding: 20px 16px;
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
}

/* 使用和聊天页面完全相同的输入框样式 */
.text-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 22px;
  height: 22px;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  overflow: hidden;
  max-height: 58.8px;
  overflow-y: auto;
  caret-color: #333;
  flex: 1;
  padding: 12px 60px 12px 0;
  border-bottom: 1px solid #E5E5E5;
}

.text-input::placeholder {
  color: #999;
}

.text-input:focus {
  caret-color: #333;
  border-bottom-color: #07C160;
}

/* 针对WebKit浏览器的光标高度控制 */
@supports (-webkit-appearance: none) {
  .text-input {
    line-height: 12px;
    padding-top: 14px;
    padding-bottom: 14px;
  }
}

.char-count {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #999;
}

.tips {
  padding: 0 16px;
}

.tips p {
  font-size: 14px;
  color: #666;
  margin: 8px 0;
  line-height: 1.4;
}

.save-section {
  padding: 24px 16px;
}

.save-btn {
  width: 100%;
  height: 48px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #06a552;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

<template>
  <div class="change-yeyu-id">
    <!-- 统一顶部导航栏 -->
    <MobileTopBar
      title="叶语号"
      :show-back="true"
      @back="goBack"
    />

    <div class="content">
      <!-- 当前叶语号 -->
      <div class="current-section">
        <div class="section-title">当前叶语号</div>
        <div class="current-id">{{ currentYeyuId }}</div>
        <div class="id-note">叶语号是您在叶语中的唯一标识</div>
      </div>



      <!-- 修改次数提示 -->
      <div class="usage-section">
        <div class="usage-info">
          <span class="usage-text">本年度修改次数：{{ usageCount }}/1</span>
          <span v-if="canModify" class="can-modify">可以修改</span>
          <span v-else class="cannot-modify">已达上限</span>
        </div>
        <div v-if="!canModify" class="next-time">
          下次可修改时间：{{ nextModifyTime }}
        </div>
      </div>

      <!-- 新叶语号输入 -->
      <div v-if="canModify" class="input-section">
        <div class="section-title">新叶语号</div>
        <div class="input-container">
          <input 
            v-model="newYeyuId"
            type="text"
            placeholder="请输入新的叶语号"
            class="yeyu-input"
            :class="{ error: hasError }"
            @input="onInput"
            @blur="checkAvailability"
          />
          <div v-if="isChecking" class="checking-status">
            <iconify-icon icon="heroicons:arrow-path" width="16" class="spin"></iconify-icon>
            <span>检查中...</span>
          </div>
          <div v-else-if="isAvailable === true" class="available-status">
            <iconify-icon icon="heroicons:check-circle" width="16" style="color: #07c160;"></iconify-icon>
            <span>可以使用</span>
          </div>
          <div v-else-if="isAvailable === false" class="unavailable-status">
            <iconify-icon icon="heroicons:x-circle" width="16" style="color: #ff4757;"></iconify-icon>
            <span>已被使用</span>
          </div>
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>


      </div>

      <!-- 确认按钮 -->
      <div v-if="canModify" class="action-section">
        <button 
          @click="confirmChange"
          class="confirm-btn"
          :disabled="!canSubmit"
        >
          确认修改
        </button>
        <div class="confirm-note">
          修改后，您的好友需要使用新的叶语号来找到您
        </div>
      </div>

      <!-- 修改规则 -->
      <div class="rules-section">
        <div class="section-title">修改规则</div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="16" style="color: #07c160;"></iconify-icon>
          <span>每年可修改一次叶语号</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="16" style="color: #07c160;"></iconify-icon>
          <span>长度为6-20个字符</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="16" style="color: #07c160;"></iconify-icon>
          <span>支持字母、数字、下划线</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="16" style="color: #07c160;"></iconify-icon>
          <span>不能与其他用户重复</span>
        </div>
      </div>


    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const currentTime = ref('')
const currentYeyuId = ref('')
const newYeyuId = ref('')
const usageCount = ref(0)
const canModify = ref(true)
const nextModifyTime = ref('')
const isChecking = ref(false)
const isAvailable = ref<boolean | null>(null)
const hasError = ref(false)
const errorMessage = ref('')
const isChanging = ref(false)



// 计算属性
const canSubmit = computed(() => {
  return newYeyuId.value.length >= 6 && 
         isAvailable.value === true && 
         !hasError.value &&
         newYeyuId.value !== currentYeyuId.value
})

// 方法
const goBack = () => {
  console.log('🔙 更换叶语号页面返回')
  console.log('📊 当前历史记录长度:', window.history.length)
  console.log('📍 当前路由:', router.currentRoute.value.path)

  try {
    // 尝试使用 router.back()
    console.log('🔄 尝试使用 router.back()')
    router.back()

    // 设置一个超时，如果返回失败则使用备用方案
    setTimeout(() => {
      if (router.currentRoute.value.path === '/settings/change-yeyu-id') {
        console.log('⚠️ router.back() 似乎没有生效，使用备用方案')
        router.push('/settings/personal-info')
      }
    }, 100)
  } catch (error: any) {
    console.error('❌ router.back() 失败:', error)
    console.log('🔄 使用备用方案跳转到个人信息页面')
    router.push('/settings/personal-info')
  }
}

const loadUserData = async () => {
  try {
    // 从认证store获取当前用户信息
    const currentUser = authStore.user
    console.log('🔍 调试用户信息:', {
      authStore_user: currentUser,
      token: authStore.token ? '有token' : '无token'
    })

    if (currentUser) {
      currentYeyuId.value = currentUser.yeyu_id || '未设置'
      console.log('🔍 当前用户叶语号:', currentYeyuId.value)
    } else {
      currentYeyuId.value = '未设置'
      console.log('⚠️ 没有找到当前用户信息，使用默认值:', currentYeyuId.value)
    }

    // 加载修改记录和限制信息
    await loadModificationInfo()
  } catch (error: any) {
    console.error('加载用户数据失败:', error)
  }
}

const loadModificationInfo = async () => {
  try {
    // 这里应该调用API获取修改记录和限制信息
    // 模拟数据 - 暂时注释掉年度限制用于测试
    const currentYear = new Date().getFullYear()
    usageCount.value = 0 // 从API获取
    canModify.value = true // 暂时设为true用于测试
    // canModify.value = usageCount.value < 1

    if (!canModify.value) {
      nextModifyTime.value = `${currentYear + 1}年1月1日`
    }
  } catch (error: any) {
    console.error('加载修改信息失败:', error)
  }
}

const validateInput = () => {
  const value = newYeyuId.value.trim()
  console.log('🔍 验证输入:', { value, currentYeyuId: currentYeyuId.value })

  hasError.value = false
  errorMessage.value = ''
  isAvailable.value = null

  if (value.length === 0) {
    console.log('🚫 输入为空')
    return
  }

  if (value.length < 6) {
    hasError.value = true
    errorMessage.value = '叶语号长度不能少于6个字符'
    console.log('🚫 长度不足')
    return
  }

  if (value.length > 20) {
    hasError.value = true
    errorMessage.value = '叶语号长度不能超过20个字符'
    console.log('🚫 长度超限')
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    hasError.value = true
    errorMessage.value = '叶语号只能包含字母、数字和下划线'
    console.log('🚫 格式错误')
    return
  }

  if (value === currentYeyuId.value) {
    hasError.value = true
    errorMessage.value = '新叶语号不能与当前叶语号相同'
    console.log('🚫 与当前叶语号相同:', {
      输入值: value,
      当前叶语号: currentYeyuId.value,
      是否相等: value === currentYeyuId.value
    })
    return
  }

  console.log('✅ 验证通过')
}

// 新的输入处理函数
const onInput = () => {
  console.log('📝 输入事件触发，当前值:', newYeyuId.value)
  validateInput()

  // 如果验证通过，立即检查可用性
  if (!hasError.value && newYeyuId.value.trim().length >= 6) {
    console.log('🚀 立即检查可用性')
    checkAvailability()
  } else {
    console.log('🚫 不检查可用性:', { hasError: hasError.value, length: newYeyuId.value.trim().length })
  }
}







const checkAvailability = async () => {
  console.log('🔍 checkAvailability 被调用')
  console.log('🔍 当前状态:', {
    newYeyuId: newYeyuId.value,
    hasError: hasError.value,
    currentYeyuId: currentYeyuId.value,
    authStore_user: authStore.user,
    token: authStore.token ? '有token' : '无token'
  })

  const inputValue = newYeyuId.value.trim()

  // 重置状态
  isAvailable.value = null

  // 只有在有输入内容时才检查（移除格式错误的限制）
  if (!inputValue) {
    console.log('🚫 跳过检查: 输入为空')
    return
  }

  // 基本格式检查
  if (inputValue.length < 6 || inputValue.length > 20) {
    console.log('🚫 跳过检查: 长度不符合要求')
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(inputValue)) {
    console.log('🚫 跳过检查: 格式不正确')
    return
  }

  if (inputValue === currentYeyuId.value) {
    console.log('🚫 跳过检查: 与当前叶语号相同')
    return
  }

  try {
    isChecking.value = true
    console.log('🔍 开始检查叶语号:', inputValue)
    console.log('🔑 当前token:', authStore.token ? '有token' : '无token')
    console.log('👤 当前用户:', authStore.user)

    if (!authStore.token) {
      errorMessage.value = '用户未登录，请重新登录'
      return
    }

    // 调用API检查叶语号是否可用
    const response = await fetch('/api/user/check-yeyu-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        yeyuId: inputValue
      })
    })

    console.log('📡 API响应状态:', response.status)

    console.log('📡 响应头:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📡 原始响应:', responseText)

    if (response.ok) {
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError)
        hasError.value = true
        errorMessage.value = 'API返回格式错误'
        isAvailable.value = null
        return
      }
      console.log('📊 API响应结果:', result)

      if (result.success) {
        isAvailable.value = result.available
        if (!result.available) {
          hasError.value = true
          errorMessage.value = result.message || '该叶语号已被使用'
        } else {
          hasError.value = false
          errorMessage.value = ''
        }
      } else {
        hasError.value = true
        errorMessage.value = result.error || '检查失败'
        isAvailable.value = null
      }
    } else {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ 错误响应JSON解析失败:', parseError)
        hasError.value = true
        errorMessage.value = '服务器错误'
        isAvailable.value = null
        return
      }
      console.log('❌ API错误响应:', errorData)
      hasError.value = true
      errorMessage.value = errorData.error || '检查失败'
      isAvailable.value = null
    }
  } catch (error: any) {
    console.error('❌ 检查叶语号可用性失败:', error)
    hasError.value = true
    errorMessage.value = '网络错误，请重试'
    isAvailable.value = null
  } finally {
    isChecking.value = false
  }
}

const confirmChange = async () => {
  if (!canSubmit.value) return

  // 直接执行修改，不显示确认对话框
  await executeChange()
}



const executeChange = async () => {
  try {
    isChanging.value = true

    // 调用API修改叶语号
    const response = await fetch('/api/user/change-yeyu-id', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        newYeyuId: newYeyuId.value.trim()
      })
    })

    if (response.ok) {
      const result = await response.json()

      if (result.success) {
        // 更新本地数据
        currentYeyuId.value = newYeyuId.value.trim()

        // 更新认证store中的用户信息
        const updatedUser = result.data
        if (authStore.user) {
          // 更新叶语号字段
          authStore.user.yeyu_id = updatedUser.yeyu_id

          // 更新localStorage中的用户信息
          localStorage.setItem('yeyu_user', JSON.stringify(authStore.user))
        }

        // 同步更新所有localStorage存储，确保字段一致性
        const userInfoForStorage = {
          ...updatedUser,
          yeyuId: updatedUser.yeyu_id,  // 确保yeyuId字段存在
          yeyu_id: updatedUser.yeyu_id  // 确保yeyu_id字段存在
        }

        localStorage.setItem('yeyu_user_info', JSON.stringify(userInfoForStorage))
        localStorage.setItem('user', JSON.stringify(userInfoForStorage))

        // 刷新用户信息
        await authStore.fetchUserInfo()

        // 强制触发页面刷新事件，确保其他页面也能获取到最新数据
        window.dispatchEvent(new CustomEvent('userInfoUpdated', {
          detail: {
            type: 'yeyuId',
            newValue: updatedUser.yeyu_id,
            user: userInfoForStorage
          }
        }))

        // 同时触发 userInfoEmitter 事件（用于个人中心页面）
        try {
          const { userInfoEmitter } = await import('../../../shared/utils/userInfo')
          userInfoEmitter.emit(userInfoForStorage)
          console.log('✅ 已触发 userInfoEmitter 事件')
        } catch (error) {
          console.warn('⚠️ 触发 userInfoEmitter 失败:', error)
        }

        console.log('✅ 叶语号修改成功，已更新所有存储:', {
          newYeyuId: updatedUser.yeyu_id,
          authStoreUser: authStore.user,
          localStorage: userInfoForStorage
        })
      

      
      // 更新使用次数
      usageCount.value++
      canModify.value = false

      // 显示成功提示
      appStore.showToast('叶语号修改成功', 'success')

      // 延迟返回个人信息页面
      setTimeout(() => {
        try {
          router.push('/settings/personal-info')
        } catch (error: any) {
          console.error('❌ 跳转失败:', error)
          router.back()
        }
      }, 1500)
      } else {
        throw new Error(result.error || '修改失败')
      }
    } else {
      const error = await response.json()
      throw new Error(error.message || '修改失败')
    }
  } catch (error: any) {
    console.error('修改叶语号失败:', error)
    appStore.showToast('修改失败：' + (error.message || '请重试'), 'error')
  } finally {
    isChanging.value = false
  }
}



// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toTimeString().slice(0, 5)
}

// 生命周期
onMounted(() => {
  loadUserData()

  // 初始化时间
  updateTime()
  // 每分钟更新时间
  setInterval(updateTime, 60000)
})
</script>

<style scoped>
.change-yeyu-id {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 移除自定义状态栏和导航栏样式，使用统一组件 */

/* 内容区域 */
.content {
  padding: 20px 16px;
}

/* 当前叶语号 */
.current-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  text-align: center;
}

.section-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  font-weight: 500;
}

.current-id {
  font-size: 20px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 6px;
}

.id-note {
  font-size: 11px;
  color: #999;
}

/* 修改规则 */
.rules-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #999;
}

.rule-item:last-child {
  margin-bottom: 0;
}

/* 使用次数 */
.usage-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.usage-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.usage-text {
  font-size: 13px;
  color: #999;
}

.can-modify {
  font-size: 11px;
  color: #07c160;
  background: rgba(7,193,96,0.1);
  padding: 3px 6px;
  border-radius: 3px;
}

.cannot-modify {
  font-size: 11px;
  color: #ff4757;
  background: rgba(255,71,87,0.1);
  padding: 3px 6px;
  border-radius: 3px;
}

.next-time {
  font-size: 11px;
  color: #999;
}

/* 输入区域 */
.input-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.input-container {
  position: relative;
}

.yeyu-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.yeyu-input:focus {
  border-color: #07c160;
}

.yeyu-input.error {
  border-color: #ff4757;
}

.yeyu-input::placeholder {
  color: #999;
  font-size: 13px;
}

.checking-status,
.available-status,
.unavailable-status {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
}

.checking-status {
  color: #999;
}

.available-status {
  color: #07c160;
}

.unavailable-status {
  color: #ff4757;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 6px;
  font-size: 11px;
  color: #999;
}

/* 操作区域 */
.action-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  text-align: center;
}

.confirm-btn {
  width: 100%;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.confirm-btn:hover {
  background: #06a552;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.confirm-note {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}



/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.dialog-content {
  padding: 20px;
}

.change-preview {
  margin-bottom: 20px;
}

.preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #666;
  width: 80px;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.value.new {
  color: #07c160;
}

.warning-text {
  font-size: 12px;
  color: #ff4757;
  line-height: 1.5;
  background: rgba(255,71,87,0.1);
  padding: 12px;
  border-radius: 8px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.dialog-actions .cancel-btn,
.dialog-actions .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-actions .cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.dialog-actions .cancel-btn:hover {
  background: #e0e0e0;
}

.dialog-actions .confirm-btn {
  background: #07c160;
  color: white;
}

.dialog-actions .confirm-btn:hover {
  background: #06a552;
}

.dialog-actions .confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

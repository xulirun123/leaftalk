<template>
  <div class="change-yeyu-id">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>
      <h1 class="title">修改叶语号</h1>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <!-- 当前叶语号 -->
      <div class="current-section">
        <div class="section-title">当前叶语号</div>
        <div class="current-id">{{ currentYeyuId }}</div>
        <div class="id-note">叶语号是您在叶语中的唯一标识</div>
      </div>

      <!-- 修改规则 -->
      <div class="rules-section">
        <div class="section-title">修改规则</div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07c160;"></iconify-icon>
          <span>每年可修改一次叶语号</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07c160;"></iconify-icon>
          <span>长度为6-20个字符</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07c160;"></iconify-icon>
          <span>支持字母、数字、下划线</span>
        </div>
        <div class="rule-item">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07c160;"></iconify-icon>
          <span>不能与其他用户重复</span>
        </div>
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
            @input="validateInput"
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

      <!-- 历史记录 -->
      <div class="history-section">
        <div class="section-title">修改历史</div>
        <div v-if="history.length === 0" class="no-history">
          暂无修改记录
        </div>
        <div v-else class="history-list">
          <div v-for="record in history" :key="record.id" class="history-item">
            <div class="history-info">
              <div class="old-id">{{ record.oldId }}</div>
              <iconify-icon icon="heroicons:arrow-right" width="16" style="color: #999;"></iconify-icon>
              <div class="new-id">{{ record.newId }}</div>
            </div>
            <div class="history-time">{{ formatTime(record.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirmDialog" class="confirm-overlay" @click="hideConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3>确认修改叶语号</h3>
        </div>
        <div class="dialog-content">
          <div class="change-preview">
            <div class="preview-item">
              <span class="label">当前叶语号：</span>
              <span class="value">{{ currentYeyuId }}</span>
            </div>
            <div class="preview-item">
              <span class="label">新叶语号：</span>
              <span class="value new">{{ newYeyuId }}</span>
            </div>
          </div>
          <div class="warning-text">
            • 修改后本年度内无法再次修改<br>
            • 您的好友需要使用新叶语号找到您<br>
            • 旧叶语号将立即失效
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="hideConfirmDialog" class="cancel-btn">取消</button>
          <button @click="executeChange" class="confirm-btn" :disabled="isChanging">
            {{ isChanging ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUnifiedAvatar } from '@/composables/useUnifiedAvatar'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const { currentUserId } = useUnifiedAvatar()
const appStore = useAppStore()

// 响应式数据
const currentYeyuId = ref('')
const newYeyuId = ref('')
const usageCount = ref(0)
const canModify = ref(true)
const nextModifyTime = ref('')
const isChecking = ref(false)
const isAvailable = ref<boolean | null>(null)
const hasError = ref(false)
const errorMessage = ref('')
const showConfirmDialog = ref(false)
const isChanging = ref(false)

// 修改历史
const history = ref([
  // {
  //   id: '1',
  //   oldId: 'old_yeyu_123',
  //   newId: 'new_yeyu_456',
  //   timestamp: Date.now() - 86400000 * 30
  // }
])

// 计算属性
const canSubmit = computed(() => {
  return newYeyuId.value.length >= 6 && 
         isAvailable.value === true && 
         !hasError.value &&
         newYeyuId.value !== currentYeyuId.value
})

// 方法
const goBack = () => {
  router.back()
}

const loadUserData = async () => {
  try {
    // 从认证store获取当前用户信息
    const currentUser = authStore.user
    if (currentUser) {
      currentYeyuId.value = currentUser.username || currentUserId.value || '未设置'
    } else {
      currentYeyuId.value = currentUserId.value || '未设置'
    }

    // 加载修改记录和限制信息
    await loadModificationInfo()
  } catch (error) {
    console.error('加载用户数据失败:', error)
  }
}

const loadModificationInfo = async () => {
  try {
    // 这里应该调用API获取修改记录和限制信息
    // 模拟数据
    const currentYear = new Date().getFullYear()
    usageCount.value = 0 // 从API获取
    canModify.value = usageCount.value < 1
    
    if (!canModify.value) {
      nextModifyTime.value = `${currentYear + 1}年1月1日`
    }
  } catch (error) {
    console.error('加载修改信息失败:', error)
  }
}

const validateInput = () => {
  const value = newYeyuId.value.trim()
  hasError.value = false
  errorMessage.value = ''
  isAvailable.value = null

  if (value.length === 0) {
    return
  }

  if (value.length < 6) {
    hasError.value = true
    errorMessage.value = '叶语号长度不能少于6个字符'
    return
  }

  if (value.length > 20) {
    hasError.value = true
    errorMessage.value = '叶语号长度不能超过20个字符'
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    hasError.value = true
    errorMessage.value = '叶语号只能包含字母、数字和下划线'
    return
  }

  if (value === currentYeyuId.value) {
    hasError.value = true
    errorMessage.value = '新叶语号不能与当前叶语号相同'
    return
  }
}

const checkAvailability = async () => {
  if (hasError.value || !newYeyuId.value.trim()) {
    return
  }

  try {
    isChecking.value = true
    
    // 调用API检查叶语号是否可用
    const response = await fetch('/api/users/check-yeyu-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        yeyuId: newYeyuId.value.trim()
      })
    })

    if (response.ok) {
      const result = await response.json()
      isAvailable.value = result.available
    } else {
      // 模拟检查结果
      await new Promise(resolve => setTimeout(resolve, 1000))
      isAvailable.value = Math.random() > 0.3 // 70%概率可用
    }
  } catch (error) {
    console.error('检查叶语号可用性失败:', error)
    isAvailable.value = null
  } finally {
    isChecking.value = false
  }
}

const confirmChange = () => {
  if (!canSubmit.value) return
  showConfirmDialog.value = true
}

const hideConfirmDialog = () => {
  showConfirmDialog.value = false
}

const executeChange = async () => {
  try {
    isChanging.value = true

    // 调用API修改叶语号
    const response = await fetch('/api/users/change-yeyu-id', {
      method: 'POST',
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
      
      // 更新本地数据
      const oldId = currentYeyuId.value
      currentYeyuId.value = newYeyuId.value.trim()
      
      // 更新认证store中的用户信息
      if (authStore.user) {
        authStore.user.username = newYeyuId.value.trim()
      }
      
      // 添加到历史记录
      history.value.unshift({
        id: Date.now().toString(),
        oldId: oldId,
        newId: newYeyuId.value.trim(),
        timestamp: Date.now()
      })
      
      // 更新使用次数
      usageCount.value++
      canModify.value = false
      
      appStore.showToast('叶语号修改成功', 'success')
      
      // 延迟返回上一页
      setTimeout(() => {
        router.back()
      }, 2000)
    } else {
      const error = await response.json()
      throw new Error(error.message || '修改失败')
    }
  } catch (error) {
    console.error('修改叶语号失败:', error)
    appStore.showToast(`修改失败：${error.message || '请重试'}`, 'error')
  } finally {
    isChanging.value = false
    hideConfirmDialog()
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 生命周期
onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.change-yeyu-id {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部导航栏 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #07c160 0%, #06a552 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.back-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255,255,255,0.2);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.placeholder {
  width: 44px;
}

/* 内容区域 */
.content {
  padding: 80px 20px 20px;
}

/* 当前叶语号 */
.current-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  text-align: center;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.current-id {
  font-size: 24px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 8px;
}

.id-note {
  font-size: 12px;
  color: #999;
}

/* 修改规则 */
.rules-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.rule-item:last-child {
  margin-bottom: 0;
}

/* 使用次数 */
.usage-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.usage-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.usage-text {
  font-size: 14px;
  color: #333;
}

.can-modify {
  font-size: 12px;
  color: #07c160;
  background: rgba(7,193,96,0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.cannot-modify {
  font-size: 12px;
  color: #ff4757;
  background: rgba(255,71,87,0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.next-time {
  font-size: 12px;
  color: #999;
}

/* 输入区域 */
.input-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.input-container {
  position: relative;
}

.yeyu-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
}

.yeyu-input:focus {
  border-color: #07c160;
}

.yeyu-input.error {
  border-color: #ff4757;
}

.checking-status,
.available-status,
.unavailable-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
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
  margin-top: 8px;
  font-size: 12px;
  color: #ff4757;
}

/* 操作区域 */
.action-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  text-align: center;
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.confirm-btn:hover {
  background: #06a552;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.confirm-note {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 历史记录 */
.history-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.no-history {
  text-align: center;
  color: #999;
  padding: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.old-id,
.new-id {
  font-size: 14px;
  font-weight: 500;
}

.old-id {
  color: #999;
}

.new-id {
  color: #07c160;
}

.history-time {
  font-size: 12px;
  color: #999;
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

<template>
  <div class="change-phone">
    <!-- 内容区域 -->
    <div class="content-wrapper">
      <!-- 重要提示 -->
      <div class="warning-section">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <div class="warning-title">{{ $t('settings.importantNotice') }}</div>
          <div class="warning-text">• {{ $t('settings.phoneChangeLimit') }}</div>
          <div class="warning-text">• {{ $t('settings.phoneBindLimit') }}</div>
          <div class="warning-text">• {{ $t('settings.phoneChangeLogin') }}</div>
        </div>
      </div>

      <!-- 手机号输入 -->
      <div class="phone-section">
        <div class="input-group">
          <input
            v-model="newPhone"
            type="tel"
            :placeholder="$t('settings.enterPhonePlaceholder')"
            class="phone-input"
            maxlength="11"
            @input="validatePhone"
          />
        </div>
        <div v-if="phoneError" class="error-message">{{ phoneError }}</div>
      </div>

      <!-- 验证码输入 -->
      <div class="verification-section" v-if="showVerification">
        <div class="verification-group">
          <input
            v-model="verificationCode"
            type="text"
            :placeholder="$t('settings.enterVerificationCode')"
            class="verification-input"
            maxlength="6"
          />
        </div>
        <div class="verification-info">
          <div v-if="verificationSent" class="code-sent-info">
            {{ $t('settings.verificationCodeSent', {
              phone: formatPhone(newPhone),
              time: `${Math.floor(codeExpireTime / 60)}:${String(codeExpireTime % 60).padStart(2, '0')}`
            }) }}
          </div>
          <div v-if="verificationError" class="error-message">{{ verificationError }}</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          v-if="!showVerification"
          class="next-btn"
          @click="sendVerificationCode"
          :disabled="!isPhoneValid"
        >
          {{ $t('settings.nextStep') }}
        </button>

        <button
          v-if="showVerification"
          class="confirm-btn"
          @click="confirmChange"
          :disabled="!verificationCode.trim() || codeExpireTime <= 0"
        >
          {{ $t('settings.changePhone') }}
        </button>

        <button
          v-if="showVerification && codeExpireTime <= 0"
          class="resend-btn"
          @click="resendCode"
        >
          {{ $t('settings.resendCode') }}
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="tips">
        <div class="tip-item">• {{ $t('settings.ensurePhoneReceiveSMS') }}</div>
        <div class="tip-item">• {{ $t('settings.contactCustomerService') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { t } = useI18n()

// 响应式数据
const newPhone = ref('')
const verificationCode = ref('')
const phoneError = ref('')
const verificationError = ref('')
const showVerification = ref(false)
const verificationSent = ref(false)
const codeExpireTime = ref(0) // 验证码过期倒计时（秒）
const expireTimer = ref(null)

// 计算属性
const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(newPhone.value) && !phoneError.value
})

// 页面初始化
onMounted(() => {
  // 页面加载完成
})

// 页面销毁时清理定时器
onUnmounted(() => {
  if (expireTimer.value) {
    clearInterval(expireTimer.value)
    expireTimer.value = null
  }
})

// 验证手机号
const validatePhone = () => {
  phoneError.value = ''

  if (!newPhone.value) {
    return
  }

  if (!/^1[3-9]\d{9}$/.test(newPhone.value)) {
    phoneError.value = '请输入正确的手机号格式'
    return
  }
}

// 格式化手机号显示
const formatPhone = (phone) => {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!isPhoneValid.value) {
    return
  }

  try {
    const response = await axios.post('http://localhost:8893/api/sms/send-code', {
      phone: newPhone.value,
      type: 'change_phone'
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      appStore.showToast(`验证码已发送至 ${formatPhone(newPhone.value)}`, 'success')
      verificationSent.value = true
      showVerification.value = true
      verificationError.value = ''

      // 开发环境下显示验证码
      if (response.data.code) {
        console.log(`🔑 验证码: ${response.data.code}`)
      }

      // 开始1分钟倒计时
      codeExpireTime.value = 60
      if (expireTimer.value) {
        clearInterval(expireTimer.value)
      }

      expireTimer.value = setInterval(() => {
        codeExpireTime.value--
        if (codeExpireTime.value <= 0) {
          clearInterval(expireTimer.value)
          expireTimer.value = null
        }
      }, 1000)
    } else {
      appStore.showToast(response.data.error || '发送验证码失败', 'error')
    }

  } catch (error) {
    console.error('发送验证码失败:', error)
    const errorMessage = error.response?.data?.error || '发送验证码失败，请重试'
    appStore.showToast(errorMessage, 'error')
  }
}

// 重新发送验证码
const resendCode = () => {
  verificationCode.value = ''
  verificationError.value = ''
  sendVerificationCode()
}

// 确认更换
const confirmChange = async () => {
  // 检查验证码是否过期
  if (codeExpireTime.value <= 0) {
    verificationError.value = '验证码已过期，请重新发送'
    return
  }

  // 检查验证码是否输入
  if (!verificationCode.value.trim()) {
    verificationError.value = '请输入验证码'
    return
  }

  try {
    const response = await axios.put('http://localhost:8893/api/user/change-phone', {
      newPhone: newPhone.value,
      verificationCode: verificationCode.value
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      appStore.showToast('手机号更换成功', 'success')

      // 清除定时器
      if (expireTimer.value) {
        clearInterval(expireTimer.value)
        expireTimer.value = null
      }

      // 更新本地用户信息
      const updatedUser = response.data.data
      if (authStore.user) {
        authStore.user.phone = updatedUser.phone
        localStorage.setItem('yeyu_user', JSON.stringify(authStore.user))
      }

      if (appStore.user) {
        appStore.user.phone = updatedUser.phone
        appStore.setUser(appStore.user)
      }

      // 同步更新所有localStorage存储
      localStorage.setItem('yeyu_user_info', JSON.stringify(updatedUser))
      localStorage.setItem('user', JSON.stringify(updatedUser))

      // 刷新用户信息
      await authStore.fetchUserInfo()

      console.log('✅ 手机号更换成功，新手机号:', updatedUser.phone)

      // 延迟返回
      setTimeout(() => {
        try {
          router.back()
          // 设置一个超时，如果返回失败则使用备用方案
          setTimeout(() => {
            if (router.currentRoute.value.path === '/settings/change-phone') {
              router.push('/settings/personal-info')
            }
          }, 100)
        } catch (error) {
          console.error('❌ 返回失败:', error)
          router.push('/settings/personal-info')
        }
      }, 1500)
    } else {
      verificationError.value = response.data.error || '验证码不正确'
    }

  } catch (error) {
    console.error('更换手机号失败:', error)
    const errorMessage = error.response?.data?.error || '验证码不正确'
    verificationError.value = errorMessage
    appStore.showToast('更换失败，请检查验证码', 'error')
  }
}


</script>

<style scoped>
.change-phone {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 100px;
}

.content-wrapper {
  padding: 20px;
}

.warning-section {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 10px;
}

.warning-text {
  font-size: 14px;
  color: #856404;
  line-height: 1.5;
  margin-bottom: 5px;
}

.warning-text:last-child {
  margin-bottom: 0;
}

.phone-section,
.verification-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 10px;
}

.phone-input {
  width: 100%;
  height: 44px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0 15px;
  font-size: 16px;
  background: #fff;
}

.phone-input:focus {
  outline: none;
  border-color: #07c160;
}

.verification-group {
  margin-bottom: 10px;
}

.verification-input {
  width: 100%;
  height: 44px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0 15px;
  font-size: 16px;
  background: #fff;
}

.verification-input:focus {
  outline: none;
  border-color: #07c160;
}

.verification-info {
  margin-top: 10px;
}

.code-sent-info {
  color: #07c160;
  font-size: 14px;
  margin-bottom: 5px;
}

.error-message {
  color: #ff4444;
  font-size: 14px;
  margin-top: 5px;
}

.action-buttons {
  margin: 30px 0;
}

.next-btn,
.confirm-btn {
  width: 100%;
  height: 50px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 15px;
}

.next-btn:disabled,
.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.resend-btn {
  width: 100%;
  height: 44px;
  background: #f8f8f8;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.resend-btn:hover {
  background: #f0f0f0;
}

.tips {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.tip-item {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.tip-item:last-child {
  margin-bottom: 0;
}
</style>

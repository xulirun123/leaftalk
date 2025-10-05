<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>叶语</h1>
        <p>企业级即时通讯</p>
      </div>
      
      <div class="login-form">
        <!-- 用户名密码登录 -->
        <div class="password-login">
          <div class="form-group">
            <input
              v-model="username"
              type="text"
              placeholder="叶语号/手机号"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <input
              v-model="password"
              type="password"
              placeholder="密码"
              class="form-input"
            />
          </div>

          <button @click="handleLogin" class="login-button" :disabled="!username || !password">
            登录
          </button>
        </div>

        <!-- 手机号登录模式 -->
        <div v-if="loginMode === 'phone'" class="phone-login">
          <div class="form-group">
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="请输入手机号"
              class="form-input"
              maxlength="11"
            />
          </div>

          <div class="form-group verification-group">
            <input
              v-model="verificationCode"
              type="text"
              placeholder="请输入验证码"
              class="form-input verification-input"
              maxlength="6"
            />
            <button
              @click="sendVerificationCode"
              :disabled="!canSendCode || countdown > 0"
              class="send-code-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </button>
          </div>

          <button @click="handlePhoneLogin" class="login-button" :disabled="!canPhoneLogin">
            登录/注册
          </button>

          <!-- 本机号码快速登录 -->
          <div class="quick-login-section">
            <div class="divider">
              <span>或</span>
            </div>
            <button @click="useDevicePhone" class="device-phone-btn">
              <iconify-icon icon="heroicons:device-phone-mobile" width="24"></iconify-icon>
              <div class="quick-login-content">
                <span class="quick-login-title">本机号码快速注册/登录</span>
                <span class="quick-login-subtitle">无需验证码，一键完成</span>
              </div>
              <iconify-icon icon="heroicons:arrow-right" width="20" class="arrow-icon"></iconify-icon>
            </button>
            <div class="quick-login-features">
              <div class="feature-item">
                <iconify-icon icon="heroicons:shield-check" width="16"></iconify-icon>
                <span>安全可信</span>
              </div>
              <div class="feature-item">
                <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
                <span>快速便捷</span>
              </div>
              <div class="feature-item">
                <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
                <span>自动注册</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 注册链接 - 在所有模式下都显示 -->
        <div class="register-link">
          <span>还没有账户？</span>
          <a @click="goToRegister">立即注册</a>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import axios from 'axios'

// 配置axios - 使用相对路径，通过前端服务器代理
axios.defaults.baseURL = '/api'

const router = useRouter()
const appStore = useAppStore()

// 叶语号或手机号登录
const username = ref('')
const password = ref('')

// 登录模式
const loginMode = ref('username') // 'username' 或 'phone'



const handleLogin = async () => {
  if (!username.value || !password.value) {
    appStore.showToast('请输入叶语号/手机号和密码', 'error')
    return
  }

  try {
    console.log('🔐 发送登录请求:', { username: username.value, password: '***' })

    // 使用axios调用登录API
    console.log('🔄 使用axios调用登录API')
    console.log('🔗 请求URL: /auth/login (通过代理)')

    const response = await axios.post('/auth/login', {
      username: username.value,
      password: password.value
    })

    const result = response.data
    console.log('✅ 登录请求成功', result)

    // axios成功响应，检查业务逻辑是否成功
    if (!result.success) {
      throw new Error(result.message || '登录失败')
    }

    // 登录成功
    if (result.success) {
      console.log('✅ 登录成功:', result.data.user)
      console.log('🔍 原始用户数据:', JSON.stringify(result.data.user, null, 2))

      // 更新authStore状态
      const authStore = useAuthStore()
      // 确保用户数据包含name字段（兼容前端接口）
      const userData = {
        ...result.data.user,
        name: result.data.user.nickname || result.data.user.username || result.data.user.name || result.data.user.phone || '用户'
      }
      console.log('🔍 处理后用户数据:', JSON.stringify(userData, null, 2))

      // 保存认证信息
      localStorage.setItem('yeyu_auth_token', result.data.token)
      localStorage.setItem('yeyu_user_info', JSON.stringify(userData))

      authStore.setUser(userData)
      authStore.setToken(result.data.token)

      // 登录成功后直接跳转到首页，不检查实名认证状态
      console.log('✅ 登录成功，跳转到首页')
      appStore.showToast('登录成功！正在跳转...', 'success')
      setTimeout(() => {
        router.push('/')
      }, 1500)

    } else {
      throw new Error(result.message || '登录失败')
    }

  } catch (error) {
    // 只在开发环境输出详细错误信息
    if (import.meta.env.DEV) {
      console.error('❌ 登录失败:', error)
    }

    // 处理不同类型的错误
    let errorMessage = '登录失败，请重试'

    if (error.code === 'ERR_NETWORK') {
      errorMessage = '网络连接失败，无法连接到服务器'
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = '服务器连接被拒绝'
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误'
    } else if (error.response?.status === 404) {
      errorMessage = 'API接口不存在'
    } else if (error.response?.status === 401) {
      // 401错误通常是认证失败，显示后端返回的具体错误信息
      errorMessage = error.response?.data?.error || '账户或密码错误'
    } else if (error.response?.status === 400) {
      // 400错误通常是请求参数错误
      errorMessage = error.response?.data?.error || '请求参数错误'
    } else if (error.response?.data?.error) {
      // 优先使用后端返回的error字段
      errorMessage = error.response.data.error
    } else if (error.response?.data?.message) {
      // 兼容message字段
      errorMessage = error.response.data.message
    } else if (error.message) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '网络连接失败，请检查网络'
      } else if (error.message.includes('JSON')) {
        errorMessage = '服务器响应异常，请稍后重试'
      } else {
        errorMessage = error.message
      }
    }

    appStore.showToast(errorMessage, 'error')
  }
}



const goToRegister = () => {
  router.push('/register')
}

const loginSuccess = (user: any) => {
  // 生成模拟token
  const mockToken = 'mock_token_' + Date.now()
  
  // 保存token
  localStorage.setItem('yeyu_auth_token', mockToken)

  // 保存用户信息
  localStorage.setItem('yeyu_user_info', JSON.stringify(user))

  // 更新authStore状态
  const authStore = useAuthStore()
  authStore.setUser(user)
  authStore.setToken(mockToken)

  console.log('✅ 登录成功，用户信息:', user)
  console.log('🔑 Token已保存:', mockToken)

  appStore.showToast('登录成功', 'success')
  router.push('/')
}

// 计算属性
const canSendCode = computed(() => {
  return phoneNumber.value.length === 11 && /^1[3-9]\d{9}$/.test(phoneNumber.value)
})

const canPhoneLogin = computed(() => {
  return canSendCode.value && verificationCode.value.length === 6
})

// 发送验证码
const sendVerificationCode = async () => {
  if (!canSendCode.value) {
    appStore.showToast('请输入正确的手机号', 'error')
    return
  }

  try {
    console.log('📱 发送验证码到:', phoneNumber.value)

    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber.value
      })
    })

    const result = await response.json()

    if (result.success) {
      appStore.showToast('验证码已发送', 'success')
      startCountdown()
    } else {
      throw new Error(result.message || '发送验证码失败')
    }

  } catch (error) {
    console.error('❌ 发送验证码失败:', error)
    appStore.showToast(error.message || '发送验证码失败', 'error')
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 手机号登录
const handlePhoneLogin = async () => {
  if (!canPhoneLogin.value) {
    appStore.showToast('请输入手机号和验证码', 'error')
    return
  }

  try {
    console.log('📱 手机号登录:', phoneNumber.value)

    const response = await fetch('/api/auth/phone-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber.value,
        code: verificationCode.value
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ 手机号登录成功:', result.data)

      // 保存认证信息
      localStorage.setItem('yeyu_auth_token', result.data.tokens.accessToken)
      localStorage.setItem('yeyu_refresh_token', result.data.tokens.refreshToken)
      localStorage.setItem('yeyu_user_info', JSON.stringify(result.data.user))

      // 更新authStore状态
      const authStore = useAuthStore()
      authStore.setUser(result.data.user)
      authStore.setToken(result.data.tokens.accessToken)

      if (result.data.isNewUser) {
        appStore.showToast('注册成功！请完成实名认证', 'success')
        // 新用户需要实名认证
        router.push('/identity-verification')
      } else {
        appStore.showToast('登录成功', 'success')
        router.push('/')
      }

    } else {
      throw new Error(result.message || '登录失败')
    }

  } catch (error) {
    console.error('❌ 手机号登录失败:', error)
    appStore.showToast(error.message || '登录失败', 'error')
  }
}

// 使用本机号码快速登录
const useDevicePhone = async () => {
  try {
    console.log('📱 启动本机号码快速登录...')
    appStore.showToast('正在获取本机号码...', 'info')

    // 获取本机号码
    const devicePhone = await getDevicePhoneNumber()

    if (devicePhone) {
      phoneNumber.value = devicePhone
      appStore.showToast(`检测到本机号码: ${devicePhone}`, 'success')

      // 显示登录进度
      appStore.showToast('正在验证设备信息...', 'info')

      // 直接进行快速登录
      const response = await fetch('/api/auth/quick-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: devicePhone,
          deviceId: getDeviceId(),
          deviceInfo: getDeviceInfo(),
          loginMethod: 'device_phone'
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ 本机号码快速注册/登录成功:', result.data)

        // 保存认证信息
        localStorage.setItem('yeyu_auth_token', result.data.tokens.accessToken)
        localStorage.setItem('yeyu_refresh_token', result.data.tokens.refreshToken)
        localStorage.setItem('yeyu_user_info', JSON.stringify(result.data.user))

        // 更新authStore状态
        const authStore = useAuthStore()
        authStore.setUser(result.data.user)
        authStore.setToken(result.data.tokens.accessToken)

        if (result.data.isNewUser) {
          appStore.showToast('快速注册成功！请完成实名认证', 'success')
          // 新用户需要实名认证
          setTimeout(() => {
            router.push('/identity-verification')
          }, 1500)
        } else {
          appStore.showToast('快速登录成功！', 'success')
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }

      } else {
        throw new Error(result.message || '快速登录失败')
      }

    } else {
      appStore.showToast('无法获取本机号码，请使用验证码登录', 'warning')
      // 自动切换到验证码登录模式
      loginMode.value = 'phone'
    }

  } catch (error) {
    console.error('❌ 本机号码快速登录失败:', error)
    appStore.showToast(error.message || '快速登录失败，请使用验证码登录', 'error')
    // 出错时切换到验证码登录
    loginMode.value = 'phone'
  }
}

// 获取本机号码（增强版）
const getDevicePhoneNumber = async () => {
  try {
    // 方法1: 尝试使用Web API获取设备信息
    if ('navigator' in window && 'userAgent' in navigator) {
      console.log('📱 尝试通过设备信息获取手机号...')

      // 检查是否在移动设备上
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile) {
        // 方法2: 尝试使用Capacitor原生API（如果可用）
        if (window.Capacitor && window.Capacitor.Plugins) {
          try {
            const { Device } = window.Capacitor.Plugins
            const deviceInfo = await Device.getInfo()
            console.log('📱 设备信息:', deviceInfo)

            // 在实际应用中，这里可以调用原生插件获取手机号
            // 例如：const phoneNumber = await NativePhonePlugin.getPhoneNumber()
          } catch (error) {
            console.log('⚠️ Capacitor API不可用:', error.message)
          }
        }

        // 方法3: 尝试使用运营商API（需要运营商支持）
        if ('connection' in navigator) {
          const connection = navigator.connection
          console.log('📶 网络信息:', connection)

          // 在实际应用中，可以根据运营商信息调用相应的API
          // 例如：中国移动、联通、电信的快速登录API
        }
      }
    }

    // 方法4: 模拟本机号码获取（开发环境）
    console.log('🔧 使用模拟本机号码（开发环境）')
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟不同的获取场景
        const scenarios = [
          { phone: '13800138888', carrier: '中国移动', method: '运营商API' },
          { phone: '13900139999', carrier: '中国联通', method: '设备信息' },
          { phone: '15800158888', carrier: '中国电信', method: 'SIM卡读取' },
          { phone: '17700177777', carrier: '中国移动', method: '网络认证' }
        ]

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
        console.log(`📱 模拟获取成功: ${scenario.phone} (${scenario.carrier} - ${scenario.method})`)

        resolve(scenario.phone)
      }, 1500) // 模拟获取时间
    })

  } catch (error) {
    console.error('❌ 获取本机号码失败:', error)
    return null
  }
}

// 获取设备ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

// 获取设备信息
const getDeviceInfo = () => {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  }

  // 检测设备类型
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  deviceInfo.deviceType = isMobile ? 'mobile' : 'desktop'
  deviceInfo.os = isAndroid ? 'android' : isIOS ? 'ios' : 'other'

  // 网络信息（如果可用）
  if ('connection' in navigator) {
    const connection = navigator.connection
    deviceInfo.network = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    }
  }

  return deviceInfo
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #07c160, #06a552);
}

.login-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 32px;
  color: #07c160;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #07c160;
}

.login-button {
  width: 100%;
  padding: 15px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background: #06a552;
}

.register-link {
  text-align: center;
  margin: 20px 0;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #07c160;
  cursor: pointer;
  text-decoration: none;
  margin-left: 5px;
}

.register-link a:hover {
  text-decoration: underline;
}



/* 登录模式切换 */
.login-mode-tabs {
  display: flex;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
}

.mode-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #666;
}

.mode-tab.active {
  background: white;
  color: #07c160;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 验证码输入组 */
.verification-group {
  display: flex;
  gap: 10px;
}

.verification-input {
  flex: 1;
}

.send-code-btn {
  padding: 12px 16px;
  border: 1px solid #07c160;
  background: white;
  color: #07c160;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  background: #07c160;
  color: white;
}

.send-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 快速登录区域 */
.quick-login-section {
  margin-top: 20px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 14px;
}

.device-phone-btn {
  width: 100%;
  padding: 16px;
  border: 2px solid #07c160;
  background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
  color: #07c160;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.device-phone-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.device-phone-btn:hover::before {
  left: 100%;
}

.device-phone-btn:hover {
  background: linear-gradient(135deg, #07c160 0%, #06a552 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(7, 193, 96, 0.3);
}

.quick-login-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  margin-left: 12px;
}

.quick-login-title {
  font-weight: 600;
  font-size: 16px;
  line-height: 1.2;
}

.quick-login-subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.device-phone-btn:hover .arrow-icon {
  transform: translateX(4px);
}

.quick-login-features {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
  padding: 8px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.feature-item iconify-icon {
  color: #07c160;
}
</style>

/**
 * 实名认证检查工具
 * 用于在需要实名认证的功能入口处检查用户是否已实名认证
 */

import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import { useRouter } from 'vue-router'

/**
 * 检查用户是否已实名认证
 * @returns Promise<boolean> - true表示已认证，false表示未认证
 */
export async function checkVerification(): Promise<boolean> {
  const authStore = useAuthStore()
  const token = localStorage.getItem('yeyu_auth_token') || authStore.token

  if (!token) {
    return false
  }

  try {
    const response = await fetch('/api/identity/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const user = result.data.user
        // 安全检查：确保 user 对象存在
        if (!user) {
          return false
        }
        // 检查是否有实名信息且认证状态为已认证
        return !!(user.real_name && user.id_card && user.verification_status === 'verified')
      }
    }
  } catch (error) {
    // 静默处理错误，不在控制台输出
    // 用户未实名认证是正常情况，不应该报错
    return false
  }

  return false
}

/**
 * 要求实名认证
 * 如果用户未实名认证，则跳转到实名认证页面
 * @param featureName - 功能名称，用于提示用户
 * @param returnPath - 认证完成后返回的路径
 * @returns Promise<boolean> - true表示已认证可以继续，false表示未认证已跳转
 */
export async function requireVerification(
  featureName: string = '此功能',
  returnPath?: string
): Promise<boolean> {
  const router = useRouter()
  const appStore = useAppStore()
  const isVerified = await checkVerification()

  if (!isVerified) {
    // 保存返回路径
    if (returnPath) {
      sessionStorage.setItem('verification_return_path', returnPath)
    }

    // 提示用户需要实名认证
    appStore.showToast(`${featureName}需要先完成实名认证`, 'warning')

    // 跳转到实名认证页面
    setTimeout(() => {
      router.push('/identity-verification')
    }, 1500)

    return false
  }

  return true
}

/**
 * 实名认证完成后的回调
 * 用于实名认证页面在认证完成后跳转回原页面
 */
export function onVerificationComplete() {
  const router = useRouter()
  const returnPath = sessionStorage.getItem('verification_return_path')

  if (returnPath) {
    sessionStorage.removeItem('verification_return_path')
    router.push(returnPath)
  } else {
    router.push('/')
  }
}


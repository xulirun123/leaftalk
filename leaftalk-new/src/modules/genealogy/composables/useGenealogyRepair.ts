// 族谱状态检测和自动修复组合式函数
import { ref, computed } from 'vue'

export interface GenealogyStatus {
  isVerified: boolean
  hasGenealogy: boolean
  needsRepair: boolean
  genealogies: any[]
  verificationInfo: any
}

export interface RepairResult {
  success: boolean
  repaired?: boolean
  needsVerification?: boolean
  hasGenealogy?: boolean
  data?: any
  message: string
}

export function useGenealogyRepair() {
  const isChecking = ref(false)
  const isRepairing = ref(false)
  const status = ref<GenealogyStatus | null>(null)
  const lastCheckTime = ref<Date | null>(null)

  // 计算属性
  const needsRepair = computed(() => status.value?.needsRepair || false)
  const hasGenealogy = computed(() => status.value?.hasGenealogy || false)
  const isVerified = computed(() => status.value?.isVerified || false)

  // 检查族谱状态
  const checkGenealogyStatus = async (): Promise<GenealogyStatus | null> => {
    if (isChecking.value) return status.value

    isChecking.value = true
    console.log('🔍 检查族谱状态...')

    try {
      // 先尝试代理，失败则直接调用后端
      let response
      let result

      try {
        response = await fetch('http://localhost:8893/api/auth/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
          }
        })
        result = await response.json()
      } catch (proxyError) {
        console.log('🔄 备用请求失败')
        response = await fetch('http://localhost:8893/api/auth/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
          }
        })
        result = await response.json()
      }

      console.log('📊 族谱状态检查结果:', result)

      if (result.success) {
        status.value = result.data
        lastCheckTime.value = new Date()
        return result.data
      } else {
        console.error('❌ 族谱状态检查失败:', result.message)
        return null
      }
    } catch (error) {
      console.error('❌ 族谱状态检查异常:', error)
      return null
    } finally {
      isChecking.value = false
    }
  }

  // 自动修复族谱
  const repairGenealogy = async (): Promise<RepairResult> => {
    if (isRepairing.value) {
      return { success: false, message: '正在修复中，请稍候...' }
    }

    isRepairing.value = true
    console.log('🔧 开始自动修复族谱...')

    try {
      // 先尝试代理，失败则直接调用后端
      let response
      let result

      try {
        response = await fetch('http://localhost:8893/api/genealogies/auto-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
          }
        })
        result = await response.json()
      } catch (proxyError) {
        console.log('🔄 备用请求失败')
        response = await fetch('http://localhost:8893/api/genealogies/auto-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
          }
        })
        result = await response.json()
      }

      console.log('🔧 族谱修复结果:', result)

      if (result.success) {
        // 修复成功后重新检查状态
        if (result.repaired) {
          setTimeout(() => {
            checkGenealogyStatus()
          }, 1000)
        }

        return {
          success: true,
          repaired: result.repaired,
          needsVerification: result.needsVerification,
          hasGenealogy: result.hasGenealogy,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          message: result.message || '族谱修复失败'
        }
      }
    } catch (error: any) {
      console.error('❌ 族谱修复异常:', error)
      return {
        success: false,
        message: error.message || '族谱修复异常'
      }
    } finally {
      isRepairing.value = false
    }
  }

  // 智能检测和修复（组合操作）
  const smartRepair = async (): Promise<RepairResult> => {
    console.log('🤖 开始智能族谱检测和修复...')

    // 1. 先检查状态
    const currentStatus = await checkGenealogyStatus()
    
    if (!currentStatus) {
      return { success: false, message: '无法获取族谱状态' }
    }

    // 2. 如果不需要修复，直接返回
    if (!currentStatus.needsRepair) {
      if (!currentStatus.isVerified) {
        return { 
          success: true, 
          needsVerification: true,
          message: '用户尚未完成实名认证' 
        }
      }
      
      if (currentStatus.hasGenealogy) {
        return { 
          success: true, 
          hasGenealogy: true,
          message: '族谱状态正常，无需修复' 
        }
      }
    }

    // 3. 需要修复，执行自动修复
    console.log('⚠️ 检测到族谱缺失，开始自动修复...')
    return await repairGenealogy()
  }

  // 定期检查（可选）
  const startPeriodicCheck = (intervalMinutes: number = 30) => {
    const interval = setInterval(async () => {
      console.log('⏰ 定期检查族谱状态...')
      const currentStatus = await checkGenealogyStatus()
      
      if (currentStatus?.needsRepair) {
        console.log('⚠️ 定期检查发现族谱缺失，尝试自动修复...')
        await repairGenealogy()
      }
    }, intervalMinutes * 60 * 1000)

    // 返回清理函数
    return () => clearInterval(interval)
  }

  return {
    // 状态
    isChecking,
    isRepairing,
    status,
    lastCheckTime,
    
    // 计算属性
    needsRepair,
    hasGenealogy,
    isVerified,
    
    // 方法
    checkGenealogyStatus,
    repairGenealogy,
    smartRepair,
    startPeriodicCheck
  }
}

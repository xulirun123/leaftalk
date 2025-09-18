/**
 * 崩溃预防工具
 * 提供应用崩溃预防和恢复机制
 */

// 崩溃预防配置
interface CrashPreventionConfig {
  maxRetries: number
  retryDelay: number
  enableLogging: boolean
}

const defaultConfig: CrashPreventionConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true
}

// 错误计数器
const errorCounts = new Map<string, number>()

/**
 * 崩溃预防装饰器
 */
export function crashPrevention(config: Partial<CrashPreventionConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`
      const currentCount = errorCounts.get(key) || 0
      
      try {
        const result = await originalMethod.apply(this, args)
        // 成功执行，重置错误计数
        errorCounts.delete(key)
        return result
      } catch (error) {
        if (finalConfig.enableLogging) {
          console.error(`方法 ${key} 执行失败:`, error)
        }
        
        if (currentCount < finalConfig.maxRetries) {
          errorCounts.set(key, currentCount + 1)
          
          if (finalConfig.enableLogging) {
            console.log(`重试 ${key} (${currentCount + 1}/${finalConfig.maxRetries})`)
          }
          
          // 延迟重试
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay))
          return descriptor.value.apply(this, args)
        } else {
          if (finalConfig.enableLogging) {
            console.error(`方法 ${key} 达到最大重试次数，停止重试`)
          }
          throw error
        }
      }
    }
    
    return descriptor
  }
}

/**
 * 从崩溃中恢复
 */
export async function recoverFromCrash(): Promise<void> {
  try {
    // 清理错误状态
    errorCounts.clear()
    
    // 清理本地存储中的临时数据
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('✅ 崩溃恢复完成')
  } catch (error) {
    console.error('崩溃恢复失败:', error)
  }
}

/**
 * 安全执行函数
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  fallback?: T,
  retries: number = 3
): Promise<T | undefined> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      console.error(`安全执行失败 (${i + 1}/${retries}):`, error)
      
      if (i === retries - 1) {
        return fallback
      }
      
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  return fallback
}

/**
 * IndexedDB调试工具
 * 用于诊断和修复数据库问题
 */

import { messagePersistenceService } from '../services/messagePersistenceService'

export class DBDebugger {
  /**
   * 检查数据库状态
   */
  static async checkDatabaseStatus(): Promise<{
    exists: boolean
    version: number
    objectStores: string[]
    error?: string
  }> {
    try {
      // 检查数据库是否存在
      const databases = await indexedDB.databases()
      const yeyuDB = databases.find(db => db.name === 'YeYuChatDB')
      
      if (!yeyuDB) {
        return {
          exists: false,
          version: 0,
          objectStores: [],
          error: '数据库不存在'
        }
      }

      // 尝试打开数据库检查结构
      return new Promise((resolve) => {
        const request = indexedDB.open('YeYuChatDB')
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          const objectStores = Array.from(db.objectStoreNames)
          
          resolve({
            exists: true,
            version: db.version,
            objectStores,
          })
          
          db.close()
        }
        
        request.onerror = () => {
          resolve({
            exists: true,
            version: yeyuDB.version || 0,
            objectStores: [],
            error: '无法打开数据库'
          })
        }
      })
    } catch (error) {
      return {
        exists: false,
        version: 0,
        objectStores: [],
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 诊断数据库问题
   */
  static async diagnoseProblem(): Promise<{
    status: 'healthy' | 'corrupted' | 'missing' | 'version_mismatch'
    issues: string[]
    recommendations: string[]
  }> {
    const dbStatus = await this.checkDatabaseStatus()
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (!dbStatus.exists) {
      return {
        status: 'missing',
        issues: ['数据库不存在'],
        recommendations: ['重新初始化数据库']
      }
    }

    if (dbStatus.error) {
      issues.push(`数据库错误: ${dbStatus.error}`)
    }

    // 检查必要的对象存储
    const requiredStores = ['messages', 'sessions', 'media']
    const missingStores = requiredStores.filter(store => 
      !dbStatus.objectStores.includes(store)
    )

    if (missingStores.length > 0) {
      issues.push(`缺少对象存储: ${missingStores.join(', ')}`)
      recommendations.push('重置数据库结构')
    }

    // 检查版本
    if (dbStatus.version !== 1) {
      issues.push(`数据库版本不匹配: 期望1，实际${dbStatus.version}`)
      recommendations.push('升级数据库版本')
    }

    let status: 'healthy' | 'corrupted' | 'missing' | 'version_mismatch' = 'healthy'
    
    if (missingStores.length > 0) {
      status = 'corrupted'
    } else if (dbStatus.version !== 1) {
      status = 'version_mismatch'
    } else if (issues.length > 0) {
      status = 'corrupted'
    }

    return { status, issues, recommendations }
  }

  /**
   * 自动修复数据库
   */
  static async autoFix(): Promise<{
    success: boolean
    actions: string[]
    error?: string
  }> {
    const actions: string[] = []
    
    try {
      const diagnosis = await this.diagnoseProblem()
      
      if (diagnosis.status === 'healthy') {
        return {
          success: true,
          actions: ['数据库状态正常，无需修复']
        }
      }

      // 重置数据库
      actions.push('开始重置数据库...')
      await messagePersistenceService.resetDatabase()
      actions.push('数据库重置完成')

      // 验证修复结果
      const newDiagnosis = await this.diagnoseProblem()
      if (newDiagnosis.status === 'healthy') {
        actions.push('数据库修复成功')
        return { success: true, actions }
      } else {
        actions.push('数据库修复后仍有问题')
        return {
          success: false,
          actions,
          error: `修复后状态: ${newDiagnosis.status}, 问题: ${newDiagnosis.issues.join(', ')}`
        }
      }
    } catch (error) {
      actions.push('修复过程中出现错误')
      return {
        success: false,
        actions,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 获取数据库统计信息
   */
  static async getStats(): Promise<{
    messageCount: number
    sessionCount: number
    mediaCount: number
    error?: string
  }> {
    try {
      return await messagePersistenceService.getStats()
    } catch (error) {
      return {
        messageCount: 0,
        sessionCount: 0,
        mediaCount: 0,
        error: error instanceof Error ? error.message : '获取统计失败'
      }
    }
  }

  /**
   * 清理数据库
   */
  static async cleanup(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      await messagePersistenceService.clearAllData()
      return {
        success: true,
        message: '数据库清理完成'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '清理失败'
      }
    }
  }

  /**
   * 导出诊断报告
   */
  static async generateReport(): Promise<string> {
    const dbStatus = await this.checkDatabaseStatus()
    const diagnosis = await this.diagnoseProblem()
    const stats = await this.getStats()
    
    const report = `
# 叶语聊天数据库诊断报告

## 数据库状态
- 存在: ${dbStatus.exists ? '是' : '否'}
- 版本: ${dbStatus.version}
- 对象存储: ${dbStatus.objectStores.join(', ') || '无'}
- 错误: ${dbStatus.error || '无'}

## 诊断结果
- 状态: ${diagnosis.status}
- 问题: ${diagnosis.issues.join(', ') || '无'}
- 建议: ${diagnosis.recommendations.join(', ') || '无'}

## 数据统计
- 消息数量: ${stats.messageCount}
- 会话数量: ${stats.sessionCount}
- 媒体文件: ${stats.mediaCount}
- 统计错误: ${stats.error || '无'}

## 生成时间
${new Date().toLocaleString()}
    `.trim()
    
    return report
  }
}

// 全局调试函数（开发环境使用）
if (typeof window !== 'undefined') {
  (window as any).yeyuDBDebugger = DBDebugger
}

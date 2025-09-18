/**
 * 数据验证工具
 * 确保数据可以被IndexedDB安全存储
 */

export class DataValidator {
  /**
   * 检查值是否可以被IndexedDB克隆
   */
  static isCloneable(value: any): boolean {
    try {
      // 使用structuredClone测试（如果可用）
      if (typeof structuredClone !== 'undefined') {
        structuredClone(value)
        return true
      }
      
      // 回退到JSON测试
      JSON.stringify(value)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 深度清理对象，移除不可克隆的属性
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    // 基本类型直接返回
    if (typeof obj !== 'object') {
      return obj
    }

    // 处理日期对象
    if (obj instanceof Date) {
      return obj.getTime()
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item)).filter(item => item !== undefined)
    }

    // 处理普通对象
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // 跳过函数、Symbol、undefined
      if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
        continue
      }

      // 跳过不可枚举的属性
      if (!Object.propertyIsEnumerable.call(obj, key)) {
        continue
      }

      // 递归清理
      const cleanValue = this.sanitizeObject(value)
      if (cleanValue !== undefined) {
        sanitized[key] = cleanValue
      }
    }

    return sanitized
  }

  /**
   * 验证会话数据
   */
  static validateSession(session: any): {
    isValid: boolean
    errors: string[]
    sanitized?: any
  } {
    const errors: string[] = []

    if (!session) {
      errors.push('会话数据为空')
      return { isValid: false, errors }
    }

    if (!session.id || typeof session.id !== 'string') {
      errors.push('会话ID无效')
    }

    if (!Array.isArray(session.participants)) {
      errors.push('参与者列表无效')
    } else {
      // 验证参与者都是字符串
      const invalidParticipants = session.participants.filter(p => typeof p !== 'string')
      if (invalidParticipants.length > 0) {
        errors.push(`参与者包含非字符串值: ${invalidParticipants.length}个`)
      }
    }

    if (session.type && !['private', 'group'].includes(session.type)) {
      errors.push('会话类型无效')
    }

    // 验证时间戳
    const timeFields = ['createdAt', 'updatedAt', 'lastMessageTime']
    for (const field of timeFields) {
      if (session[field] && (typeof session[field] !== 'number' || isNaN(session[field]))) {
        errors.push(`${field}时间戳无效`)
      }
    }

    // 验证lastMessage
    if (session.lastMessage) {
      const messageValidation = this.validateMessage(session.lastMessage)
      if (!messageValidation.isValid) {
        errors.push(`最后消息无效: ${messageValidation.errors.join(', ')}`)
      }
    }

    // 尝试清理数据
    let sanitized
    try {
      sanitized = this.sanitizeObject(session)
      
      // 验证清理后的数据是否可克隆
      if (!this.isCloneable(sanitized)) {
        errors.push('清理后的数据仍不可克隆')
      }
    } catch (error) {
      errors.push(`数据清理失败: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  /**
   * 验证消息数据
   */
  static validateMessage(message: any): {
    isValid: boolean
    errors: string[]
    sanitized?: any
  } {
    const errors: string[] = []

    if (!message) {
      errors.push('消息数据为空')
      return { isValid: false, errors }
    }

    if (!message.id || typeof message.id !== 'string') {
      errors.push('消息ID无效')
    }

    if (!message.senderId || typeof message.senderId !== 'string') {
      errors.push('发送者ID无效')
    }

    if (!message.receiverId || typeof message.receiverId !== 'string') {
      errors.push('接收者ID无效')
    }

    if (typeof message.content !== 'string') {
      errors.push('消息内容无效')
    }

    if (message.type && !['text', 'image', 'voice', 'video', 'file'].includes(message.type)) {
      errors.push('消息类型无效')
    }

    if (message.status && !['sent', 'delivered', 'read'].includes(message.status)) {
      errors.push('消息状态无效')
    }

    if (message.timestamp && (typeof message.timestamp !== 'number' || isNaN(message.timestamp))) {
      errors.push('时间戳无效')
    }

    // 尝试清理数据
    let sanitized
    try {
      sanitized = this.sanitizeObject(message)
      
      // 验证清理后的数据是否可克隆
      if (!this.isCloneable(sanitized)) {
        errors.push('清理后的数据仍不可克隆')
      }
    } catch (error) {
      errors.push(`数据清理失败: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  /**
   * 批量验证数据
   */
  static validateBatch(items: any[], type: 'session' | 'message'): {
    validItems: any[]
    invalidItems: Array<{ item: any, errors: string[] }>
    summary: {
      total: number
      valid: number
      invalid: number
    }
  } {
    const validItems: any[] = []
    const invalidItems: Array<{ item: any, errors: string[] }> = []

    for (const item of items) {
      const validation = type === 'session' 
        ? this.validateSession(item)
        : this.validateMessage(item)

      if (validation.isValid && validation.sanitized) {
        validItems.push(validation.sanitized)
      } else {
        invalidItems.push({
          item,
          errors: validation.errors
        })
      }
    }

    return {
      validItems,
      invalidItems,
      summary: {
        total: items.length,
        valid: validItems.length,
        invalid: invalidItems.length
      }
    }
  }

  /**
   * 生成验证报告
   */
  static generateValidationReport(data: any): string {
    const report = []
    
    report.push('# 数据验证报告')
    report.push(`生成时间: ${new Date().toLocaleString()}`)
    report.push('')

    // 基本信息
    report.push('## 基本信息')
    report.push(`数据类型: ${typeof data}`)
    report.push(`是否为数组: ${Array.isArray(data)}`)
    report.push(`是否可克隆: ${this.isCloneable(data)}`)
    report.push('')

    // 详细分析
    if (Array.isArray(data)) {
      report.push('## 数组分析')
      report.push(`元素数量: ${data.length}`)
      
      const typeCount: Record<string, number> = {}
      data.forEach(item => {
        const type = typeof item
        typeCount[type] = (typeCount[type] || 0) + 1
      })
      
      report.push('元素类型分布:')
      Object.entries(typeCount).forEach(([type, count]) => {
        report.push(`  - ${type}: ${count}`)
      })
    } else if (typeof data === 'object' && data !== null) {
      report.push('## 对象分析')
      const keys = Object.keys(data)
      report.push(`属性数量: ${keys.length}`)
      report.push('属性列表:')
      keys.forEach(key => {
        const value = data[key]
        const type = typeof value
        const cloneable = this.isCloneable(value)
        report.push(`  - ${key}: ${type} (可克隆: ${cloneable})`)
      })
    }

    return report.join('\n')
  }
}

// 全局调试函数
if (typeof window !== 'undefined') {
  (window as any).yeyuDataValidator = DataValidator
}

// 对话框工具类

export interface DialogOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  showCancel?: boolean
  showConfirm?: boolean
  beforeClose?: (action: string) => boolean | Promise<boolean>
}

export interface DialogResult {
  action: 'confirm' | 'cancel' | 'close'
  value?: any
}

export class DialogManager {
  private static instance: DialogManager
  private dialogs: Map<string, any> = new Map()

  static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager()
    }
    return DialogManager.instance
  }

  // 显示确认对话框
  async confirm(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultOptions: DialogOptions = {
        title: '确认',
        message: '确定要执行此操作吗？',
        confirmText: '确定',
        cancelText: '取消',
        type: 'info',
        showCancel: true,
        showConfirm: true
      }

      const finalOptions = { ...defaultOptions, ...options }

      // 模拟对话框显示
      console.log(`对话框: ${finalOptions.title}`)
      console.log(`消息: ${finalOptions.message}`)

      // 模拟用户选择（在实际应用中这里会显示真实的对话框）
      setTimeout(() => {
        const userChoice = Math.random() > 0.5 // 随机模拟用户选择
        resolve(userChoice)
      }, 100)
    })
  }

  // 显示警告对话框
  async alert(message: string, title: string = '提示'): Promise<void> {
    return new Promise((resolve) => {
      console.log(`警告对话框: ${title}`)
      console.log(`消息: ${message}`)
      
      setTimeout(() => {
        resolve()
      }, 100)
    })
  }

  // 显示输入对话框
  async prompt(message: string, defaultValue: string = '', title: string = '输入'): Promise<string | null> {
    return new Promise((resolve) => {
      console.log(`输入对话框: ${title}`)
      console.log(`消息: ${message}`)
      console.log(`默认值: ${defaultValue}`)

      // 模拟用户输入
      setTimeout(() => {
        const userInput = Math.random() > 0.3 ? `用户输入_${Date.now()}` : null
        resolve(userInput)
      }, 100)
    })
  }

  // 显示选择对话框
  async select(options: string[], title: string = '选择', message?: string): Promise<number | null> {
    return new Promise((resolve) => {
      console.log(`选择对话框: ${title}`)
      if (message) console.log(`消息: ${message}`)
      console.log(`选项:`, options)

      // 模拟用户选择
      setTimeout(() => {
        const selectedIndex = Math.random() > 0.3 ? Math.floor(Math.random() * options.length) : null
        resolve(selectedIndex)
      }, 100)
    })
  }

  // 显示加载对话框
  showLoading(message: string = '加载中...'): string {
    const id = `loading_${Date.now()}`
    console.log(`加载对话框 [${id}]: ${message}`)
    
    this.dialogs.set(id, {
      type: 'loading',
      message,
      startTime: Date.now()
    })

    return id
  }

  // 隐藏加载对话框
  hideLoading(id: string): void {
    const dialog = this.dialogs.get(id)
    if (dialog) {
      const duration = Date.now() - dialog.startTime
      console.log(`加载对话框 [${id}] 关闭，持续时间: ${duration}ms`)
      this.dialogs.delete(id)
    }
  }

  // 显示进度对话框
  showProgress(message: string = '处理中...', max: number = 100): string {
    const id = `progress_${Date.now()}`
    console.log(`进度对话框 [${id}]: ${message}`)
    
    this.dialogs.set(id, {
      type: 'progress',
      message,
      progress: 0,
      max,
      startTime: Date.now()
    })

    return id
  }

  // 更新进度
  updateProgress(id: string, progress: number, message?: string): void {
    const dialog = this.dialogs.get(id)
    if (dialog && dialog.type === 'progress') {
      dialog.progress = progress
      if (message) dialog.message = message
      
      const percentage = Math.round((progress / dialog.max) * 100)
      console.log(`进度对话框 [${id}] 更新: ${percentage}% - ${dialog.message}`)
    }
  }

  // 隐藏进度对话框
  hideProgress(id: string): void {
    const dialog = this.dialogs.get(id)
    if (dialog) {
      const duration = Date.now() - dialog.startTime
      console.log(`进度对话框 [${id}] 完成，持续时间: ${duration}ms`)
      this.dialogs.delete(id)
    }
  }

  // 显示自定义对话框
  async showCustom(component: any, props?: any): Promise<any> {
    return new Promise((resolve) => {
      console.log(`自定义对话框:`, component, props)
      
      // 模拟自定义对话框结果
      setTimeout(() => {
        resolve({ action: 'confirm', data: props })
      }, 500)
    })
  }

  // 关闭所有对话框
  closeAll(): void {
    console.log('关闭所有对话框')
    this.dialogs.clear()
  }

  // 获取当前活跃的对话框数量
  getActiveCount(): number {
    return this.dialogs.size
  }
}

// 创建全局实例
export const dialogManager = DialogManager.getInstance()

// 便捷方法
export const showConfirm = (options: DialogOptions) => dialogManager.confirm(options)
export const showAlert = (message: string, title?: string) => dialogManager.alert(message, title)
export const showPrompt = (message: string, defaultValue?: string, title?: string) => 
  dialogManager.prompt(message, defaultValue, title)
export const showSelect = (options: string[], title?: string, message?: string) => 
  dialogManager.select(options, title, message)
export const showLoading = (message?: string) => dialogManager.showLoading(message)
export const hideLoading = (id: string) => dialogManager.hideLoading(id)
export const showProgress = (message?: string, max?: number) => dialogManager.showProgress(message, max)
export const updateProgress = (id: string, progress: number, message?: string) => 
  dialogManager.updateProgress(id, progress, message)
export const hideProgress = (id: string) => dialogManager.hideProgress(id)

// 类型导出
export type { DialogOptions, DialogResult }

/**
 * 文件上传工具
 */

export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface FileValidation {
  valid: boolean
  error?: string
}

class FileUploader {
  private listeners: { [key: string]: Function[] } = {}

  // 验证文件
  validateFile(file: File): FileValidation {
    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: '文件大小不能超过10MB' }
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型' }
    }

    return { valid: true }
  }

  // 上传文件
  async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      // 模拟上传进度
      this.emit('uploadProgress', { progress: 0 })
      
      // 创建FormData
      const formData = new FormData()
      formData.append('file', file)

      // 模拟上传过程
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        this.emit('uploadProgress', { progress: i })
      }

      // 模拟成功上传
      const mockUrl = URL.createObjectURL(file)
      this.emit('uploadComplete', { url: mockUrl })
      
      return { success: true, url: mockUrl }
    } catch (error) {
      this.emit('uploadError', { error: '上传失败' })
      return { success: false, error: '上传失败' }
    }
  }

  // 事件监听
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  // 移除事件监听
  off(event: string, callback?: Function) {
    if (!this.listeners[event]) return
    
    if (callback) {
      const index = this.listeners[event].indexOf(callback)
      if (index > -1) {
        this.listeners[event].splice(index, 1)
      }
    } else {
      this.listeners[event] = []
    }
  }

  // 触发事件
  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }
}

export const fileUploader = new FileUploader()
export default FileUploader

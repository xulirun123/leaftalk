// 小程序运行器工具类

export interface MiniProgram {
  id: string
  name: string
  description: string
  icon: string
  version: string
  author: string
  category: string
  size: string
  rating: number
  downloads: number
  screenshots: string[]
  permissions: string[]
  isInstalled: boolean
  isRunning: boolean
}

export interface MiniProgramRuntime {
  id: string
  name: string
  status: 'running' | 'paused' | 'stopped'
  memory: number
  cpu: number
  startTime: string
}

export class MiniProgramManager {
  private installedPrograms: Map<string, MiniProgram> = new Map()
  private runningPrograms: Map<string, MiniProgramRuntime> = new Map()

  // 获取已安装的小程序列表
  getInstalledPrograms(): MiniProgram[] {
    return Array.from(this.installedPrograms.values())
  }

  // 获取正在运行的小程序列表
  getRunningPrograms(): MiniProgramRuntime[] {
    return Array.from(this.runningPrograms.values())
  }

  // 安装小程序
  async installProgram(program: MiniProgram): Promise<boolean> {
    try {
      // 模拟安装过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      program.isInstalled = true
      this.installedPrograms.set(program.id, program)
      
      console.log(`小程序 ${program.name} 安装成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${program.name} 安装失败:`, error)
      return false
    }
  }

  // 卸载小程序
  async uninstallProgram(programId: string): Promise<boolean> {
    try {
      // 先停止运行
      await this.stopProgram(programId)
      
      // 从已安装列表中移除
      this.installedPrograms.delete(programId)
      
      console.log(`小程序 ${programId} 卸载成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 卸载失败:`, error)
      return false
    }
  }

  // 启动小程序
  async startProgram(programId: string): Promise<boolean> {
    try {
      const program = this.installedPrograms.get(programId)
      if (!program) {
        throw new Error('小程序未安装')
      }

      if (this.runningPrograms.has(programId)) {
        console.log(`小程序 ${program.name} 已在运行`)
        return true
      }

      // 模拟启动过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      const runtime: MiniProgramRuntime = {
        id: programId,
        name: program.name,
        status: 'running',
        memory: Math.floor(Math.random() * 50) + 10, // 10-60MB
        cpu: Math.floor(Math.random() * 20) + 5, // 5-25%
        startTime: new Date().toISOString()
      }

      this.runningPrograms.set(programId, runtime)
      program.isRunning = true

      console.log(`小程序 ${program.name} 启动成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 启动失败:`, error)
      return false
    }
  }

  // 停止小程序
  async stopProgram(programId: string): Promise<boolean> {
    try {
      const program = this.installedPrograms.get(programId)
      const runtime = this.runningPrograms.get(programId)

      if (!runtime) {
        console.log(`小程序 ${programId} 未在运行`)
        return true
      }

      // 模拟停止过程
      await new Promise(resolve => setTimeout(resolve, 500))

      this.runningPrograms.delete(programId)
      if (program) {
        program.isRunning = false
      }

      console.log(`小程序 ${programId} 停止成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 停止失败:`, error)
      return false
    }
  }

  // 暂停小程序
  async pauseProgram(programId: string): Promise<boolean> {
    try {
      const runtime = this.runningPrograms.get(programId)
      if (!runtime) {
        throw new Error('小程序未在运行')
      }

      runtime.status = 'paused'
      console.log(`小程序 ${programId} 暂停成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 暂停失败:`, error)
      return false
    }
  }

  // 恢复小程序
  async resumeProgram(programId: string): Promise<boolean> {
    try {
      const runtime = this.runningPrograms.get(programId)
      if (!runtime) {
        throw new Error('小程序未在运行')
      }

      runtime.status = 'running'
      console.log(`小程序 ${programId} 恢复成功`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 恢复失败:`, error)
      return false
    }
  }

  // 获取小程序信息
  getProgramInfo(programId: string): MiniProgram | null {
    return this.installedPrograms.get(programId) || null
  }

  // 获取小程序运行时信息
  getProgramRuntime(programId: string): MiniProgramRuntime | null {
    return this.runningPrograms.get(programId) || null
  }

  // 检查小程序权限
  checkPermissions(programId: string, requiredPermissions: string[]): boolean {
    const program = this.installedPrograms.get(programId)
    if (!program) return false

    return requiredPermissions.every(permission => 
      program.permissions.includes(permission)
    )
  }

  // 更新小程序
  async updateProgram(programId: string, newVersion: string): Promise<boolean> {
    try {
      const program = this.installedPrograms.get(programId)
      if (!program) {
        throw new Error('小程序未安装')
      }

      // 模拟更新过程
      await new Promise(resolve => setTimeout(resolve, 3000))

      program.version = newVersion
      console.log(`小程序 ${program.name} 更新到版本 ${newVersion}`)
      return true
    } catch (error) {
      console.error(`小程序 ${programId} 更新失败:`, error)
      return false
    }
  }

  // 清理资源
  cleanup(): void {
    // 停止所有运行中的小程序
    const runningIds = Array.from(this.runningPrograms.keys())
    runningIds.forEach(id => {
      this.stopProgram(id)
    })

    this.runningPrograms.clear()
    console.log('小程序管理器资源清理完成')
  }
}

// 创建全局小程序管理器实例
export const miniProgramManager = new MiniProgramManager()

// 工具函数
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatMemoryUsage(mb: number): string {
  return `${mb.toFixed(1)} MB`
}

export function formatCpuUsage(percent: number): string {
  return `${percent.toFixed(1)}%`
}

export function generateMockPrograms(): MiniProgram[] {
  return [
    {
      id: 'family-tree-viewer',
      name: '族谱查看器',
      description: '专业的家族族谱查看和编辑工具',
      icon: '🌳',
      version: '1.2.0',
      author: '叶语团队',
      category: '工具',
      size: '2.5 MB',
      rating: 4.8,
      downloads: 1250,
      screenshots: [],
      permissions: ['读取族谱数据', '编辑族谱信息'],
      isInstalled: false,
      isRunning: false
    },
    {
      id: 'name-generator',
      name: '智能起名',
      description: '基于传统文化的智能起名工具',
      icon: '📝',
      version: '2.1.0',
      author: '文化工作室',
      category: '文化',
      size: '1.8 MB',
      rating: 4.6,
      downloads: 890,
      screenshots: [],
      permissions: ['访问姓名数据库'],
      isInstalled: false,
      isRunning: false
    }
  ]
}

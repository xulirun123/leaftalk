/**
 * 模块注册系统
 * 统一管理应用模块的注册、初始化和生命周期
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'

// 模块接口定义
export interface Module {
  name: string
  version: string
  dependencies?: string[]
  routes?: any[]
  components?: Record<string, any>
  install?(context: ModuleContext): Promise<void> | void
}

// 模块上下文
export interface ModuleContext {
  app: App
  router: Router
  pinia: Pinia
}

// 模块注册器
class ModuleRegistry {
  private modules: Map<string, Module> = new Map()
  private context: ModuleContext | null = null
  private installed: Set<string> = new Set()

  /**
   * 设置模块上下文
   */
  setContext(context: ModuleContext) {
    this.context = context
  }

  /**
   * 注册单个模块
   */
  async register(module: Module): Promise<void> {
    if (this.modules.has(module.name)) {
      console.warn(`模块 ${module.name} 已经注册`)
      return
    }

    this.modules.set(module.name, module)
    console.log(`📦 注册模块: ${module.name} v${module.version}`)

    // 如果上下文已设置，立即安装
    if (this.context) {
      await this.install(module)
    }
  }

  /**
   * 批量注册模块
   */
  async registerAll(modules: Module[]): Promise<void> {
    for (const module of modules) {
      await this.register(module)
    }
  }

  /**
   * 安装模块
   */
  private async install(module: Module): Promise<void> {
    if (this.installed.has(module.name)) {
      return
    }

    if (!this.context) {
      throw new Error('模块上下文未设置')
    }

    try {
      // 检查依赖
      if (module.dependencies) {
        for (const dep of module.dependencies) {
          if (!this.installed.has(dep)) {
            throw new Error(`模块 ${module.name} 依赖 ${dep}，但 ${dep} 未安装`)
          }
        }
      }

      // 注册路由
      if (module.routes) {
        for (const route of module.routes) {
          this.context.router.addRoute(route)
        }
      }

      // 注册全局组件
      if (module.components) {
        for (const [name, component] of Object.entries(module.components)) {
          this.context.app.component(name, component)
        }
      }

      // 执行模块安装逻辑
      if (module.install) {
        await module.install(this.context)
      }

      this.installed.add(module.name)
      console.log(`✅ 模块 ${module.name} 安装成功`)
    } catch (error) {
      console.error(`❌ 模块 ${module.name} 安装失败:`, error)
      throw error
    }
  }

  /**
   * 获取已注册的模块
   */
  getModule(name: string): Module | undefined {
    return this.modules.get(name)
  }

  /**
   * 获取所有已注册的模块
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values())
  }

  /**
   * 检查模块是否已安装
   */
  isInstalled(name: string): boolean {
    return this.installed.has(name)
  }
}

// 创建全局实例
export const moduleRegistry = new ModuleRegistry()

// 导出类型
export type { Module, ModuleContext }
export default moduleRegistry

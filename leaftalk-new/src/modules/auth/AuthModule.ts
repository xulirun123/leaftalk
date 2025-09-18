/**
 * 认证模块
 * 负责用户登录、注册、身份验证等功能
 */

import type { Module, ModuleContext } from '../../shared/core/ModuleRegistry'

export class AuthModule implements Module {
  name = 'auth'
  version = '1.0.0'
  dependencies: string[] = []
  
  // 模块路由
  routes = [
    {
      path: '/login',
      name: 'Login',
      component: () => import('./pages/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register', 
      component: () => import('./pages/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/verify-identity',
      name: 'VerifyIdentity',
      component: () => import('./pages/IdentityVerificationNew2024.vue'),
      meta: { requiresAuth: true }
    }
  ]
  
  // 全局组件
  components = {
    // 可以在这里注册全局组件
  }
  
  /**
   * 安装模块
   */
  async install(context: ModuleContext): Promise<void> {
    const { app, router, pinia } = context
    
    // 注册认证相关的全局属性
    console.log('  🔐 初始化认证系统...')
    
    // 暂时禁用AuthModule的路由守卫，使用全局路由守卫避免冲突
    // this.setupRouterGuards(router)
    
    // 初始化认证状态
    await this.initAuthState(pinia)
    
    console.log('  ✅ 认证模块安装完成')
  }
  
  /**
   * 卸载模块
   */
  async uninstall(context: ModuleContext): Promise<void> {
    console.log('  🗑️ 卸载认证模块...')
    // 清理认证相关资源
  }
  
  /**
   * 设置路由守卫 - 暂时禁用以调试通讯录导航问题
   */
  private setupRouterGuards(router: any) {
    console.log('🔒 AuthModule 路由守卫已暂时禁用')
    return

    router.beforeEach(async (to: any, from: any, next: any) => {
      console.log('🔒 路由守卫检查:', to.path)

      // 确保用户状态已恢复
      const stateRestored = await this.ensureUserStateRestored()

      // 从appStore获取认证状态
      const { useAppStore } = await import('../../shared/stores/appStore')
      const appStore = useAppStore()
      const isAuthenticated = !!(appStore.user && appStore.token)

      console.log('🔒 认证状态:', {
        path: to.path,
        hasUser: !!appStore.user,
        hasToken: !!appStore.token,
        tokenLength: appStore.token?.length || 0,
        isAuthenticated,
        stateRestored
      })

      // 如果访问首页，根据登录状态重定向
      if (to.path === '/') {
        if (isAuthenticated) {
          console.log('🔒 已登录用户访问首页，继续显示首页')
          // 不重定向，直接显示首页
        } else {
          console.log('🔒 未登录用户访问首页，重定向到登录页')
          next('/login')
          return
        }
      }

      // 检查实名认证页面访问权限
      if (to.path === '/verify-identity' && isAuthenticated) {
        try {
          // 检查用户是否已经实名认证
          const response = await fetch('http://127.0.0.1:8893/api/identity/status', {
            headers: { 'Authorization': `Bearer ${appStore.token}` }
          })
          const result = await response.json()

          if (result.success && result.data.verified) {
            console.log('🔒 用户已实名认证，重定向到聊天页')
            next('/chat')
            return
          }
        } catch (error) {
          console.log('🔍 实名认证状态检查失败，继续访问认证页面')
        }
      }

      // 检查路由是否需要认证
      if (to.meta?.requiresAuth && !isAuthenticated) {
        console.log('🔒 需要认证的路由，重定向到登录页:', to.path)
        next('/login')
        return
      }

      // 如果已登录且访问登录/注册页，重定向到首页
      if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
        console.log('🔒 已登录用户访问登录页，重定向到首页')
        next('/')
        return
      }

      next()
    })
  }
  
  /**
   * 初始化认证状态
   */
  private async initAuthState(pinia: any) {
    try {
      console.log('  🔄 恢复用户认证状态...')

      const { useAppStore } = await import('../../shared/stores/appStore')
      const appStore = useAppStore()

      // 从localStorage恢复状态
      const restored = appStore.restoreUserFromStorage()

      if (restored) {
        console.log('  ✅ 认证状态恢复成功')
      } else {
        console.log('  ⚠️ 未找到有效的认证状态')
      }
    } catch (error) {
      console.warn('  ⚠️ 认证状态恢复失败:', error)
    }
  }

  /**
   * 确保用户状态已恢复
   */
  private async ensureUserStateRestored() {
    try {
      const { useAppStore } = await import('../../shared/stores/appStore')
      const appStore = useAppStore()

      console.log('🔄 检查appStore状态:', {
        hasUser: !!appStore.user,
        hasToken: !!appStore.token,
        tokenPreview: appStore.token ? appStore.token.substring(0, 20) + '...' : 'null'
      })

      // 如果appStore中没有用户信息，尝试从localStorage恢复
      if (!appStore.user || !appStore.token) {
        console.log('🔄 appStore中无用户状态，尝试从localStorage恢复')
        const restored = appStore.restoreUserFromStorage()

        console.log('🔄 恢复后状态:', {
          restored: restored,
          hasStoreUser: !!appStore.user,
          hasStoreToken: !!appStore.token
        })

        return restored
      } else {
        console.log('🔄 appStore中已有用户状态，无需恢复')
        return true
      }
    } catch (error) {
      console.error('❌ 恢复用户状态失败:', error)
      return false
    }
  }
}

export default AuthModule

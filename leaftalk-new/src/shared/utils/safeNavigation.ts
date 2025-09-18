import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

/**
 * 安全导航工具
 * 提供路由跳转的安全检查和错误处理
 */
export function useSafeNavigation() {
  const router = useRouter()
  const authStore = useAuthStore()

  /**
   * 安全跳转到指定路由
   */
  async function safePush(to: string | { name: string; params?: any; query?: any }) {
    try {
      await router.push(to)
    } catch (error) {
      console.error('Navigation failed:', error)
      // 可以在这里添加用户友好的错误提示
    }
  }

  /**
   * 安全替换当前路由
   */
  async function safeReplace(to: string | { name: string; params?: any; query?: any }) {
    try {
      await router.replace(to)
    } catch (error) {
      console.error('Navigation replace failed:', error)
    }
  }

  /**
   * 安全返回上一页
   */
  function safeBack() {
    try {
      if (window.history.length > 1) {
        router.back()
      } else {
        // 如果没有历史记录，跳转到首页
        safePush('/')
      }
    } catch (error) {
      console.error('Navigation back failed:', error)
      safePush('/')
    }
  }

  /**
   * 需要认证的安全跳转
   */
  async function safeAuthPush(to: string | { name: string; params?: any; query?: any }) {
    if (!authStore.isAuthenticated) {
      // 保存目标路由，登录后跳转
      const targetRoute = typeof to === 'string' ? to : router.resolve(to).fullPath
      await safePush({
        name: 'Login',
        query: { redirect: targetRoute }
      })
      return
    }
    
    await safePush(to)
  }

  /**
   * 检查路由是否存在
   */
  function routeExists(name: string): boolean {
    try {
      const route = router.resolve({ name })
      return route.name !== undefined
    } catch {
      return false
    }
  }

  /**
   * 获取当前路由信息
   */
  function getCurrentRoute() {
    return router.currentRoute.value
  }

  /**
   * 检查是否可以返回
   */
  function canGoBack(): boolean {
    return window.history.length > 1
  }

  /**
   * 跳转到错误页面
   */
  function goToErrorPage(errorCode: number = 404) {
    safePush({
      name: 'Error',
      params: { code: errorCode.toString() }
    })
  }

  /**
   * 跳转到首页
   */
  function goToHome() {
    safePush('/')
  }

  /**
   * 跳转到登录页
   */
  function goToLogin(redirect?: string) {
    const query = redirect ? { redirect } : undefined
    safePush({
      name: 'Login',
      query
    })
  }

  /**
   * 退出登录并跳转
   */
  async function logout() {
    try {
      await authStore.logout()
      await safeReplace('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    safePush,
    safeReplace,
    safeBack,
    safeAuthPush,
    routeExists,
    getCurrentRoute,
    canGoBack,
    goToErrorPage,
    goToHome,
    goToLogin,
    logout
  }
}

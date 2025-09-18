import type { ModuleInterface } from '../../shared/types/module'

class DiscoverModule implements ModuleInterface {
  name = 'discover'
  version = '1.0.0'
  
  routes = [
    {
      path: '/discover',
      name: 'Discover',
      component: () => import('./pages/MobileDiscover.vue'),
      meta: {
        title: '发现',
        requiresAuth: false,
        keepAlive: true
      }
    }
  ]

  async install(context: any) {
    console.log('  🔍 初始化发现系统...')

    // 注册路由
    this.routes.forEach(route => {
      context.router.addRoute(route)
    })

    console.log('  ✅ 发现模块安装完成')
  }
}

export default DiscoverModule

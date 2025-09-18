import type { ModuleInterface } from '../../shared/types/module'

class ProfileModule implements ModuleInterface {
  name = 'profile'
  version = '1.0.0'
  
  routes = [
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('./pages/MobileProfile.vue'),
      meta: {
        title: '我',
        requiresAuth: false,
        keepAlive: true
      }
    }
  ]

  async install(context: any) {
    console.log('  👤 初始化个人中心系统...')

    // 注册路由
    this.routes.forEach(route => {
      context.router.addRoute(route)
    })

    console.log('  ✅ 个人中心模块安装完成')
  }
}

export default ProfileModule

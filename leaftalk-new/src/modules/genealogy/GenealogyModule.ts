import type { ModuleInterface } from '../../shared/types/module'

class GenealogyModule implements ModuleInterface {
  name = 'genealogy'
  version = '1.0.0'
  
  routes = [
    {
      path: '/genealogy',
      name: 'Genealogy',
      component: () => import('./pages/Genealogy.vue'),
      meta: {
        title: '族谱 - 叶语',
        requiresAuth: false,
        keepAlive: true
      }
    }
  ]

  async install(context: any) {
    console.log('  🌳 初始化族谱系统...')

    // 注册路由
    this.routes.forEach(route => {
      context.router.addRoute(route)
    })

    console.log('  ✅ 族谱模块安装完成')
  }
}

export default GenealogyModule

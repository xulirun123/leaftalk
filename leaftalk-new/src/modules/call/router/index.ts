/**
 * 仿微信通话系统 - 路由配置
 */

import type { RouteRecordRaw } from 'vue-router'

const callRoutes: RouteRecordRaw[] = [
  {
    path: '/call',
    name: 'Call',
    component: () => import('../pages/CallPage.vue'),
    meta: {
      requiresAuth: true,
      title: '通话',
      hideTabBar: true,
      fullScreen: true
    }
  }
  ,
  {
    path: '/incoming-call/:id',
    name: 'IncomingCallAliasSimple',
    beforeEnter: (to, from, next) => {
      const id = to.params.id as string
      const merged = { ...to.query, action: 'incoming', targetUserId: id }
      next({ path: '/call', query: merged })
    },
    meta: { hideTabBar: true, fullScreen: true }
  },
  {
    path: '/incoming-call/:id/:type',
    name: 'IncomingCallAliasWithType',
    beforeEnter: (to, from, next) => {
      const id = to.params.id as string
      const type = to.params.type as string
      const merged = { ...to.query, action: 'incoming', targetUserId: id, type }
      next({ path: '/call', query: merged })
    },
    meta: { hideTabBar: true, fullScreen: true }
  }
]

export default callRoutes

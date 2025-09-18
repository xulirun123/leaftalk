import { createRouter, createWebHistory } from 'vue-router'

// 防抖机制，避免频繁的token验证
let lastTokenCheck = 0
const TOKEN_CHECK_INTERVAL = 5000 // 5秒内不重复验证
import MomentsPage from '../modules/moments/pages/MomentsPage.vue'
import IdentityVerificationNew2024 from '../modules/auth/pages/IdentityVerificationNew2024.vue'
import NewFriends from '../modules/contacts/pages/NewFriends.vue'
import ChatHomeEnterprise from '../modules/chat/pages/ChatHomeEnterprise.vue'
import Login from '../modules/auth/pages/Login.vue'
import RegisterNew2024 from '../modules/auth/pages/RegisterNew2024.vue'
import MobileContacts from '../modules/contacts/pages/MobileContacts.vue'
import MobileDiscover from '../modules/discover/pages/MobileDiscover.vue'
import MobileProfile from '../modules/profile/pages/MobileProfile.vue'
import AddFriendNew from '../modules/contacts/pages/AddFriendNew.vue'

// WebRTC 通话页面
import VideoCall from '../modules/webrtc/pages/VideoCall.vue'
import VoiceCall from '../modules/webrtc/pages/VoiceCall.vue'
import IncomingCall from '../modules/webrtc/pages/IncomingCall.vue'

console.log('🔍 路由文件正在加载...')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ChatHomeEnterprise,
    meta: {
      title: '叶语',
      requiresAuth: true,  // 首页需要认证
      keepAlive: true
    }
  },
  {
    path: '/chat',
    name: 'ChatHome',
    component: () => import('../modules/chat/pages/ChatHomeEnterprise.vue'),
    meta: {
      title: '微信',
      requiresAuth: true,
      keepAlive: true
    }
  },

  // WebRTC 通话路由
  {
    path: '/video-call/:id',
    name: 'VideoCall',
    component: VideoCall,
    meta: {
      title: '视频通话',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },
  {
    path: '/voice-call/:id',
    name: 'VoiceCall',
    component: VoiceCall,
    meta: {
      title: '语音通话',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },
  {
    path: '/incoming-call/:callerId',
    name: 'IncomingCall',
    component: IncomingCall,
    meta: {
      title: '来电',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },


  {
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('../modules/chat/pages/ChatSimple.vue'),
    meta: {
      title: '聊天',
      requiresAuth: false,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true  // 聊天页面有自己的导航栏
    }
  },
  {
    path: '/chat-camera',
    name: 'ChatCamera',
    component: () => import('../modules/chat/pages/ChatCamera.vue'),
    meta: {
      title: '拍摄',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: true,
      hideTabBar: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录 - 叶语',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterNew2024,
    meta: {
      title: '注册 - 叶语',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/identity-verification',
    name: 'IdentityVerification',
    component: IdentityVerificationNew2024,
    meta: {
      title: '实名认证',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true   // 隐藏底部导航栏，但显示全局顶部导航栏
    }
  },
  {
    path: '/genealogy',
    name: 'Genealogy',
    component: () => import('../modules/genealogy/pages/Genealogy.vue'),
    meta: {
      title: '族谱 - 叶语',
      requiresAuth: false, // 族谱页面不需要每次检测认证状态，实名认证永久有效
      keepAlive: true
    }
  },
  {
    path: '/genealogy/:id/tree',
    name: 'FamilyTree',
    component: () => import('../modules/genealogy/pages/FamilyTreeNew.vue'),
    meta: {
      title: '家族树 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/spouse/management',
    name: 'SpouseManagement',
    component: () => import('../modules/genealogy/pages/SpouseManagement.vue'),
    meta: {
      title: '配偶关联管理',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/member/:memberId',
    name: 'MemberProfile',
    component: () => import('../modules/genealogy/pages/MemberProfile.vue'),
    meta: {
      title: '成员资料 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/generations',
    name: 'GenerationTable',
    component: () => import('../modules/genealogy/pages/GenerationTable.vue'),
    meta: {
      title: '字辈对照表 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/activities',
    name: 'FamilyActivities',
    component: () => import('../modules/genealogy/pages/FamilyActivities.vue'),
    meta: {
      title: '家族活动 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/member/:memberId/tomb-navigation',
    name: 'TombNavigation',
    component: () => import('../modules/genealogy/pages/TombNavigation.vue'),
    meta: {
      title: '墓址导航 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/member/:memberId/ai-chat',
    name: 'AIAncestorChat',
    component: () => import('../modules/genealogy/pages/AIAncestorChat.vue'),
    meta: {
      title: 'AI对话 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/stories',
    name: 'FamilyStories',
    component: () => import('../modules/genealogy/pages/FamilyStories.vue'),
    meta: {
      title: '家族故事 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/meetings',
    name: 'FamilyMeetings',
    component: () => import('../modules/genealogy/pages/FamilyMeetings.vue'),
    meta: {
      title: '家族会议 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/albums',
    name: 'FamilyAlbums',
    component: () => import('../modules/genealogy/pages/FamilyAlbums.vue'),
    meta: {
      title: '家族相册 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/sacred-cooperation',
    name: 'SacredCooperation',
    component: () => import('../modules/genealogy/pages/SacredCooperation.vue'),
    meta: {
      title: '圣地合作 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  // 暂时注释掉有语法错误的TombSweeping组件
  // {
  //   path: '/genealogy/:genealogyId/tomb-sweeping',
  //   name: 'TombSweeping',
  //   component: () => import('../modules/genealogy/pages/TombSweeping.vue'),
  //   meta: {
  //     title: '清明扫墓 - 叶语',
  //     requiresAuth: true,
  //     keepAlive: false
  //   }
  // },
  {
    path: '/genealogy/:genealogyId/virtual-offerings',
    name: 'VirtualOfferings',
    component: () => import('../modules/genealogy/pages/VirtualOfferings.vue'),
    meta: {
      title: '虚拟祭祀商品 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/memorial-worship',
    name: 'MemorialWorship',
    component: () => import('../modules/genealogy/pages/MemorialWorship.vue'),
    meta: {
      title: '祭奠祭扫 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/heritage',
    name: 'FamilyHeritage',
    component: () => import('../modules/genealogy/pages/FamilyHeritage.vue'),
    meta: {
      title: '家族传承 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/online-search',
    name: 'OnlineSearch',
    component: () => import('../modules/genealogy/pages/OnlineSearch.vue'),
    meta: {
      title: '线上寻亲 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/ai-name-fengshui',
    name: 'AINameFengshui',
    component: () => import('../modules/genealogy/pages/AINameFengshui.vue'),
    meta: {
      title: 'AI取名风水 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/genealogy/:genealogyId/metaverse',
    name: 'MetaverseIntegration',
    component: () => import('../modules/genealogy/pages/MetaverseIntegration.vue'),
    meta: {
      title: '元宇宙家谱 - 叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/dev',
    name: 'DevTools',
    component: () => import('../shared/pages/dev/DevTools.vue'),
    meta: {
      title: '开发工具 - 叶语',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: MobileContacts,
    meta: {
      title: '通讯录',
      requiresAuth: true, // 恢复认证要求
      keepAlive: true
    }
  },
  {
    path: '/discover',
    name: 'Discover',
    component: MobileDiscover,
    meta: {
      title: '发现',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: MobileProfile,
    meta: {
      title: '我',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: true
    }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: () => import('../modules/profile/pages/EditProfileSimple.vue'),
    meta: {
      title: '编辑资料',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/user-profile/:userId',
    name: 'UserProfile',
    component: () => import('../modules/user/pages/UserProfile.vue'),
    meta: {
      title: '用户资料',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/moments',
    name: 'Moments',
    component: MomentsPage,
    meta: {
      title: '朋友圈',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: true,
      hideTopBar: true,
      hideTabBar: true
    }
  },
  {
    path: '/moments/:userId',
    name: 'FriendMoments',
    component: MomentsPage,
    meta: {
      title: '朋友圈',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false,
      hideTopBar: true,
      hideTabBar: true
    }
  },
  {
    path: '/video-channel',
    name: 'VideoChannel',
    component: () => import('../modules/video/pages/VideoChannel.vue'),
    meta: {
      title: '视频号',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/publish-video',
    name: 'PublishVideo',
    component: () => import('../modules/video/pages/PublishVideo.vue'),
    meta: {
      title: '发布视频号',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false
    }
  },
  {
    path: '/settings/notification-sound',
    name: 'NotificationSound',
    component: () => import('../modules/settings/pages/NotificationSound.vue'),
    meta: {
      title: '新消息提示音',
      requiresAuth: false,
      keepAlive: false
    }
  },

  {
    path: '/settings/call-music',
    name: 'CallMusic',
    component: () => import('../modules/settings/pages/CallMusic.vue'),
    meta: {
      title: '通话背景音乐',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/do-not-disturb',
    name: 'DoNotDisturb',
    component: () => import('../modules/settings/pages/DoNotDisturb.vue'),
    meta: {
      title: '免打扰时间',
      requiresAuth: false,
      keepAlive: false
    }
  },

  {
    path: '/user-video-channel/:id',
    name: 'UserVideoChannel',
    component: () => import('../modules/video/pages/UserVideoChannel.vue'),
    meta: {
      title: '视频号',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true
    }
  },
  {
    path: '/video-player',
    name: 'VideoPlayer',
    component: () => import('../modules/video/pages/VideoPlayer.vue'),
    meta: {
      title: '视频号播放',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/short-video-player',
    name: 'ShortVideoPlayer',
    component: () => import('../modules/video/pages/ShortVideoPlayer.vue'),
    meta: {
      title: '短视频播放',
      requiresAuth: true,
      hideTabBar: true
    }
  },
  {
    path: '/moments-feed',
    name: 'MomentsFeed',
    component: MomentsPage,
    meta: {
      title: '朋友圈',
      requiresAuth: false,
      hideTabBar: true
    }
  },
  {
    path: '/payment-auth',
    name: 'PaymentAuth',
    component: () => import('../modules/payment/pages/PaymentAuth.vue'),
    meta: {
      title: '身份验证',
      requiresAuth: true,
      hideTabBar: true,
      hideTopBar: true
    }
  },

  {
    path: '/payment-main',
    name: 'PaymentMain',
    component: () => import('../modules/payment/pages/PaymentMain.vue'),
    meta: {
      title: '收付款',
      requiresAuth: true,
      hideTabBar: true,
      hideTopBar: true
    }
  },
  {
    path: '/payment-qr',
    name: 'PaymentQR',
    component: () => import('../modules/payment/pages/PaymentAuth.vue'),
    meta: {
      title: '身份验证',
      requiresAuth: true,
      hideTabBar: true,
      hideTopBar: true
    }
  },

  {
    path: '/video-channel/:userId',
    name: 'FriendVideoChannel',
    component: () => import('../modules/video/pages/VideoChannel.vue'),
    meta: {
      title: '视频号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/friend/:id',
    name: 'FriendProfileOld',
    component: () => import('../modules/contacts/pages/FriendProfileSimple.vue'),
    meta: {
      title: '详细资料',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: false,
      hideTabBar: true
    }
  },
  {
    path: '/new-friends',
    name: 'NewFriends',
    component: NewFriends,
    meta: {
      title: '新朋友',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false,
      hideTabBar: true
    }
  },
  {
    path: '/phone-contacts',
    name: 'PhoneContacts',
    component: () => import('../modules/contacts/pages/PhoneContacts.vue'),
    meta: {
      title: '手机联系人',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/mini-programs',
    name: 'MiniProgramStore',
    component: () => import('../modules/discover/pages/MiniProgramStore.vue'),
    meta: {
      title: '小程序序商店',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/mini-program/:id',
    name: 'MiniProgramRunner',
    component: () => import('../modules/discover/pages/MiniProgramRunner.vue'),
    meta: {
      title: '小程序',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/live',
    name: 'LiveHall',
    component: () => import('../modules/video/pages/LiveHall.vue'),
    meta: {
      title: '直播间大厅',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/live/room/:id',
    name: 'LiveRoom',
    component: () => import('../modules/video/pages/LiveRoom.vue'),
    meta: {
      title: '直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/live/streaming',
    name: 'LiveStreaming',
    component: () => import('../modules/video/pages/LiveStreaming.vue'),
    meta: {
      title: '直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('../modules/wallet/pages/Wallet.vue'),
    meta: {
      title: '钱包',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/yeyu-beans',
    name: 'YeyuBeans',
    component: () => import('../modules/wallet/pages/YeyuBeans.vue'),
    meta: {
      title: '叶语豆',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/yeyu-beans/recharge',
    name: 'YeyuBeansRecharge',
    component: () => import('../modules/wallet/pages/YeyuBeansRecharge.vue'),
    meta: {
      title: '充值叶语豆',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/yeyu-beans/history',
    name: 'YeyuBeansHistory',
    component: () => import('../modules/wallet/pages/YeyuBeansHistory.vue'),
    meta: {
      title: '叶语豆明细',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/red-packet',
    name: 'RedPacket',
    component: () => import('../modules/payment/pages/RedPacket.vue'),
    meta: {
      title: '红包',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/bills',
    name: 'Bills',
    component: () => import('../modules/payment/pages/Bills.vue'),
    meta: {
      title: '账单',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/payment-qr',
    name: 'PaymentQR',
    component: () => import('../modules/payment/pages/PaymentQR.vue'),
    meta: {
      title: '收付款',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/payment-code',
    name: 'PaymentCode',
    component: () => import('../modules/payment/pages/PaymentAuth.vue'),
    meta: {
      title: '身份验证',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },



  {
    path: '/moments/publish',
    name: 'MomentsPublish',
    component: () => import('../modules/moments/pages/MomentsPublish.vue'),
    meta: {
      title: '发表动态',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/my-video-channel',
    name: 'MyVideoChannel',
    component: () => import('../modules/video/pages/MyVideoChannel.vue'),
    meta: {
      title: '我的视频号号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/video-creator-center',
    name: 'VideoCreatorCenter',
    component: () => import('../modules/video/pages/VideoCreatorCenter.vue'),
    meta: {
      title: '创作者中心',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/creator-center',
    name: 'CreatorCenter',
    component: () => import('../modules/video/pages/VideoCreatorCenter.vue'),
    meta: {
      title: '创作者中心',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/video-shoot',
    name: 'VideoShoot',
    component: () => import('../modules/video/pages/VideoShoot.vue'),
    meta: {
      title: '拍摄作品',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/ecommerce/center',
    name: 'EcommerceCenter',
    component: () => import('../modules/discover/pages/EcommerceCenter.vue'),
    meta: {
      title: '带货中心',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/video-create',
    name: 'VideoCreate',
    component: () => import('../modules/video/pages/VideoCreate.vue'),
    meta: {
      title: '创作视频号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/video-analytics',
    name: 'VideoAnalytics',
    component: () => import('../modules/video/pages/VideoAnalytics.vue'),
    meta: {
      title: '数据分析',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/live-streaming',
    name: 'LiveStreaming',
    component: () => import('../modules/video/pages/LiveStreaming.vue'),
    meta: {
      title: '开始直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/live-browse',
    name: 'LiveBrowse',
    component: () => import('../modules/video/pages/LiveBrowse.vue'),
    meta: {
      title: '直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/product-detail/:id',
    name: 'ProductDetail',
    component: () => import('../modules/discover/pages/ProductDetail.vue'),
    meta: {
      title: '商品详情',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/chat-info/:id',
    name: 'ChatInfo',
    component: () => import('../modules/chat/pages/ChatInfo.vue'),
    meta: {
      title: '聊天信息',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: true,
      hideTabBar: true
    }
  },
  {
    path: '/video-player/:id',
    name: 'VideoPlayerWithId',
    component: () => import('../modules/video/pages/VideoPlayer.vue'),
    meta: {
      title: '视频号播放',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../modules/settings/pages/Settings.vue'),
    meta: {
      title: '设置',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/my-qr-code',
    name: 'MyQRCode',
    component: () => import('../modules/user/pages/MyQRCodeSimple.vue'),
    meta: {
      title: '我的二维码',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/account-security',
    name: 'AccountSecurity',
    component: () => import('../modules/settings/pages/AccountSecurity.vue'),
    meta: {
      title: '账号安全',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-password',
    name: 'ChangePassword',
    component: () => import('../modules/settings/pages/ChangePassword.vue'),
    meta: {
      title: '修改叶语密码',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-pay-password',
    name: 'ChangePayPassword',
    component: () => import('../modules/settings/pages/ChangePayPassword.vue'),
    meta: {
      title: '修改支付密码',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/pay-password-style',
    name: 'PayPasswordStyle',
    component: () => import('../modules/settings/pages/PayPasswordStyle.vue'),
    meta: {
      title: '选择支付密码输入样式',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/pay-password-options',
    name: 'PayPasswordOptions',
    component: () => import('../modules/settings/pages/PayPasswordOptions.vue'),
    meta: {
      title: '修改支付密码',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-gesture-password',
    name: 'ChangeGesturePassword',
    component: () => import('../modules/settings/pages/ChangeGesturePassword.vue'),
    meta: {
      title: '修改手势密码',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-yeyu-id',
    name: 'ChangeYeyuId',
    component: () => import('../modules/settings/pages/ChangeYeyuId.vue'),
    meta: {
      title: '修改叶语号',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/test-i18n',
    name: 'TestI18n',
    component: () => import('../shared/pages/test/ApiTest.vue'),
    meta: {
      title: '国际化测试',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/multi-language-demo',
    name: 'MultiLanguageDemo',
    component: () => import('../shared/pages/test/UserInfoTest.vue'),
    meta: {
      title: '多语言内容系统',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/select-contact',
    name: 'SelectContact',
    component: () => import('../modules/contacts/pages/SelectContact.vue'),
    meta: {
      title: '选择联系人',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/select-chat',
    name: 'SelectChat',
    component: () => import('../modules/chat/pages/SelectChat.vue'),
    meta: {
      title: '选择聊天',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/friend-profile/:id',
    name: 'FriendProfileNew',
    component: () => import('../modules/contacts/pages/FriendProfileSimple.vue'),
    meta: {
      title: '详细资料',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: false,
      hideTabBar: true
    }
  },
  {
    path: '/friend-settings/:id',
    name: 'FriendSettings',
    component: () => import('../modules/contacts/pages/FriendSettings.vue'),
    meta: {
      title: '资料设置',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true
    }
  },
  {
    path: '/friend-remark/:id',
    name: 'FriendRemark',
    component: () => import('../modules/contacts/pages/FriendRemarkTags.vue'),
    meta: {
      title: '设置备注和标签',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/friend-more-info/:id',
    name: 'FriendMoreInfo',
    component: () => import('../modules/contacts/pages/FriendMoreInfo.vue'),
    meta: {
      title: '更多信息',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/friend-social/:id',
    name: 'FriendSocial',
    component: () => import('../modules/contacts/pages/SocialProfile.vue'),
    meta: {
      title: '社交资料',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/friend-permissions/:id',
    name: 'FriendPermissions',
    component: () => import('../modules/contacts/pages/FriendPermissions.vue'),
    meta: {
      title: '朋友权限',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/moments/:id',
    name: 'FriendMomentsDetail',
    component: MomentsPage,
    meta: {
      title: '朋友圈',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false,
      hideTopBar: true,
      hideTabBar: true
    }
  },
  {
    path: '/video-channels/:id',
    name: 'VideoChannels',
    component: () => import('../modules/video/pages/VideoChannels.vue'),
    meta: {
      title: '视频号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/blacklist',
    name: 'BlacklistManagement',
    component: () => import('../modules/contacts/pages/BlacklistManagement.vue'),
    meta: {
      title: '黑名单管理',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/settings/privacy',
    name: 'Privacy',
    component: () => import('../modules/settings/pages/Privacy.vue'),
    meta: {
      title: '隐私',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/moments-privacy',
    name: 'MomentsPrivacy',
    component: () => import('../modules/settings/pages/MomentsPrivacy.vue'),
    meta: {
      title: '朋友圈权限',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/select-friends',
    name: 'SelectFriends',
    component: () => import('../modules/settings/pages/SelectFriends.vue'),
    meta: {
      title: '选择朋友圈',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/personal-info-privacy',
    name: 'PersonalInfoPrivacy',
    component: () => import('../modules/settings/pages/PersonalInfoPrivacy.vue'),
    meta: {
      title: '个人信息与权限',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/settings/font-size',
    name: 'FontSize',
    component: () => import('../modules/settings/pages/FontSize.vue'),
    meta: {
      title: '字体大小',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/storage',
    name: 'Storage',
    component: () => import('../modules/settings/pages/Storage.vue'),
    meta: {
      title: '存储空间',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/chat-background',
    name: 'ChatBackground',
    component: () => import('../modules/settings/pages/ChatBackground.vue'),
    meta: {
      title: '聊天背景',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('../modules/profile/pages/Services.vue'),
    meta: {
      title: '服务',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/emoji',
    name: 'EmojiSettings',
    component: () => import('../modules/settings/pages/EmojiSettings.vue'),
    meta: {
      title: '表情管理',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/photo-video',
    name: 'PhotoVideo',
    component: () => import('../modules/settings/pages/PhotoVideo.vue'),
    meta: {
      title: '照片和视频',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/accessibility',
    name: 'Accessibility',
    component: () => import('../modules/settings/pages/Accessibility.vue'),
    meta: {
      title: '辅助功能',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/enhanced-notification-sound',
    name: 'EnhancedNotificationSound',
    component: () => import('../modules/settings/pages/NotificationSound.vue'),
    meta: {
      title: '消息提示音',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/general',
    name: 'General',
    component: () => import('../modules/settings/pages/General.vue'),
    meta: {
      title: '通用',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/language-selector',
    name: 'LanguageSelector',
    component: () => import('../modules/settings/pages/LanguageSelector.vue'),
    meta: {
      title: '语言',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/notifications',
    name: 'Notifications',
    component: () => import('../modules/settings/pages/Notifications.vue'),
    meta: {
      title: '新消息通知',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/settings/personal-info',
    name: 'PersonalInfo',
    component: () => import('../modules/settings/pages/PersonalInfo.vue'),
    meta: {
      title: '个人资料',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/avatar-view',
    name: 'AvatarView',
    component: () => import('../modules/settings/pages/AvatarView.vue'),
    meta: {
      title: '个人头像',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-name',
    name: 'ChangeName',
    component: () => import('../modules/settings/pages/ChangeName.vue'),
    meta: {
      title: '更改名字',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-phone',
    name: 'ChangePhone',
    component: () => import('../modules/settings/pages/ChangePhone.vue'),
    meta: {
      title: '更改手机号', // 修改为显示页面名称
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-gender',
    name: 'ChangeGender',
    component: () => import('../modules/settings/pages/ChangeGender.vue'),
    meta: {
      title: '性别',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/change-signature',
    name: 'ChangeSignature',
    component: () => import('../modules/settings/pages/ChangeSignature.vue'),
    meta: {
      title: '个性签名',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/region-selector',
    name: 'RegionSelector',
    component: () => import('../modules/settings/pages/RegionSelector.vue'),
    meta: {
      title: '地区',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: true  // 保留：地区选择器有自己的导航栏
    }
  },
  {
    path: '/settings/change-region',
    name: 'ChangeRegion',
    component: () => import('../modules/settings/pages/RegionSelector.vue'),
    meta: {
      title: '地区',
      requiresAuth: true,
      keepAlive: false,
      hideTopBar: true  // 保留：地区选择器有自己的导航栏
    }
  },

  {
    path: '/settings/about',
    name: 'About',
    component: () => import('../modules/settings/pages/About.vue'),
    meta: {
      title: '关于叶语',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/help',
    name: 'Help',
    component: () => import('../modules/settings/pages/Help.vue'),
    meta: {
      title: '帮助与反馈',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/youth-mode',
    name: 'YouthMode',
    component: () => import('../modules/settings/pages/YouthMode.vue'),
    meta: {
      title: '未成年模式',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/settings/friend-permissions',
    name: 'SettingsFriendPermissions',
    component: () => import('../modules/settings/pages/FriendPermissions.vue'),
    meta: {
      title: '朋友权限',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/transfer',
    name: 'Transfer',
    component: () => import('../modules/payment/pages/Transfer.vue'),
    meta: {
      title: '转账',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },
  {
    path: '/chat-test/:id',
    name: 'SimpleChatTest',
    component: () => import('../modules/chat/pages/ChatSimple.vue'),
    meta: {
      title: '聊天测试',
      requiresAuth: true,
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true
    }
  },
  {
    path: '/group-chats',
    name: 'GroupChats',
    component: () => import('../modules/chat/pages/StartGroupChat.vue'),
    meta: {
      title: '群聊',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('../modules/contacts/pages/MobileContacts.vue'),
    meta: {
      title: '标签',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../modules/discover/pages/MobileSearch.vue'),
    meta: {
      title: '搜索',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/create-group',
    name: 'CreateGroup',
    component: () => import('../modules/chat/pages/CreateGroup.vue'),
    meta: {
      title: '发起群聊',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/scan',
    name: 'ScanQR',
    component: () => import('../modules/discover/pages/ScanQR.vue'),
    meta: {
      title: '扫一扫',
      requiresAuth: true,
      keepAlive: false
    }
  },



  {
    path: '/group/:id',
    name: 'GroupInfo',
    component: () => import('../modules/chat/pages/GroupInfo.vue'),
    meta: {
      title: '群聊信息',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/my-groups',
    name: 'MyGroups',
    component: () => import('../modules/chat/pages/MyGroups.vue'),
    meta: {
      title: '我的群组',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/chat-info/:id',
    name: 'ChatInfo',
    component: () => import('../modules/chat/pages/ChatInfo.vue'),
    meta: {
      title: '聊天信息',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/location',
    name: 'LocationShare',
    component: () => import('../modules/chat/pages/LocationShare.vue'),
    meta: {
      title: '位置',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/lucky-redpacket-detail',
    name: 'LuckyRedPacketDetail',
    component: () => import('../modules/payment/pages/LuckyRedPacketDetail.vue'),
    meta: {
      title: '红包详情',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/test/store',
    name: 'StoreTest',
    component: () => import('../shared/pages/test/StoreTest.vue'),
    meta: {
      title: 'Store测试',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/video-publish',
    name: 'VideoPublish',
    component: () => import('../modules/video/pages/VideoPublishFixed.vue'),
    meta: {
      title: '发布视频号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/douyin-live',
    name: 'DouyinLive',
    component: () => import('../modules/video/pages/DouyinLive.vue'),
    meta: {
      title: '抖音风格直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/live-room/:id',
    name: 'DouyinLiveRoom',
    component: () => import('../modules/video/pages/DouyinLiveRoom.vue'),
    meta: {
      title: '直播间',
      requiresAuth: true,
      keepAlive: false
    }
  },





  {
    path: '/group/:id',
    name: 'GroupChat',
    component: () => import('../modules/chat/pages/GroupChat.vue'),
    meta: {
      title: '群聊',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../modules/admin/pages/Dashboard.vue'),
    meta: {
      title: '数据分析',
      requiresAuth: true,
      keepAlive: true
    }
  },

  {
    path: '/start-group-chat',
    name: 'StartGroupChat',
    component: () => import('../modules/chat/pages/StartGroupChat.vue'),
    meta: {
      title: '发起群聊',
      requiresAuth: true,
      keepAlive: false
    }
  },

  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('../shared/pages/test/ApiTest.vue'),
    meta: {
      title: 'API测试',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../modules/user/pages/Favorites.vue'),
    meta: {
      title: '收藏',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/cards',
    name: 'Cards',
    component: () => import('../modules/user/pages/Cards.vue'),
    meta: {
      title: '卡包',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/emoji',
    name: 'Emoji',
    component: () => import('../modules/discover/pages/Emoji.vue'),
    meta: {
      title: '表情',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/user-info-test',
    name: 'UserInfoTest',
    component: () => import('../shared/pages/test/UserInfoTest.vue'),
    meta: {
      title: '用户信息测试',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/nearby',
    name: 'Nearby',
    component: () => import('../modules/discover/pages/Nearby.vue'),
    meta: {
      title: '附近的人',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('../modules/discover/pages/Games.vue'),
    meta: {
      title: '游戏中心',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('../modules/video/pages/Videos.vue'),
    meta: {
      title: '视频号',
      requiresAuth: true,
      keepAlive: false
    }
  },
  {
    path: '/publish-moment',
    name: 'PublishMoment',
    component: () => import('../modules/moments/pages/MomentsPublish.vue'),
    meta: {
      title: '发表朋友圈',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false
    }
  },
  {
    path: '/personal-moments/:id',
    name: 'PersonalMoments',
    component: MomentsPage,
    meta: {
      title: '个人朋友圈',
      requiresAuth: false, // 临时禁用认证要求
      keepAlive: false,
      hideTabBar: true,
      hideTopBar: true  // 个人朋友圈页面有自己的封面设计
    }
  },

  // AI智能助手路由
  {
    path: '/ai',
    name: 'AIAssistants',
    component: () => import('../modules/discover/pages/AIAssistants.vue'),
    meta: {
      requiresAuth: true,
      title: 'AI助手'
    }
  },
  {
    path: '/ai/chat/:assistantId?',
    name: 'AIChat',
    component: () => import('../modules/discover/pages/AIChat.vue'),
    meta: {
      requiresAuth: true,
      title: 'AI聊天'
    }
  },

  // 测试页面
  {
    path: '/test-verification',
    name: 'TestVerification',
    component: () => import('../modules/auth/pages/TestVerification.vue'),
    meta: {
      requiresAuth: false,
      title: '认证状态测试'
    }
  },


  // 删除了企业安全相关路由
  {
    path: '/icon-test',
    name: 'IconTest',
    component: () => import('../modules/admin/pages/IconTest.vue'),
    meta: {
      title: '图标测试',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0 }
  }
})

console.log('🔍 路由创建完成，总路由数:', routes.length)
console.log('🔍 /add-friend 路由:', routes.find(r => r.path === '/add-friend'))

// 基本路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  console.log('🚀 路由导航:', {
    from: from.path,
    to: to.path,
    name: to.name,
    matched: to.matched.length,
    requiresAuth: to.meta?.requiresAuth
  })

  // 🛡️ 根本防护：阻止访问自聊天URL
  if (to.path.startsWith('/chat/')) {
    const chatId = to.params.id as string
    if (chatId) {
      // 检测自聊天格式 (如: 1_1, chat_1_1)
      const cleanId = chatId.replace('chat_', '')
      const parts = cleanId.split('_')

      if (parts.length === 2 && parts[0] === parts[1]) {
        console.error('🛡️ 路由层阻止访问自聊天URL:', to.path)
        next('/')  // 重定向到首页
        return
      }
    }
  }

  // 基本认证检查
  const token = localStorage.getItem('yeyu_auth_token') || localStorage.getItem('token')
  const userInfo = localStorage.getItem('yeyu_user_info')
  const isLoggedIn = !!(token && userInfo)

  // 需要认证的页面
  if (to.meta.requiresAuth === true && !isLoggedIn) {
    console.log('❌ 需要认证，跳转到登录页')
    next('/login')
    return
  }

  // 已登录用户访问登录页，跳转到首页
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn && !to.query.force) {
    console.log('✅ 已登录，跳转到首页')
    next('/')
    return
  }

  next()
})

export default router

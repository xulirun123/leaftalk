/**
 * 认证模块数据库配置
 */

// 测试账号配置
export const testAccounts = [
  {
    id: 1,
    username: 'testuser',
    password: '123456',
    nickname: '测试用户',
    phone: '13800138000',
    yeyu_id: 'TEST123456',
    avatar: '/images/avatars/default-1.png',
    verified: false,
    real_name: '',
    id_card: ''
  },
  {
    id: 2,
    username: 'admin',
    password: 'admin123',
    nickname: '管理员',
    phone: '13800138001',
    yeyu_id: 'ADMIN001',
    avatar: '/images/avatars/default-2.png',
    verified: true,
    real_name: '系统管理员',
    id_card: ''
  },
  {
    id: 3,
    username: 'demo',
    password: 'demo123',
    nickname: '演示用户',
    phone: '13800138002',
    yeyu_id: 'DEMO001',
    avatar: '/images/avatars/default-3.png',
    verified: true,
    real_name: '演示用户',
    id_card: ''
  }
]

// 默认头像列表
export const defaultAvatars = [
  '/images/avatars/default-1.png',
  '/images/avatars/default-2.png',
  '/images/avatars/default-3.png',
  '/images/avatars/default-4.png',
  '/images/avatars/default-5.png',
  '/images/avatars/default-6.png',
  '/images/avatars/default-7.png',
  '/images/avatars/default-8.png'
]

// 获取随机默认头像
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * defaultAvatars.length)
  return defaultAvatars[randomIndex]
}

// 验证用户名格式
export const validateUsername = (username: string): boolean => {
  // 用户名：4-20位，字母数字下划线
  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/
  return usernameRegex.test(username)
}

// 验证密码格式
export const validatePassword = (password: string): boolean => {
  // 密码：6-20位
  return password.length >= 6 && password.length <= 20
}

// 验证手机号格式
export const validatePhone = (phone: string): boolean => {
  // 中国手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证叶语ID格式
export const validateYeyuId = (yeyuId: string): boolean => {
  // 叶语ID：6-12位，字母数字
  const yeyuIdRegex = /^[A-Z0-9]{6,12}$/
  return yeyuIdRegex.test(yeyuId)
}

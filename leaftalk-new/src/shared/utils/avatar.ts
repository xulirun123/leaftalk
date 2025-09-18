/**
 * 头像工具函数
 * 用于管理真实的用户头像
 */

// 精美头像资源池 - 使用更稳定的图片源
const BEAUTIFUL_AVATARS = [
  // 使用DiceBear API生成的多样化头像
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mountain&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=forest&backgroundColor=c0eb75',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ocean&backgroundColor=ffd93d',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=city&backgroundColor=ffb3ba',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=building&backgroundColor=bae1ff',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=elegant&backgroundColor=ffffba',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=fashion&backgroundColor=ffdfba',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cat&backgroundColor=c7ceea',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=dog&backgroundColor=ffc9de',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=panda&backgroundColor=b5ead7'
]

// 使用精美头像作为真实头像库
const REAL_AVATARS = BEAUTIFUL_AVATARS

// 预定义的背景颜色
const AVATAR_COLORS = [
  '#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7',
  '#FD79A8', '#FDCB6E', '#74B9FF', '#55A3FF', '#A8E6CF'
]

/**
 * 根据用户ID获取真实头像URL
 * @param userId - 用户ID
 * @returns 头像URL
 */
// 头像缓存
const avatarCache = new Map<string, string>()

export function getRealAvatarUrl(userId: string | number | null | undefined): string {
  // 如果userId为空或undefined，使用默认头像
  if (!userId) {
    return '/default-avatar.png' // 使用默认头像
  }

  // 确保 userId 是字符串
  const userIdStr = String(userId)

  // 检查缓存
  if (avatarCache.has(userIdStr)) {
    return avatarCache.get(userIdStr)!
  }

  // 构建真实用户头像API URL
  const avatarUrl = `http://localhost:8893/api/users/${userIdStr}/avatar`

  // 缓存结果
  avatarCache.set(userIdStr, avatarUrl)

  return avatarUrl
}

/**
 * 根据用户ID或名称生成头像URL（保持向后兼容）
 * @param seed - 用于生成头像的种子（通常是用户ID或名称）
 * @param backgroundColor - 背景颜色（可选）
 * @returns 头像URL
 */
// 预加载头像
const preloadedImages = new Set<string>()

function preloadAvatar(url: string) {
  if (preloadedImages.has(url)) {
    return
  }

  // 跳过外部API的预加载，避免网络错误
  if (url.includes('api.dicebear.com') || url.includes('cdn.jsdelivr.net')) {
    return
  }

  const img = new Image()
  img.onload = () => {
    preloadedImages.add(url)
  }
  img.onerror = () => {
    // 静默处理错误，不输出警告
  }
  img.src = url
}

export function generateAvatarUrl(seed: string, backgroundColor?: string): string {
  // 如果seed为空或undefined，使用默认值
  if (!seed) {
    seed = 'default_user'
  }

  // 优先使用真实头像
  return getRealAvatarUrl(seed)
}

// 预加载所有头像
export function preloadAllAvatars() {
  REAL_AVATARS.forEach(url => {
    preloadAvatar(url)
  })
}

/**
 * 为用户生成头像
 * @param userId - 用户ID
 * @param userName - 用户名称（可选，用作备用seed）
 * @returns 头像URL
 */
export function getUserAvatar(userId: string, userName?: string): string {
  const seed = userName ? `${userId}-${userName}` : userId
  return generateAvatarUrl(seed)
}

/**
 * 为群组生成头像
 * @param groupId - 群组ID
 * @param groupName - 群组名称（可选）
 * @returns 头像URL
 */
export function getGroupAvatar(groupId: string, groupName?: string): string {
  const seed = groupName ? `group-${groupId}-${groupName}` : `group-${groupId}`
  return generateAvatarUrl(seed, '6c5ce7') // 群组默认使用紫色
}

/**
 * 预定义的用户头像映射
 * 为常用的测试用户提供固定的真实头像
 */
export const PREDEFINED_AVATARS = {
  'user1': REAL_AVATARS[0],
  'user2': REAL_AVATARS[1],
  'user3': REAL_AVATARS[2],
  'user4': REAL_AVATARS[3],
  'user5': REAL_AVATARS[4],
  'test001': REAL_AVATARS[0],
  'test002': REAL_AVATARS[1],
  'test003': REAL_AVATARS[2],
  'group1': REAL_AVATARS[5],
  'group2': REAL_AVATARS[6],

  // 按名称映射
  '张三': REAL_AVATARS[0],
  '李四': REAL_AVATARS[1],
  '王五': REAL_AVATARS[2],
  '赵六': REAL_AVATARS[3],
  '钱七': REAL_AVATARS[4],
  '测试用户1': REAL_AVATARS[0],
  '测试用户2': REAL_AVATARS[1],
  '测试用户3': REAL_AVATARS[2],
  '技术交流群': REAL_AVATARS[5],
  '朋友聚会群': REAL_AVATARS[6]
}

/**
 * 获取用户或群组的头像
 * 优先使用预定义的头像，如果没有则生成新的
 * @param identifier - 用户ID、用户名或群组名
 * @param type - 类型：'user' 或 'group'
 * @returns 头像URL
 */
export function getAvatar(identifier: string, type: 'user' | 'group' = 'user'): string {
  // 先检查预定义的头像
  if (PREDEFINED_AVATARS[identifier as keyof typeof PREDEFINED_AVATARS]) {
    return PREDEFINED_AVATARS[identifier as keyof typeof PREDEFINED_AVATARS]
  }

  // 生成新的头像
  if (type === 'group') {
    return getGroupAvatar(identifier)
  } else {
    return getUserAvatar(identifier)
  }
}

/**
 * 为新注册用户随机分配一张精美头像
 * @returns 随机选择的头像URL
 */
export function getRandomBeautifulAvatar(): string {
  const randomIndex = Math.floor(Math.random() * BEAUTIFUL_AVATARS.length)
  const selectedAvatar = BEAUTIFUL_AVATARS[randomIndex]
  console.log(`🎨 为新用户随机分配头像 ${randomIndex + 1}/${BEAUTIFUL_AVATARS.length}:`, selectedAvatar)
  return selectedAvatar
}

/**
 * 获取带备用方案的头像URL
 * @param primaryUrl 主要头像URL
 * @param fallbackName 备用名称（用于生成默认头像）
 * @returns 头像URL
 */
export function getAvatarWithFallback(primaryUrl: string | null | undefined, fallbackName: string): string {
  if (primaryUrl && primaryUrl.trim()) {
    return primaryUrl
  }

  // 如果主要URL无效，生成一个基于名称的稳定头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}&backgroundColor=random`
}

/**
 * 获取所有可用的精美头像列表
 * @returns 精美头像URL数组
 */
export function getAllBeautifulAvatars(): string[] {
  return [...BEAUTIFUL_AVATARS]
}

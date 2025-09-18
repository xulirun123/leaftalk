// 昵称生成器
const ADJECTIVES = [
  '可爱的', '聪明的', '勇敢的', '温柔的', '活泼的', '开朗的', '善良的', '优雅的',
  '机智的', '幽默的', '热情的', '友善的', '乐观的', '坚强的', '独立的', '自信的',
  '创意的', '浪漫的', '神秘的', '迷人的', '阳光的', '清新的', '纯真的', '梦幻的'
]

const NOUNS = [
  '小猫', '小狗', '小兔', '小鸟', '小鱼', '小熊', '小狐', '小鹿',
  '星星', '月亮', '太阳', '彩虹', '花朵', '叶子', '雪花', '露珠',
  '天使', '精灵', '公主', '王子', '骑士', '魔法师', '探险家', '艺术家',
  '梦想家', '旅行者', '音乐家', '诗人', '画家', '舞者', '歌手', '作家'
]

const COLORS = [
  '红色', '蓝色', '绿色', '黄色', '紫色', '粉色', '橙色', '白色',
  '黑色', '灰色', '金色', '银色', '青色', '棕色', '玫瑰色', '天蓝色'
]

const ANIMALS = [
  '猫咪', '小狗', '兔子', '小鸟', '金鱼', '熊猫', '狐狸', '小鹿',
  '企鹅', '海豚', '蝴蝶', '蜜蜂', '松鼠', '刺猬', '考拉', '袋鼠'
]

/**
 * 生成随机昵称
 */
export function generateRandomNickname(): string {
  const patterns = [
    () => getRandomItem(ADJECTIVES) + getRandomItem(NOUNS),
    () => getRandomItem(COLORS) + getRandomItem(ANIMALS),
    () => getRandomItem(NOUNS) + generateRandomNumber(100, 999),
    () => getRandomItem(ADJECTIVES) + getRandomItem(ANIMALS) + generateRandomNumber(10, 99)
  ]
  
  const pattern = getRandomItem(patterns)
  return pattern()
}

/**
 * 生成昵称选项列表
 */
export function generateNicknameOptions(count: number = 6): string[] {
  const options = new Set<string>()
  
  while (options.size < count) {
    const nickname = generateRandomNickname()
    options.add(nickname)
  }
  
  return Array.from(options)
}

/**
 * 验证昵称是否有效
 */
export function validateNickname(nickname: string): {
  isValid: boolean
  message?: string
} {
  if (!nickname || nickname.trim().length === 0) {
    return {
      isValid: false,
      message: '昵称不能为空'
    }
  }
  
  const trimmedNickname = nickname.trim()
  
  if (trimmedNickname.length < 2) {
    return {
      isValid: false,
      message: '昵称至少需要2个字符'
    }
  }
  
  if (trimmedNickname.length > 20) {
    return {
      isValid: false,
      message: '昵称不能超过20个字符'
    }
  }
  
  // 检查是否包含特殊字符
  const specialCharsRegex = /[<>'"&\\\/\[\]{}|`~!@#$%^*()+=;:]/
  if (specialCharsRegex.test(trimmedNickname)) {
    return {
      isValid: false,
      message: '昵称不能包含特殊字符'
    }
  }
  
  // 检查是否全是数字
  if (/^\d+$/.test(trimmedNickname)) {
    return {
      isValid: false,
      message: '昵称不能全是数字'
    }
  }
  
  return {
    isValid: true
  }
}

/**
 * 获取随机数组元素
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * 生成指定范围的随机数
 */
function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 根据用户信息生成个性化昵称建议
 */
export function generatePersonalizedNicknames(userInfo: {
  realName?: string
  birthYear?: number
  gender?: 'male' | 'female'
  interests?: string[]
}): string[] {
  const suggestions: string[] = []
  
  // 基于真实姓名的建议
  if (userInfo.realName && userInfo.realName.length > 0) {
    const lastName = userInfo.realName.charAt(userInfo.realName.length - 1)
    suggestions.push(
      `小${lastName}`,
      `${lastName}${lastName}`,
      `${getRandomItem(ADJECTIVES)}${lastName}`
    )
  }
  
  // 基于出生年份的建议
  if (userInfo.birthYear) {
    const yearSuffix = userInfo.birthYear.toString().slice(-2)
    suggestions.push(
      `${getRandomItem(NOUNS)}${yearSuffix}`,
      `${userInfo.birthYear}年的${getRandomItem(ANIMALS)}`
    )
  }
  
  // 基于性别的建议
  const genderAdjectives = userInfo.gender === 'female' 
    ? ['可爱的', '温柔的', '优雅的', '甜美的', '清新的']
    : ['帅气的', '勇敢的', '阳光的', '酷酷的', '潇洒的']
  
  suggestions.push(
    `${getRandomItem(genderAdjectives)}${getRandomItem(ANIMALS)}`,
    `${getRandomItem(genderAdjectives)}${getRandomItem(NOUNS)}`
  )
  
  // 补充随机昵称到6个
  while (suggestions.length < 6) {
    suggestions.push(generateRandomNickname())
  }
  
  // 去重并返回
  return Array.from(new Set(suggestions)).slice(0, 6)
}

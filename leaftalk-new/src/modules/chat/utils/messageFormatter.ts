/**
 * 消息格式化工具
 * 用于在聊天项中正确显示各种类型的消息内容
 */

export interface MessageObject {
  type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'location' | 'emoji' | 'sticker' | 'redpacket' | 'transfer' | 'card'
  content: string
  text?: string
  fileName?: string
  duration?: number
  size?: number
}

// 文本表情映射
export const EMOJI_MAP: Record<string, string> = {
  // 基础表情
  ':)': '😊',
  ':-)': '😊',
  ':(': '😢',
  ':-(': '😢',
  ':D': '😃',
  ':-D': '😃',
  ':P': '😛',
  ':-P': '😛',
  ';)': '😉',
  ';-)': '😉',
  ':o': '😮',
  ':-o': '😮',
  ':*': '😘',
  ':-*': '😘',
  '<3': '❤️',
  '</3': '💔',
  
  // 常用表情代码
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':heart:': '❤️',
  ':fire:': '🔥',
  ':100:': '💯',
  ':ok:': '👌',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':muscle:': '💪',
  ':peace:': '✌️',
  
  // 动物表情
  ':cat:': '🐱',
  ':dog:': '🐶',
  ':pig:': '🐷',
  ':monkey:': '🐵',
  ':panda:': '🐼',
  
  // 食物表情
  ':pizza:': '🍕',
  ':burger:': '🍔',
  ':coffee:': '☕',
  ':beer:': '🍺',
  ':cake:': '🎂'
}

// 自定义表情映射
export const CUSTOM_EMOJI_MAP: Record<string, string> = {
  // 中文表情
  '微笑': '😊',
  '大笑': '😂',
  '哭泣': '😭',
  '生气': '😠',
  '惊讶': '😱',
  '爱心': '❤️',
  '赞': '👍',
  '踩': '👎',
  '握手': '🤝',
  '拥抱': '🤗',
  '思考': '🤔',
  '无语': '😑',
  '尴尬': '😅',
  '害羞': '😳',
  '得意': '😏',
  '调皮': '😜',
  '睡觉': '😴',
  '生病': '🤒',
  '眩晕': '😵',
  '疯狂': '🤪',
  
  // 手势表情
  '比心': '🤟',
  '胜利': '✌️',
  '加油': '💪',
  '祈祷': '🙏',
  '鼓掌': '👏',
  '点赞': '👍',
  '差评': '👎',
  '拳头': '👊',
  '招手': '👋',
  '竖中指': '🖕'
}

/**
 * 格式化消息文本，处理表情符号
 */
export function formatMessageText(text: string): string {
  if (!text) return ''
  
  let formattedText = text

  // 1. 处理文本表情转换为 emoji
  Object.entries(EMOJI_MAP).forEach(([textEmoji, emoji]) => {
    const regex = new RegExp(textEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    formattedText = formattedText.replace(regex, emoji)
  })

  // 2. 处理自定义表情包 [表情名称]
  formattedText = formattedText.replace(/\[([^\]]+)\]/g, (match, emojiName) => {
    return CUSTOM_EMOJI_MAP[emojiName] || match
  })

  // 3. 处理 QQ 表情代码 /表情名称
  formattedText = formattedText.replace(/\/([^\s]+)/g, (match, emojiName) => {
    return CUSTOM_EMOJI_MAP[emojiName] || match
  })

  // 4. 限制显示长度，避免过长
  if (formattedText.length > 30) {
    formattedText = formattedText.substring(0, 30) + '...'
  }

  return formattedText
}

/**
 * 格式化消息对象，根据类型返回相应的显示内容
 */
export function formatMessageObject(message: MessageObject): string {
  switch (message.type) {
    case 'text':
      return formatMessageText(message.content || message.text || '')
    
    case 'image':
      return '<span class="message-type-indicator">[图片]</span>'
    
    case 'voice':
      const duration = message.duration ? `${Math.round(message.duration)}″` : ''
      return `<span class="message-type-indicator">[语音${duration}]</span>`
    
    case 'video':
      return '<span class="message-type-indicator">[视频]</span>'
    
    case 'file':
      const fileName = message.fileName || '文件'
      return `<span class="message-type-indicator">[文件] ${fileName}</span>`
    
    case 'location':
      return '<span class="message-type-indicator">[位置]</span>'
    
    case 'emoji':
    case 'sticker':
      return '<span class="message-type-indicator">[表情]</span>'
    
    case 'redpacket':
      return '<span class="message-type-indicator red-packet">[红包]</span>'
    
    case 'transfer':
      return '<span class="message-type-indicator transfer">[转账]</span>'
    
    case 'card':
      return '<span class="message-type-indicator">[名片]</span>'
    
    default:
      return formatMessageText(message.content || message.text || '未知消息')
  }
}

/**
 * 主要的消息格式化函数
 * 支持字符串和消息对象两种输入
 */
export function formatLastMessage(lastMessage: any): string {
  if (!lastMessage) {
    return '<span class="no-message">暂无消息</span>'
  }

  // 如果是字符串，直接处理
  if (typeof lastMessage === 'string') {
    return formatMessageText(lastMessage)
  }

  // 如果是消息对象
  if (typeof lastMessage === 'object') {
    return formatMessageObject(lastMessage)
  }

  return '<span class="no-message">暂无消息</span>'
}

/**
 * 获取消息类型的图标
 */
export function getMessageTypeIcon(messageType: string): string {
  const iconMap: Record<string, string> = {
    'text': '',
    'image': '🖼️',
    'voice': '🎤',
    'video': '📹',
    'file': '📄',
    'location': '📍',
    'emoji': '😊',
    'sticker': '😊',
    'redpacket': '🧧',
    'transfer': '💰',
    'card': '👤'
  }
  
  return iconMap[messageType] || ''
}

/**
 * 检查消息是否包含敏感内容
 */
export function containsSensitiveContent(text: string): boolean {
  const sensitiveWords = ['转账', '红包', '密码', '验证码', '银行卡']
  return sensitiveWords.some(word => text.includes(word))
}

/**
 * 清理HTML标签，用于纯文本显示
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * 获取消息的纯文本内容（用于搜索等功能）
 */
export function getPlainTextContent(lastMessage: any): string {
  const formatted = formatLastMessage(lastMessage)
  return stripHtmlTags(formatted)
}

/**
 * 消息内容预览（用于通知等场景）
 */
export function getMessagePreview(lastMessage: any, maxLength: number = 50): string {
  const plainText = getPlainTextContent(lastMessage)
  if (plainText.length <= maxLength) {
    return plainText
  }
  return plainText.substring(0, maxLength) + '...'
}

// 导出默认格式化函数
export default formatLastMessage

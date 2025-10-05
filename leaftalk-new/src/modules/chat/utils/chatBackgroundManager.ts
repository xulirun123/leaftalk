/**
 * 聊天背景管理工具
 * 简单、可靠、易维护
 */

const STORAGE_KEY = 'yeyu_chat_backgrounds'

// 预设背景
export const PRESET_BACKGROUNDS: Record<string, string> = {
  'blue-light': 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
  'green-light': 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
  'pink-light': 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
  'purple-light': 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
  'orange-light': 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
  'yellow-light': 'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)',
  'cyan-light': 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
  'gray-light': 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)'
}

/**
 * 获取聊天背景
 */
export function getChatBackground(chatId: string): string | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const backgrounds = JSON.parse(data)
    return backgrounds[chatId] || null
  } catch (error) {
    console.error('❌ 获取聊天背景失败:', error)
    return null
  }
}

/**
 * 保存聊天背景
 */
export function saveChatBackground(chatId: string, background: string): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const backgrounds = data ? JSON.parse(data) : {}
    backgrounds[chatId] = background
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backgrounds))
    console.log('✅ 聊天背景已保存:', chatId, background.substring(0, 50))
  } catch (error) {
    console.error('❌ 保存聊天背景失败:', error)
  }
}

/**
 * 删除聊天背景
 */
export function deleteChatBackground(chatId: string): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return
    const backgrounds = JSON.parse(data)
    delete backgrounds[chatId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backgrounds))
    console.log('✅ 聊天背景已删除:', chatId)
  } catch (error) {
    console.error('❌ 删除聊天背景失败:', error)
  }
}

/**
 * 应用背景到 DOM 元素
 */
export function applyBackgroundToElement(element: HTMLElement, background: string | null): void {
  if (!element) {
    console.warn('⚠️ 元素不存在，无法应用背景')
    return
  }

  if (!background || background === 'default') {
    // 默认背景
    element.style.setProperty('background', '#EDEDED', 'important')
    console.log('📸 已应用默认背景')
    return
  }

  if (background.startsWith('custom:')) {
    // 自定义图片背景
    const imageData = background.replace('custom:', '')
    element.style.setProperty('background', `url(${imageData}) center/cover no-repeat`, 'important')
    console.log('📸 已应用自定义背景')
    return
  }

  // 预设背景
  const bgValue = PRESET_BACKGROUNDS[background]
  if (bgValue) {
    element.style.setProperty('background', bgValue, 'important')
    console.log('📸 已应用预设背景:', background)
  } else {
    // 未知背景，使用默认
    element.style.setProperty('background', '#EDEDED', 'important')
    console.log('⚠️ 未知背景类型，使用默认背景')
  }
}

/**
 * 加载并应用聊天背景
 */
export function loadAndApplyChatBackground(chatId: string): void {
  console.log('🎨 加载聊天背景:', chatId)
  
  // 获取背景设置
  const background = getChatBackground(chatId)
  console.log('📦 背景设置:', background ? background.substring(0, 50) + '...' : '无')
  
  // 查找消息容器
  const container = document.querySelector('.chat-messages') as HTMLElement
  if (!container) {
    console.warn('⚠️ 消息容器未找到，稍后重试')
    // 延迟重试
    setTimeout(() => {
      const retryContainer = document.querySelector('.chat-messages') as HTMLElement
      if (retryContainer) {
        applyBackgroundToElement(retryContainer, background)
      }
    }, 100)
    return
  }
  
  // 应用背景
  applyBackgroundToElement(container, background)
}

/**
 * 获取当前聊天ID（从 localStorage）
 */
export function getCurrentChatId(): string {
  return localStorage.getItem('yeyu_last_chat_id') || 'default'
}


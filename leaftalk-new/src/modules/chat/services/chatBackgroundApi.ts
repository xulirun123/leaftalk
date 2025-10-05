/**
 * 聊天背景 API 服务
 * 提供聊天背景设置的同步功能
 */

import apiClient from '../../../shared/services/apiClient'

export interface ChatBackgrounds {
  [chatId: string]: string
}

/**
 * 获取所有聊天背景设置
 */
export async function getChatBackgrounds(): Promise<ChatBackgrounds> {
  try {
    const response = await apiClient.get('/chat-backgrounds')
    console.log('📦 API响应:', response)

    // apiClient 返回的格式是 { success, data, message }
    if (response.success) {
      return response.data || {}
    }
    throw new Error(response.message || '获取聊天背景失败')
  } catch (error: any) {
    console.error('❌ 获取聊天背景失败:', error)
    throw error
  }
}

/**
 * 保存单个聊天的背景设置
 */
export async function saveChatBackground(chatId: string, background: string): Promise<void> {
  try {
    const response = await apiClient.post(`/chat-backgrounds/${chatId}`, {
      background
    })

    // apiClient 返回的格式是 { success, data, message }
    if (!response.success) {
      throw new Error(response.message || '保存聊天背景失败')
    }
  } catch (error: any) {
    console.error('❌ 保存聊天背景失败:', error)
    throw error
  }
}

/**
 * 删除单个聊天的背景设置
 */
export async function deleteChatBackground(chatId: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/chat-backgrounds/${chatId}`)

    // apiClient 返回的格式是 { success, data, message }
    if (!response.success) {
      throw new Error(response.message || '删除聊天背景失败')
    }
  } catch (error: any) {
    console.error('❌ 删除聊天背景失败:', error)
    throw error
  }
}

/**
 * 从服务器同步聊天背景到本地
 */
export async function syncChatBackgroundsFromServer(): Promise<void> {
  try {
    const backgrounds = await getChatBackgrounds()
    const storageKey = 'yeyu_chat_backgrounds'
    localStorage.setItem(storageKey, JSON.stringify(backgrounds))
    console.log('✅ 聊天背景已从服务器同步到本地:', Object.keys(backgrounds).length)
  } catch (error) {
    console.error('❌ 同步聊天背景失败:', error)
    throw error
  }
}

/**
 * 从本地同步聊天背景到服务器
 */
export async function syncChatBackgroundsToServer(): Promise<void> {
  try {
    const storageKey = 'yeyu_chat_backgrounds'
    const localData = localStorage.getItem(storageKey)
    if (!localData) {
      console.log('⚠️ 本地无聊天背景数据，跳过同步')
      return
    }

    const backgrounds: ChatBackgrounds = JSON.parse(localData)
    
    // 逐个保存到服务器
    for (const [chatId, background] of Object.entries(backgrounds)) {
      await saveChatBackground(chatId, background)
    }

    console.log('✅ 聊天背景已从本地同步到服务器:', Object.keys(backgrounds).length)
  } catch (error) {
    console.error('❌ 同步聊天背景到服务器失败:', error)
    throw error
  }
}


/**
 * 事件总线 - 用于组件间通信
 */

type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  // 监听事件
  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  // 移除事件监听
  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 触发事件
  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  // 清除所有事件
  clear() {
    this.events.clear()
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 定义事件类型
export const EVENTS = {
  // 联系人相关事件
  CONTACT_ADDED: 'contact:added',           // 添加好友成功
  CONTACT_REMOVED: 'contact:removed',       // 删除好友
  CONTACT_UPDATED: 'contact:updated',       // 好友信息更新
  CONTACTS_REFRESH: 'contacts:refresh',     // 刷新联系人列表
  
  // 聊天相关事件
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',  // 收到新消息
  CHAT_LIST_REFRESH: 'chat:list:refresh',          // 刷新聊天列表
  
  // 用户相关事件
  USER_STATUS_CHANGED: 'user:status:changed',     // 用户状态变化
  USER_PROFILE_UPDATED: 'user:profile:updated',   // 用户资料更新
} as const

export type EventType = typeof EVENTS[keyof typeof EVENTS]

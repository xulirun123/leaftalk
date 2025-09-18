import { ref } from 'vue'

// 事件类型定义
export const EVENTS = {
  CONTACT_UPDATED: 'contact:updated',
  CONTACT_ADDED: 'contact:added',
  CONTACT_REMOVED: 'contact:removed',
  FRIEND_REQUEST_RECEIVED: 'friend:request:received',
  FRIEND_REQUEST_ACCEPTED: 'friend:request:accepted',
  FRIEND_REQUEST_REJECTED: 'friend:request:rejected',
  USER_STATUS_CHANGED: 'user:status:changed',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received'
} as const

type EventType = typeof EVENTS[keyof typeof EVENTS]

interface EventListener {
  id: string
  callback: (data?: any) => void
}

class EventBus {
  private listeners: Map<EventType, EventListener[]> = new Map()
  private nextId = 0

  /**
   * 监听事件
   */
  on(event: EventType, callback: (data?: any) => void): string {
    const id = `listener_${this.nextId++}`
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    
    this.listeners.get(event)!.push({ id, callback })
    
    return id
  }

  /**
   * 取消监听
   */
  off(event: EventType, listenerId?: string): void {
    if (!this.listeners.has(event)) return
    
    if (listenerId) {
      const listeners = this.listeners.get(event)!
      const index = listeners.findIndex(l => l.id === listenerId)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }
  }

  /**
   * 触发事件
   */
  emit(event: EventType, data?: any): void {
    if (!this.listeners.has(event)) return
    
    const listeners = this.listeners.get(event)!
    listeners.forEach(listener => {
      try {
        listener.callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * 一次性监听
   */
  once(event: EventType, callback: (data?: any) => void): string {
    const listenerId = this.on(event, (data) => {
      callback(data)
      this.off(event, listenerId)
    })
    
    return listenerId
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear()
  }

  /**
   * 获取事件监听器数量
   */
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.length || 0
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 导出类型
export type { EventType }

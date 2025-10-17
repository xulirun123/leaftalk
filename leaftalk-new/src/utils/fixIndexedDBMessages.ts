/**
 * 修复 IndexedDB 中的消息类型
 * 将内容包含 group_invite 但类型是 text 的消息修复为 group_invite
 */

import { openDB } from 'idb'

export async function fixIndexedDBMessages() {
  try {
    console.log('🔧 开始修复 IndexedDB 中的消息类型...')

    // 打开数据库
    const db = await openDB('leaftalk-chat-db', 1)

    // 获取所有消息
    const tx = db.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')
    const allMessages = await store.getAll()

    console.log(`📊 总共有 ${allMessages.length} 条消息`)

    // 找出需要修复的消息
    const needFix = allMessages.filter(msg => {
      if (msg.type !== 'text') return false
      if (!msg.content || typeof msg.content !== 'string') return false
      return msg.content.includes('group_invite')
    })

    console.log(`🔍 找到 ${needFix.length} 条需要修复的消息`)

    if (needFix.length === 0) {
      console.log('✅ 没有需要修复的消息')
      return { success: true, fixed: 0 }
    }

    // 修复消息类型
    let fixed = 0
    for (const msg of needFix) {
      console.log(`🔧 修复消息: ${msg.id}`)
      msg.type = 'group_invite'
      await store.put(msg)
      fixed++
    }

    await tx.done

    console.log(`✅ 成功修复 ${fixed} 条消息`)

    return { success: true, fixed }
  } catch (error) {
    console.error('❌ 修复失败:', error)
    return { success: false, error }
  }
}

// 导出到全局，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).fixIndexedDBMessages = fixIndexedDBMessages
}


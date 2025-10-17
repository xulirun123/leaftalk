import { openDB } from 'idb'

export async function clearRedpacketMessages() {
  try {
    console.log('🔧 开始清除 IndexedDB 中的红包消息...')

    // 打开数据库
    const db = await openDB('leaftalk-chat-db', 1)

    // 获取所有消息
    const tx = db.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')
    const allMessages = await store.getAll()

    console.log(`📊 总共有 ${allMessages.length} 条消息`)

    // 找出红包消息
    const redpacketMessages = allMessages.filter(msg => {
      if (!msg.content || typeof msg.content !== 'string') return false
      return msg.content.includes('blessing') || msg.content.includes('redpacket')
    })

    console.log(`🔍 找到 ${redpacketMessages.length} 条红包消息`)

    if (redpacketMessages.length === 0) {
      console.log('✅ 没有需要清除的红包消息')
      return { success: true, deleted: 0 }
    }

    // 删除红包消息
    const tx2 = db.transaction('messages', 'readwrite')
    const store2 = tx2.objectStore('messages')
    
    for (const msg of redpacketMessages) {
      await store2.delete(msg.id)
      console.log(`🗑️ 已删除红包消息: ${msg.id}`)
    }

    await tx2.done

    console.log(`✅ 成功清除 ${redpacketMessages.length} 条红包消息`)
    return { success: true, deleted: redpacketMessages.length }

  } catch (error) {
    console.error('❌ 清除红包消息失败:', error)
    return { success: false, error }
  }
}

// 在浏览器控制台中调用：
// import { clearRedpacketMessages } from '@/utils/clearRedpacketMessages'
// clearRedpacketMessages()


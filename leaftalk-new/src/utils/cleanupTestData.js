// 清理测试数据工具
export class TestDataCleaner {
  
  // 清理本地存储的所有测试数据
  static async clearAllLocalData() {
    try {
      console.log('🧹 开始清理本地测试数据...')
      
      // 1. 清理 localStorage
      const localStorageKeys = Object.keys(localStorage)
      localStorageKeys.forEach(key => {
        const value = localStorage.getItem(key) || ''
        if (key.includes('test') || key.includes('mock') || key.includes('demo') ||
            key.includes('contacts') || key.includes('friends') ||
            value.includes('张三') || value.includes('李四') || value.includes('王五') ||
            value.includes('zhangsan') || value.includes('lisi') || value.includes('wangwu')) {
          localStorage.removeItem(key)
          console.log(`✅ 清理 localStorage: ${key}`)
        }
      })
      
      // 2. 清理 sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage)
      sessionStorageKeys.forEach(key => {
        if (key.includes('test') || key.includes('mock') || key.includes('demo')) {
          sessionStorage.removeItem(key)
          console.log(`✅ 清理 sessionStorage: ${key}`)
        }
      })
      
      // 3. 清理 IndexedDB 中的测试数据
      await this.clearIndexedDBTestData()
      
      console.log('🎉 本地测试数据清理完成！')
      
      // 4. 刷新页面以重新加载真实数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('❌ 清理本地数据时出错:', error)
    }
  }
  
  // 清理 IndexedDB 中的测试数据
  static async clearIndexedDBTestData() {
    try {
      // 获取所有数据库
      const databases = await indexedDB.databases()
      
      for (const dbInfo of databases) {
        if (dbInfo.name && (
          dbInfo.name.includes('test') || 
          dbInfo.name.includes('mock') || 
          dbInfo.name.includes('demo')
        )) {
          await this.deleteDatabase(dbInfo.name)
          console.log(`✅ 清理 IndexedDB: ${dbInfo.name}`)
        }
      }
      
      // 清理消息持久化数据库中的测试数据
      await this.clearMessageTestData()
      
    } catch (error) {
      console.error('❌ 清理 IndexedDB 时出错:', error)
    }
  }
  
  // 删除指定的数据库
  static deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(dbName)
      deleteReq.onsuccess = () => resolve()
      deleteReq.onerror = () => reject(deleteReq.error)
    })
  }
  
  // 清理消息数据库中的测试数据
  static async clearMessageTestData() {
    try {
      const dbName = 'YeYuMessagesDB'
      const request = indexedDB.open(dbName, 1)
      
      request.onsuccess = (event) => {
        const db = event.target.result
        
        if (db.objectStoreNames.contains('messages')) {
          const transaction = db.transaction(['messages'], 'readwrite')
          const store = transaction.objectStore('messages')
          
          // 获取所有消息
          const getAllRequest = store.getAll()
          
          getAllRequest.onsuccess = () => {
            const messages = getAllRequest.result
            
            // 删除包含测试关键词的消息
            messages.forEach(message => {
              if (this.isTestMessage(message)) {
                store.delete(message.id)
                console.log(`✅ 清理测试消息: ${message.id}`)
              }
            })
          }
        }
        
        db.close()
      }
      
    } catch (error) {
      console.error('❌ 清理消息测试数据时出错:', error)
    }
  }
  
  // 判断是否为测试消息
  static isTestMessage(message) {
    const testKeywords = ['测试', 'test', 'mock', 'demo', '假数据', '示例']
    const content = (message.content || '').toLowerCase()
    const senderName = (message.senderName || '').toLowerCase()
    
    return testKeywords.some(keyword => 
      content.includes(keyword) || senderName.includes(keyword)
    )
  }
  
  // 重置联系人数据到真实状态
  static async resetContactsToReal() {
    try {
      console.log('🔄 重置联系人数据...')
      
      // 清理联系人相关的本地存储
      localStorage.removeItem('contacts')
      localStorage.removeItem('friendRequests')
      localStorage.removeItem('chatList')
      
      // 清理 Pinia store 中的数据
      if (window.pinia) {
        const contactStore = window.pinia._s.get('contact')
        const chatStore = window.pinia._s.get('chat')
        
        if (contactStore) {
          contactStore.$reset()
        }
        
        if (chatStore) {
          chatStore.$reset()
        }
      }
      
      console.log('✅ 联系人数据重置完成')
      
    } catch (error) {
      console.error('❌ 重置联系人数据时出错:', error)
    }
  }
  
  // 一键清理所有测试数据
  static async cleanupAll() {
    console.log('🚀 开始一键清理所有测试数据...')

    // 1. 清理本地数据
    await this.clearAllLocalData()
    await this.resetContactsToReal()

    // 2. 清理服务器端可能缓存的测试数据
    await this.clearServerTestData()

    console.log('🎉 所有测试数据清理完成！页面将在3秒后刷新...')

    setTimeout(() => {
      window.location.reload()
    }, 3000)
  }

  // 清理服务器端测试数据
  static async clearServerTestData() {
    try {
      console.log('🧹 清理服务器端测试数据...')

      // 获取当前用户token
      const token = localStorage.getItem('yeyu_token')
      if (!token) {
        console.log('⚠️ 未找到用户token，跳过服务器清理')
        return
      }

      // 调用API清理接口（如果存在）
      const response = await fetch('http://localhost:8893/api/dev/cleanup-test-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('✅ 服务器端测试数据清理成功')
      } else {
        console.log('⚠️ 服务器端清理接口不存在或失败')
      }

    } catch (error) {
      console.log('⚠️ 服务器端清理失败:', error.message)
    }
  }
}

// 调试工具：检查当前数据来源
window.debugContacts = () => {
  console.log('🔍 调试联系人数据来源...')

  // 1. 检查localStorage
  const localContacts = localStorage.getItem('contacts_list')
  console.log('📱 localStorage中的联系人:', localContacts ? JSON.parse(localContacts) : '无')

  // 2. 检查sessionStorage
  const sessionContacts = sessionStorage.getItem('contacts')
  console.log('📱 sessionStorage中的联系人:', sessionContacts ? JSON.parse(sessionContacts) : '无')

  // 3. 检查Pinia store
  if (window.pinia) {
    const contactStore = window.pinia._s.get('contact')
    if (contactStore) {
      console.log('📱 contactStore中的联系人:', contactStore.contacts)
    }
  }

  // 4. 检查API响应
  fetch('http://localhost:8893/api/contacts', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('yeyu_token')}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('📱 API返回的联系人:', data)

    // 如果发现测试用户，提供删除建议
    if (data.success && data.data && Array.isArray(data.data)) {
      const testUsers = data.data.filter(user =>
        ['张三', '李四', '王五', '测试用户', '王大力', '刘美丽', '陈小华'].includes(user.nickname) ||
        ['zhangsan', 'lisi', 'wangwu', 'user001', 'user002', 'user003'].includes(user.username)
      )

      if (testUsers.length > 0) {
        console.log('🚨 发现测试用户:', testUsers)
        console.log('💡 运行 window.deleteTestUsers() 来删除这些测试用户')

        // 提供删除测试用户的函数
        window.deleteTestUsers = async () => {
          console.log('🗑️ 开始删除测试用户...')

          for (const user of testUsers) {
            try {
              const response = await fetch(`http://localhost:8893/api/admin/delete-user/${user.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('yeyu_token')}`,
                  'Content-Type': 'application/json'
                }
              })

              if (response.ok) {
                console.log(`✅ 删除测试用户成功: ${user.nickname} (ID: ${user.id})`)
              } else {
                console.log(`❌ 删除测试用户失败: ${user.nickname} (ID: ${user.id})`)
              }
            } catch (error) {
              console.log(`❌ 删除测试用户出错: ${user.nickname}`, error)
            }
          }

          console.log('🎉 测试用户删除完成，刷新页面...')
          setTimeout(() => location.reload(), 1000)
        }
      }
    }
  })
  .catch(err => {
    console.log('📱 API调用失败:', err)
  })
}

// 在控制台中提供快捷方法
if (typeof window !== 'undefined') {
  window.cleanupTestData = TestDataCleaner.cleanupAll.bind(TestDataCleaner)
  window.clearLocalData = TestDataCleaner.clearAllLocalData.bind(TestDataCleaner)
  window.resetContacts = TestDataCleaner.resetContactsToReal.bind(TestDataCleaner)
}

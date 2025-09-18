// 通过API清理测试数据
const axios = require('axios')

const API_BASE = 'http://localhost:8893/api'

async function cleanupTestData() {
  try {
    console.log('🔍 获取当前用户列表...')
    
    // 这里我们需要先登录获取token，或者直接操作数据库
    // 由于API需要认证，我们创建一个简单的清理方案
    
    console.log('📝 手动清理方案:')
    console.log('1. 打开浏览器开发者工具')
    console.log('2. 在控制台执行以下代码来清理测试数据:')
    console.log('')
    console.log('// 清理本地存储的测试数据')
    console.log('localStorage.clear();')
    console.log('sessionStorage.clear();')
    console.log('')
    console.log('// 清理IndexedDB中的测试数据')
    console.log(`
const clearIndexedDB = async () => {
  const dbs = await indexedDB.databases();
  await Promise.all(
    dbs.map(db => {
      return new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(db.name);
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => reject(deleteReq.error);
      });
    })
  );
  console.log('✅ IndexedDB清理完成');
  location.reload();
};
clearIndexedDB();
`)
    
    console.log('')
    console.log('🔧 或者，我可以帮你创建一个数据库清理脚本')
    console.log('请告诉我你想保留哪些用户ID (例如: 1,2,6)')
    
  } catch (error) {
    console.error('❌ 错误:', error.message)
  }
}

cleanupTestData()

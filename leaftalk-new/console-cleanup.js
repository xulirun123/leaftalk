// 在浏览器控制台中运行此脚本来清理无效消息
// 复制以下代码到控制台并按回车执行

console.log('🧹 开始彻底清理无效消息...');

// 1. 清理localStorage
console.log('🗑️ 清理localStorage...');
const localKeys = Object.keys(localStorage);
let localClearedCount = 0;

localKeys.forEach(key => {
  if (key.startsWith('chat_messages_') || 
      key.startsWith('chat_sessions_') ||
      key.startsWith('leaftalk_') ||
      key.includes('message') ||
      key.includes('chat')) {
    localStorage.removeItem(key);
    console.log(`🗑️ 删除localStorage: ${key}`);
    localClearedCount++;
  }
});

// 2. 清理sessionStorage
console.log('🗑️ 清理sessionStorage...');
const sessionKeys = Object.keys(sessionStorage);
let sessionClearedCount = 0;

sessionKeys.forEach(key => {
  if (key.startsWith('chat_') || 
      key.startsWith('leaftalk_') ||
      key.includes('message')) {
    sessionStorage.removeItem(key);
    console.log(`🗑️ 删除sessionStorage: ${key}`);
    sessionClearedCount++;
  }
});

// 3. 删除IndexedDB数据库
console.log('🗑️ 删除IndexedDB数据库...');
const deleteDB = indexedDB.deleteDatabase('leaftalk-messages');

deleteDB.onsuccess = function() {
  console.log('✅ IndexedDB数据库已删除');
};

deleteDB.onerror = function() {
  console.warn('⚠️ IndexedDB数据库删除失败');
};

deleteDB.onblocked = function() {
  console.warn('⚠️ IndexedDB数据库删除被阻止');
};

// 4. 清理可能的其他IndexedDB
const otherDBs = ['leaftalk', 'chat-messages', 'messages'];
otherDBs.forEach(dbName => {
  const deleteReq = indexedDB.deleteDatabase(dbName);
  deleteReq.onsuccess = () => console.log(`✅ 删除数据库: ${dbName}`);
  deleteReq.onerror = () => console.log(`⚠️ 数据库不存在或删除失败: ${dbName}`);
});

console.log(`✅ 清理完成！`);
console.log(`📊 localStorage清理: ${localClearedCount} 项`);
console.log(`📊 sessionStorage清理: ${sessionClearedCount} 项`);
console.log('🔄 请刷新页面查看效果');

// 5. 自动刷新页面
setTimeout(() => {
  console.log('🔄 自动刷新页面...');
  window.location.reload();
}, 2000);

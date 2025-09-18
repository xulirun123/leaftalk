// 立即清理脚本 - 在浏览器控制台中运行
// 复制此代码到浏览器控制台并按回车执行

(async function immediateCleanup() {
    console.log('🧹 开始立即清理无效消息...');
    
    try {
        // 打开IndexedDB
        const dbRequest = indexedDB.open('leaftalk-messages', 1);
        
        dbRequest.onsuccess = async function(event) {
            const db = event.target.result;
            console.log('✅ 数据库连接成功');
            
            try {
                // 获取所有消息
                const transaction = db.transaction(['messages'], 'readwrite');
                const store = transaction.objectStore('messages');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = function() {
                    const messages = getAllRequest.result;
                    console.log(`📊 总消息数: ${messages.length}`);
                    
                    let cleanedCount = 0;
                    const deletePromises = [];
                    
                    messages.forEach(msg => {
                        let shouldDelete = false;
                        let reason = '';
                        
                        // 检查blob URL
                        if (typeof msg.content === 'string' && msg.content.startsWith('blob:')) {
                            shouldDelete = true;
                            reason = 'blob URL';
                        }
                        
                        // 检查特定的404文件
                        if (typeof msg.content === 'string' && (
                            msg.content.includes('1757725383688_0472ba8497ee7326.mp4') ||
                            msg.content.includes('1757766900761_2d0cea9d08600f05.mp4') ||
                            msg.content.includes('5fa65094-0e93-46fa-962b-c9f8c91bce29')
                        )) {
                            shouldDelete = true;
                            reason = '404文件';
                        }
                        
                        // 检查所有上传文件的消息（可能的404）
                        if (typeof msg.content === 'string' && 
                            (msg.content.includes('localhost:8893/uploads/chat/') || 
                             msg.content.startsWith('http://localhost:8893/uploads/chat/')) &&
                            (msg.type === 'image' || msg.type === 'video')) {
                            shouldDelete = true;
                            reason = '可能的404上传文件';
                        }
                        
                        if (shouldDelete) {
                            cleanedCount++;
                            console.log(`🗑️ 删除消息 ${msg.id} (${reason}): ${msg.content.substring(0, 50)}...`);
                            
                            const deleteRequest = store.delete(msg.id);
                            deletePromises.push(new Promise((resolve, reject) => {
                                deleteRequest.onsuccess = () => resolve();
                                deleteRequest.onerror = () => reject(deleteRequest.error);
                            }));
                        }
                    });
                    
                    Promise.all(deletePromises).then(() => {
                        console.log(`✅ 清理完成！共删除 ${cleanedCount} 条无效消息`);
                        
                        // 清理localStorage中的缓存
                        try {
                            const keys = Object.keys(localStorage);
                            keys.forEach(key => {
                                if (key.startsWith('chat_messages_') || key.startsWith('chat_sessions_')) {
                                    localStorage.removeItem(key);
                                    console.log(`🗑️ 清理localStorage: ${key}`);
                                }
                            });
                            console.log('✅ localStorage缓存已清理');
                        } catch (e) {
                            console.warn('⚠️ localStorage清理失败:', e);
                        }
                        
                        // 提示用户刷新页面
                        console.log('🔄 请刷新页面以查看清理效果');
                        alert('清理完成！共删除 ' + cleanedCount + ' 条无效消息。请刷新页面查看效果。');
                        
                    }).catch(error => {
                        console.error('❌ 删除消息失败:', error);
                    });
                };
                
                getAllRequest.onerror = function() {
                    console.error('❌ 获取消息失败:', getAllRequest.error);
                };
                
            } catch (error) {
                console.error('❌ 清理过程出错:', error);
            }
        };
        
        dbRequest.onerror = function() {
            console.error('❌ 数据库连接失败:', dbRequest.error);
        };
        
        dbRequest.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('messages')) {
                const store = db.createObjectStore('messages', { keyPath: 'id' });
                store.createIndex('by-session', 'sessionId', { unique: false });
                console.log('📦 数据库结构已创建');
            }
        };
        
    } catch (error) {
        console.error('❌ 清理脚本执行失败:', error);
    }
})();

// 使用说明：
// 1. 打开浏览器开发者工具 (F12)
// 2. 切换到 Console 标签
// 3. 复制上面的整个代码
// 4. 粘贴到控制台并按回车执行
// 5. 等待清理完成后刷新页面

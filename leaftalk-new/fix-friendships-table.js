const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    charset: 'utf8mb4'
};

async function fixFriendshipsTable() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');
        
        // 创建 friendships 表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`friendships\` (
                \`id\` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
                \`user_id\` bigint unsigned NOT NULL COMMENT '用户ID',
                \`friend_id\` bigint unsigned NOT NULL COMMENT '好友ID',
                \`status\` enum('pending','accepted','blocked') DEFAULT 'pending' COMMENT '关系状态',
                \`remark\` varchar(100) DEFAULT NULL COMMENT '备注名',
                \`tags\` json DEFAULT NULL COMMENT '标签',
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`user_friend\` (\`user_id\`,\`friend_id\`),
                KEY \`user_id\` (\`user_id\`),
                KEY \`friend_id\` (\`friend_id\`),
                KEY \`status\` (\`status\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表'
        `);
        console.log('✅ friendships 表创建成功');
        
        // 从 friend_requests 表中迁移已接受的好友关系到 friendships 表
        const [acceptedRequests] = await connection.execute(`
            SELECT requester_id, requestee_id, created_at 
            FROM friend_requests 
            WHERE status = 'accepted'
        `);
        
        console.log(`📊 找到 ${acceptedRequests.length} 个已接受的好友请求`);
        
        for (const request of acceptedRequests) {
            // 插入双向好友关系
            try {
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', ?)
                `, [request.requester_id, request.requestee_id, request.created_at]);
                
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', ?)
                `, [request.requestee_id, request.requester_id, request.created_at]);
                
                console.log(`✅ 迁移好友关系: ${request.requester_id} <-> ${request.requestee_id}`);
            } catch (error) {
                console.log(`⚠️ 跳过重复关系: ${request.requester_id} <-> ${request.requestee_id}`);
            }
        }
        
        // 为当前用户(ID: 6)添加一些测试好友关系
        const testUserId = 6;
        const friendIds = [1, 2, 4]; // 与现有用户建立好友关系
        
        console.log(`📊 为用户 ${testUserId} 添加测试好友关系...`);
        
        for (const friendId of friendIds) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', NOW())
                `, [testUserId, friendId]);
                
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', NOW())
                `, [friendId, testUserId]);
                
                console.log(`✅ 添加好友关系: ${testUserId} <-> ${friendId}`);
            } catch (error) {
                console.log(`⚠️ 跳过重复关系: ${testUserId} <-> ${friendId}`);
            }
        }
        
        // 验证结果
        const [friendships] = await connection.execute(`
            SELECT f.*, u.nickname as friend_nickname
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = 'accepted'
        `, [testUserId]);
        
        console.log(`📊 用户 ${testUserId} 的好友关系:`);
        friendships.forEach(friendship => {
            console.log(`  好友: ${friendship.friend_nickname} (ID: ${friendship.friend_id})`);
        });
        
        await connection.end();
        console.log('✅ 数据库操作完成');
        
    } catch (error) {
        console.error('❌ 数据库错误:', error.message);
    }
}

fixFriendshipsTable();

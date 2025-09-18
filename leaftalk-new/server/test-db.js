const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    charset: 'utf8mb4'
};

async function analyzeDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');

        // 1. 检查所有表
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 数据库中的所有表:');
        tables.forEach(table => {
            console.log('  ' + Object.values(table)[0]);
        });

        // 2. 检查好友相关表的结构
        const friendTables = ['friend_requests', 'friendships'];

        for (const tableName of friendTables) {
            try {
                const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
                console.log(`\n📋 ${tableName} 表结构:`);
                columns.forEach(col => {
                    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
                });

                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`  记录数: ${count[0].count}`);

                if (count[0].count > 0) {
                    const [sample] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
                    console.log('  示例数据:');
                    sample.forEach(row => {
                        console.log('    ' + JSON.stringify(row));
                    });
                }
            } catch (error) {
                console.log(`\n⚠️ ${tableName} 表不存在或查询失败: ${error.message}`);
            }
        }

        // 3. 检查用户表
        try {
            const [users] = await connection.execute('SELECT id, yeyu_id, nickname FROM users LIMIT 10');
            console.log('\n👥 用户列表:');
            if (users.length === 0) {
                console.log('  ⚠️ 用户表为空');

                // 检查用户表结构
                const [userColumns] = await connection.execute('DESCRIBE users');
                console.log('  用户表结构:');
                userColumns.forEach(col => {
                    console.log(`    ${col.Field}: ${col.Type}`);
                });
            } else {
                users.forEach(user => {
                    console.log(`  ID: ${user.id}, 叶语号: ${user.yeyu_id}, 昵称: ${user.nickname}`);
                });
            }
        } catch (error) {
            console.log('\n❌ 用户表查询失败:', error.message);
        }

        // 4. 检查服务器API中的联系人查询逻辑
        console.log('\n🔍 模拟联系人API查询 (用户ID: 6):');
        const currentUserId = 6;

        // 模拟服务器中的查询逻辑
        try {
            const [dbContacts] = await connection.execute(`
                SELECT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
                       f.created_at as friend_since, f.remark
                FROM friendships f
                JOIN users u ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
                WHERE f.status = 'accepted' AND u.id != ?
                ORDER BY f.created_at DESC
            `, [currentUserId, currentUserId, currentUserId]);

            console.log(`  通过friendships表查询到联系人: ${dbContacts.length} 个`);
            dbContacts.forEach(contact => {
                console.log(`    ${contact.nickname} (ID: ${contact.id})`);
            });
        } catch (error) {
            console.log(`  friendships表查询失败: ${error.message}`);

            // 回退到friend_requests表
            try {
                const [dbContacts] = await connection.execute(`
                    SELECT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
                           f.created_at as friend_since, NULL as remark_name
                    FROM friend_requests f
                    JOIN users u ON (f.requester_id = ? AND f.requestee_id = u.id) OR (f.requestee_id = ? AND f.requester_id = u.id)
                    WHERE f.status = 'accepted' AND u.id != ?
                    ORDER BY f.created_at DESC
                `, [currentUserId, currentUserId, currentUserId]);

                console.log(`  通过friend_requests表查询到联系人: ${dbContacts.length} 个`);
                dbContacts.forEach(contact => {
                    console.log(`    ${contact.nickname} (ID: ${contact.id})`);
                });
            } catch (error2) {
                console.log(`  friend_requests表查询也失败: ${error2.message}`);
            }
        }

        await connection.end();
    } catch (error) {
        console.error('❌ 分析失败:', error.message);
    }
}

analyzeDatabase();

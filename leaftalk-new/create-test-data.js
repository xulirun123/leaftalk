const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    charset: 'utf8mb4'
};

async function createTestData() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');
        
        // 创建测试用户
        const testUsers = [
            {
                id: 1,
                yeyu_id: 'YYD03YIHRY',
                username: 'yangda',
                nickname: '阳静达',
                phone: '17872886600',
                password: 'password123'
            },
            {
                id: 2,
                yeyu_id: 'YYFSRATEHB',
                username: 'haiqing',
                nickname: '兴海清',
                phone: '17872886622',
                password: 'password123'
            },
            {
                id: 4,
                yeyu_id: 'test001',
                username: 'testuser',
                nickname: '测试用户',
                phone: '13800138000',
                password: 'password123'
            },
            {
                id: 6,
                yeyu_id: 'YY0000006',
                username: 'currentuser',
                nickname: '当前用户',
                phone: '13800138006',
                password: 'password123'
            },
            {
                id: 9,
                yeyu_id: 'YY17872886620',
                username: 'testuser2',
                nickname: '测试用户2',
                phone: '17872886620',
                password: 'password123'
            },
            {
                id: 11,
                yeyu_id: 'YY0000002',
                username: 'testuser3',
                nickname: '测试用户3',
                phone: '13800138001',
                password: 'password123'
            }
        ];
        
        console.log('👥 创建测试用户...');
        
        for (const user of testUsers) {
            try {
                // 加密密码
                const hashedPassword = await bcrypt.hash(user.password, 10);
                
                await connection.execute(`
                    INSERT INTO users (id, yeyu_id, username, nickname, phone, password, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
                    ON DUPLICATE KEY UPDATE
                    nickname = VALUES(nickname),
                    phone = VALUES(phone),
                    password = VALUES(password),
                    updated_at = NOW()
                `, [user.id, user.yeyu_id, user.username, user.nickname, user.phone, hashedPassword]);
                
                console.log(`✅ 创建用户: ${user.nickname} (ID: ${user.id})`);
            } catch (error) {
                console.log(`⚠️ 用户创建失败 ${user.nickname}: ${error.message}`);
            }
        }
        
        // 创建好友关系
        console.log('\n👫 创建好友关系...');
        
        const friendships = [
            { user_id: 6, friend_id: 1 }, // 当前用户 <-> 阳静达
            { user_id: 6, friend_id: 2 }, // 当前用户 <-> 兴海清
            { user_id: 6, friend_id: 4 }, // 当前用户 <-> 测试用户
            { user_id: 1, friend_id: 2 }, // 阳静达 <-> 兴海清
            { user_id: 2, friend_id: 4 }, // 兴海清 <-> 测试用户
        ];
        
        for (const friendship of friendships) {
            try {
                // 插入双向好友关系
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', NOW())
                `, [friendship.user_id, friendship.friend_id]);
                
                await connection.execute(`
                    INSERT IGNORE INTO friendships (user_id, friend_id, status, created_at)
                    VALUES (?, ?, 'accepted', NOW())
                `, [friendship.friend_id, friendship.user_id]);
                
                console.log(`✅ 创建好友关系: ${friendship.user_id} <-> ${friendship.friend_id}`);
            } catch (error) {
                console.log(`⚠️ 好友关系创建失败: ${error.message}`);
            }
        }
        
        // 验证结果
        console.log('\n📊 验证结果:');
        
        const [users] = await connection.execute('SELECT id, yeyu_id, nickname FROM users');
        console.log(`用户总数: ${users.length}`);
        users.forEach(user => {
            console.log(`  ${user.nickname} (ID: ${user.id}, 叶语号: ${user.yeyu_id})`);
        });
        
        const [friendshipsCount] = await connection.execute('SELECT COUNT(*) as count FROM friendships WHERE status = "accepted"');
        console.log(`\n好友关系总数: ${friendshipsCount[0].count}`);
        
        // 测试当前用户的好友列表
        const [currentUserFriends] = await connection.execute(`
            SELECT u.id, u.nickname
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = 6 AND f.status = 'accepted'
        `);
        
        console.log(`\n当前用户(ID: 6)的好友列表:`);
        currentUserFriends.forEach(friend => {
            console.log(`  ${friend.nickname} (ID: ${friend.id})`);
        });
        
        await connection.end();
        console.log('\n✅ 测试数据创建完成');
        
    } catch (error) {
        console.error('❌ 创建测试数据失败:', error.message);
    }
}

createTestData();

const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
    console.log('🔍 测试数据库连接...');
    
    try {
        // 使用与服务器相同的配置
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'leaftalk-new',
            charset: 'utf8mb4'
        });
        
        console.log('✅ 数据库连接成功');
        
        // 测试用户表查询
        const [users] = await connection.execute('SELECT id, yeyu_id, nickname FROM users LIMIT 3');
        console.log(`📊 用户表查询成功，找到 ${users.length} 个用户:`);
        users.forEach(user => {
            console.log(`  ${user.nickname} (ID: ${user.id}, 叶语号: ${user.yeyu_id})`);
        });
        
        // 测试好友关系表查询
        const [friendships] = await connection.execute('SELECT COUNT(*) as count FROM friendships');
        console.log(`📊 好友关系表查询成功，包含 ${friendships[0].count} 条记录`);
        
        // 测试登录查询（模拟服务器的登录逻辑）
        const [loginTest] = await connection.execute(
            'SELECT * FROM users WHERE yeyu_id = ? OR phone = ?',
            ['YY0000006', 'YY0000006']
        );
        
        if (loginTest.length > 0) {
            console.log('✅ 登录查询测试成功，找到用户:', loginTest[0].nickname);
        } else {
            console.log('⚠️ 登录查询测试失败，未找到用户');
        }
        
        await connection.end();
        console.log('✅ 数据库测试完成，连接正常');
        
        return true;
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('错误代码:', error.code);
        return false;
    }
}

testDatabaseConnection();

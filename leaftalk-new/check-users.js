const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('📋 当前数据库中的用户:');
    const [users] = await connection.execute('SELECT id, yeyu_id, nickname, phone FROM users');
    users.forEach(user => {
        console.log(`  ID: ${user.id}, 叶语号: ${user.yeyu_id}, 昵称: ${user.nickname}, 手机: ${user.phone || '无'}`);
    });
    
    console.log('\n🔐 测试登录凭据:');
    console.log('可以使用以下任一凭据登录:');
    users.forEach(user => {
        console.log(`  叶语号: ${user.yeyu_id} / 密码: password123`);
        if (user.phone) {
            console.log(`  手机号: ${user.phone} / 密码: password123`);
        }
    });
    
    await connection.end();
}

checkUsers();

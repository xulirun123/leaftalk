const mysql = require('mysql2/promise');

async function checkAvatars() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('📋 检查用户头像数据:');
    const [users] = await connection.execute('SELECT id, yeyu_id, nickname, avatar FROM users');
    users.forEach(user => {
        console.log(`  ID: ${user.id}, 昵称: ${user.nickname}, 头像: ${user.avatar || '无'}`);
    });
    
    await connection.end();
}

checkAvatars();

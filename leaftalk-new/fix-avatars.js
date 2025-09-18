const mysql = require('mysql2/promise');

async function fixAvatars() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('🔧 修复用户头像...');
    
    // 真实头像URL列表 - 使用一些公开的头像API
    const realAvatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=阳静达&backgroundColor=b6e3f4,c0aede,d1d4f9',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=兴海清&backgroundColor=ffd5dc,ffdfbf,c0aede',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=测试用户&backgroundColor=d1d4f9,c0aede,b6e3f4',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=当前用户&backgroundColor=ffdfbf,ffd5dc,d1d4f9',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=测试用户2&backgroundColor=c0aede,b6e3f4,ffdfbf',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=测试用户3&backgroundColor=b6e3f4,d1d4f9,ffd5dc'
    ];
    
    // 获取所有用户
    const [users] = await connection.execute('SELECT id, nickname FROM users ORDER BY id');
    
    console.log(`找到 ${users.length} 个用户，开始分配头像...`);
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const avatarUrl = realAvatars[i % realAvatars.length];
        
        await connection.execute(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarUrl, user.id]
        );
        
        console.log(`✅ 用户 ${user.nickname} (ID: ${user.id}) 头像已更新: ${avatarUrl}`);
    }
    
    console.log('\n📋 验证头像更新结果:');
    const [updatedUsers] = await connection.execute('SELECT id, nickname, avatar FROM users ORDER BY id');
    updatedUsers.forEach(user => {
        console.log(`  ${user.nickname}: ${user.avatar}`);
    });
    
    await connection.end();
    console.log('\n✅ 头像修复完成！');
}

fixAvatars();

const mysql = require('mysql2/promise');

async function checkFriendships() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('检查用户6的好友关系:');
    const [friendships] = await connection.execute('SELECT * FROM friendships WHERE user_id = 6');
    friendships.forEach(f => {
        console.log(`  用户${f.user_id} -> 好友${f.friend_id}, 状态: ${f.status}`);
    });
    
    console.log('\n检查联系人查询结果:');
    const [contacts] = await connection.execute(`
        SELECT DISTINCT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
               f.created_at as friend_since, f.remark
        FROM friendships f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = 6 AND f.status = 'accepted'
        ORDER BY f.created_at DESC
    `);
    
    console.log(`联系人数量: ${contacts.length}`);
    contacts.forEach(contact => {
        console.log(`  ${contact.nickname} (ID: ${contact.id})`);
    });
    
    await connection.end();
}

checkFriendships();

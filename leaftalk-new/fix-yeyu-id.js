const mysql = require('mysql2/promise');

async function fixYeyuIdIssue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔍 检查当前用户数据...');
    
    // 查询所有用户数据
    const [users] = await connection.execute(
      'SELECT id, username, nickname, phone, yeyu_id FROM users ORDER BY id'
    );
    
    console.log('\n📊 当前用户数据:');
    users.forEach(user => {
      console.log(`用户${user.id}: 手机号=${user.phone}, 叶语号=${user.yeyu_id}, 昵称=${user.nickname}`);
    });
    
    // 检查重复的叶语号
    const [duplicates] = await connection.execute(`
      SELECT yeyu_id, COUNT(*) as count 
      FROM users 
      WHERE yeyu_id IS NOT NULL 
      GROUP BY yeyu_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ 发现重复的叶语号:');
      for (const dup of duplicates) {
        console.log(`叶语号 ${dup.yeyu_id} 被 ${dup.count} 个用户使用`);
        
        // 查询使用该叶语号的用户
        const [dupUsers] = await connection.execute(
          'SELECT id, username, phone, yeyu_id FROM users WHERE yeyu_id = ?', 
          [dup.yeyu_id]
        );
        
        console.log('使用该叶语号的用户:');
        dupUsers.forEach(user => {
          console.log(`  - 用户${user.id}: 手机号=${user.phone}`);
        });
        
        // 修复重复问题：为除第一个用户外的其他用户生成新的叶语号
        for (let i = 1; i < dupUsers.length; i++) {
          const user = dupUsers[i];
          const newYeyuId = `YY${Date.now().toString().slice(-8)}${i}`;
          
          await connection.execute(
            'UPDATE users SET yeyu_id = ? WHERE id = ?',
            [newYeyuId, user.id]
          );
          
          console.log(`  ✅ 已为用户${user.id}生成新叶语号: ${newYeyuId}`);
        }
      }
    } else {
      console.log('\n✅ 没有发现重复的叶语号');
    }
    
    // 再次查询确认修复结果
    console.log('\n🔍 修复后的用户数据:');
    const [fixedUsers] = await connection.execute(
      'SELECT id, username, nickname, phone, yeyu_id FROM users ORDER BY id'
    );
    
    fixedUsers.forEach(user => {
      console.log(`用户${user.id}: 手机号=${user.phone}, 叶语号=${user.yeyu_id}, 昵称=${user.nickname}`);
    });
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  } finally {
    await connection.end();
  }
}

// 运行修复脚本
fixYeyuIdIssue().catch(console.error);

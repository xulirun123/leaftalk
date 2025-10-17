const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function resetUserPassword() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔐 重置用户密码...\n');
    
    const yeyuId = 'YYD03YIHRY';
    const newPassword = '123456';
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ 新密码已加密:', hashedPassword);
    
    // 更新密码
    const [result] = await pool.execute(`
      UPDATE \`users\`
      SET password = ?
      WHERE yeyu_id = ?
    `, [hashedPassword, yeyuId]);

    if (result.affectedRows > 0) {
      console.log('✅ 密码重置成功！');
      console.log(`叶语号: ${yeyuId}`);
      console.log(`新密码: ${newPassword}`);
      
      // 验证更新
      const [users] = await pool.execute(`
        SELECT id, yeyu_id, username, nickname
        FROM \`users\`
        WHERE yeyu_id = ?
      `, [yeyuId]);
      
      if (users.length > 0) {
        console.log('\n📋 用户信息:');
        console.log(`用户ID: ${users[0].id}`);
        console.log(`叶语号: ${users[0].yeyu_id}`);
        console.log(`用户名: ${users[0].username}`);
        console.log(`昵称: ${users[0].nickname}`);
      }
    } else {
      console.log('❌ 未找到该用户');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

resetUserPassword();


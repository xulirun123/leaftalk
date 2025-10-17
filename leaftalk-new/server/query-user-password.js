const mysql = require('mysql2/promise');

async function queryUserPassword() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔍 查询用户密码...\n');
    
    // 查询用户信息
    const [users] = await pool.execute(`
      SELECT 
        id,
        yeyu_id,
        username,
        password,
        nickname,
        phone,
        real_name
      FROM \`users\`
      WHERE yeyu_id = ?
    `, ['YYD03YIHRY']);

    if (users.length > 0) {
      console.log('📋 用户信息:');
      users.forEach(user => {
        console.log(`用户ID: ${user.id}`);
        console.log(`叶语号: ${user.yeyu_id}`);
        console.log(`用户名: ${user.username}`);
        console.log(`密码: ${user.password}`);
        console.log(`昵称: ${user.nickname}`);
        console.log(`手机号: ${user.phone}`);
        console.log(`真实姓名: ${user.real_name || '(未设置)'}`);
      });
    } else {
      console.log('❌ 未找到该用户');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

queryUserPassword();


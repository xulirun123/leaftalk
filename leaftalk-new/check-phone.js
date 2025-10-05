const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

async function checkPhone() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'leaftalk',
      password: process.env.DB_PASSWORD || 'leaftalk123',
      database: process.env.DB_NAME || 'leaftalk-new'
    });

    console.log('✅ 数据库连接成功');

    // 查询手机号
    const phone = '17872886622';
    const [rows] = await connection.execute(
      'SELECT id, yeyu_id, phone, nickname, created_at FROM users WHERE phone = ?',
      [phone]
    );

    console.log(`\n🔍 查询手机号: ${phone}`);
    
    if (rows.length > 0) {
      console.log('📱 手机号已存在:');
      rows.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`  - 叶语号: ${user.yeyu_id}`);
        console.log(`  - 昵称: ${user.nickname}`);
        console.log(`  - 注册时间: ${user.created_at}`);
      });
    } else {
      console.log('✅ 手机号可用');
    }

    // 查询所有用户
    const [allUsers] = await connection.execute(
      'SELECT id, yeyu_id, phone, nickname FROM users ORDER BY id DESC LIMIT 5'
    );

    console.log('\n📋 最近注册的5个用户:');
    allUsers.forEach(user => {
      console.log(`  ${user.id}: ${user.yeyu_id} | ${user.phone || '无手机号'} | ${user.nickname}`);
    });

    await connection.end();
    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkPhone();

const mysql = require('mysql2/promise');

async function checkUsersTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔍 检查 users 表结构...');
    
    // 检查表结构
    const [columns] = await connection.execute(
      "DESCRIBE users"
    );
    
    console.log('📊 users 表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''} ${col.Extra || ''}`);
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行脚本
checkUsersTable().catch(console.error);

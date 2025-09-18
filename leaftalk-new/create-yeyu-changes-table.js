const mysql = require('mysql2/promise');

async function createYeyuChangesTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔍 检查 yeyu_id_changes 表是否存在...');
    
    // 检查表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'yeyu_id_changes'"
    );
    
    if (tables.length === 0) {
      console.log('📝 创建 yeyu_id_changes 表...');
      
      // 创建表
      await connection.execute(`
        CREATE TABLE yeyu_id_changes (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          old_yeyu_id VARCHAR(50),
          new_yeyu_id VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ yeyu_id_changes 表创建成功');
    } else {
      console.log('✅ yeyu_id_changes 表已存在');
    }
    
    // 检查表结构
    const [columns] = await connection.execute(
      "DESCRIBE yeyu_id_changes"
    );
    
    console.log('📊 yeyu_id_changes 表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行脚本
createYeyuChangesTable().catch(console.error);

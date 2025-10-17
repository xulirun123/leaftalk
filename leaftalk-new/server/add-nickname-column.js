const mysql = require('mysql2/promise');

async function addNicknameColumn() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('🔍 检查group_members表结构...');
    
    // 检查字段是否存在
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'leaftalk-new' 
        AND TABLE_NAME = 'group_members' 
        AND COLUMN_NAME = 'nickname'
    `);

    if (columns.length > 0) {
      console.log('✅ nickname字段已存在');
    } else {
      console.log('📝 添加nickname字段...');
      await pool.execute(`
        ALTER TABLE \`group_members\` 
        ADD COLUMN \`nickname\` VARCHAR(100) DEFAULT NULL COMMENT '群内昵称' 
        AFTER \`role\`
      `);
      console.log('✅ nickname字段添加成功');
    }

    // 显示表结构
    const [structure] = await pool.execute('DESCRIBE `group_members`');
    console.log('\n📋 group_members表结构:');
    console.table(structure);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

addNicknameColumn();


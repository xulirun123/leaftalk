const mysql = require('mysql2/promise');

async function checkYeyuData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔍 检查数据库中的叶语号数据...\n');
    
    // 查询所有用户的叶语号
    const [users] = await connection.execute(
      'SELECT id, username, nickname, phone, yeyu_id FROM users ORDER BY id'
    );
    
    console.log('📊 当前用户叶语号数据:');
    console.log('ID | 用户名 | 昵称 | 手机号 | 叶语号');
    console.log('---|--------|------|--------|--------');
    users.forEach(user => {
      console.log(`${user.id.toString().padEnd(2)} | ${(user.username || '').padEnd(8)} | ${(user.nickname || '').padEnd(6)} | ${(user.phone || '').padEnd(11)} | ${user.yeyu_id || 'NULL'}`);
    });
    
    // 检查重复的叶语号
    console.log('\n🔍 检查重复的叶语号...');
    const [duplicates] = await connection.execute(`
      SELECT yeyu_id, COUNT(*) as count, GROUP_CONCAT(id) as user_ids
      FROM users 
      WHERE yeyu_id IS NOT NULL 
      GROUP BY yeyu_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.log('⚠️ 发现重复的叶语号:');
      duplicates.forEach(dup => {
        console.log(`  叶语号: ${dup.yeyu_id} - 被用户 ${dup.user_ids} 使用 (${dup.count}次)`);
      });
    } else {
      console.log('✅ 没有发现重复的叶语号');
    }
    
    // 检查修改历史
    console.log('\n🔍 检查叶语号修改历史...');
    const [changes] = await connection.execute(`
      SELECT c.*, u.nickname, u.phone 
      FROM yeyu_id_changes c 
      LEFT JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC 
      LIMIT 10
    `);
    
    if (changes.length > 0) {
      console.log('📝 最近的修改记录:');
      console.log('用户ID | 昵称 | 旧叶语号 | 新叶语号 | 修改时间');
      console.log('-------|------|----------|----------|----------');
      changes.forEach(change => {
        const date = new Date(change.created_at).toLocaleString('zh-CN');
        console.log(`${change.user_id.toString().padEnd(6)} | ${(change.nickname || '').padEnd(6)} | ${(change.old_yeyu_id || 'NULL').padEnd(10)} | ${(change.new_yeyu_id || 'NULL').padEnd(10)} | ${date}`);
      });
    } else {
      console.log('📝 暂无修改记录');
    }
    
    // 检查今年的修改次数
    console.log('\n🔍 检查今年的修改次数...');
    const currentYear = new Date().getFullYear();
    const [yearlyChanges] = await connection.execute(`
      SELECT user_id, COUNT(*) as count, u.nickname, u.phone
      FROM yeyu_id_changes c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE YEAR(c.created_at) = ?
      GROUP BY user_id
    `, [currentYear]);
    
    if (yearlyChanges.length > 0) {
      console.log(`📊 ${currentYear}年的修改统计:`);
      console.log('用户ID | 昵称 | 手机号 | 修改次数');
      console.log('-------|------|--------|----------');
      yearlyChanges.forEach(stat => {
        console.log(`${stat.user_id.toString().padEnd(6)} | ${(stat.nickname || '').padEnd(6)} | ${(stat.phone || '').padEnd(11)} | ${stat.count}`);
      });
    } else {
      console.log(`📊 ${currentYear}年暂无修改记录`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行检查
checkYeyuData().catch(console.error);

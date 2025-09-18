const mysql = require('mysql2/promise');

async function fixUser2Data() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔧 修复用户2的数据不一致问题...\n');
    
    // 查看用户2的当前状态
    const [user2] = await connection.execute(
      'SELECT id, username, nickname, phone, yeyu_id FROM users WHERE id = 2'
    );
    
    if (user2.length === 0) {
      console.log('❌ 用户2不存在');
      return;
    }
    
    console.log('📊 用户2当前状态:');
    console.log(`  ID: ${user2[0].id}`);
    console.log(`  用户名: ${user2[0].username}`);
    console.log(`  昵称: ${user2[0].nickname}`);
    console.log(`  手机号: ${user2[0].phone}`);
    console.log(`  当前叶语号: ${user2[0].yeyu_id}`);
    
    // 检查是否有修改历史
    const [history] = await connection.execute(
      'SELECT * FROM yeyu_id_changes WHERE user_id = 2 ORDER BY created_at DESC'
    );
    
    console.log(`\n📝 修改历史记录: ${history.length}条`);
    if (history.length > 0) {
      history.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.old_yeyu_id} → ${record.new_yeyu_id} (${record.created_at})`);
      });
    }
    
    // 根据之前的数据，用户2的原始叶语号应该是 YYFSRATEHB
    const originalYeyuId = 'YYFSRATEHB';
    const currentYeyuId = user2[0].yeyu_id;
    
    console.log('\n🤔 数据修复选项:');
    console.log(`1. 回滚叶语号: ${currentYeyuId} → ${originalYeyuId}`);
    console.log(`2. 补充历史记录: ${originalYeyuId} → ${currentYeyuId}`);
    console.log(`3. 重置为新的叶语号: ${currentYeyuId} → TESTUSER2`);
    
    // 选择方案1：回滚到原始叶语号，这样用户可以重新测试修改功能
    console.log('\n✅ 执行方案1：回滚到原始叶语号');
    
    // 检查原始叶语号是否被其他用户使用
    const [conflictCheck] = await connection.execute(
      'SELECT id, yeyu_id FROM users WHERE yeyu_id = ? AND id != 2',
      [originalYeyuId]
    );
    
    if (conflictCheck.length > 0) {
      console.log(`❌ 原始叶语号 ${originalYeyuId} 已被用户${conflictCheck[0].id}使用，无法回滚`);
      console.log('🔄 改用方案3：设置为新的叶语号');
      
      // 生成新的叶语号
      const newYeyuId = 'TESTUSER2';
      
      // 检查新叶语号是否可用
      const [newIdCheck] = await connection.execute(
        'SELECT id FROM users WHERE yeyu_id = ?',
        [newYeyuId]
      );
      
      if (newIdCheck.length > 0) {
        console.log(`❌ 新叶语号 ${newYeyuId} 也被使用，请手动处理`);
        return;
      }
      
      // 更新为新叶语号
      await connection.execute(
        'UPDATE users SET yeyu_id = ? WHERE id = 2',
        [newYeyuId]
      );
      
      console.log(`✅ 用户2叶语号已更新为: ${newYeyuId}`);
      
    } else {
      // 回滚到原始叶语号
      await connection.execute(
        'UPDATE users SET yeyu_id = ? WHERE id = 2',
        [originalYeyuId]
      );
      
      console.log(`✅ 用户2叶语号已回滚为: ${originalYeyuId}`);
    }
    
    // 清除可能存在的错误历史记录
    await connection.execute(
      'DELETE FROM yeyu_id_changes WHERE user_id = 2'
    );
    
    console.log('✅ 已清除用户2的历史记录');
    
    // 验证修复结果
    const [updatedUser] = await connection.execute(
      'SELECT yeyu_id FROM users WHERE id = 2'
    );
    
    console.log(`\n🎉 修复完成！用户2当前叶语号: ${updatedUser[0].yeyu_id}`);
    console.log('💡 现在用户2可以正常测试叶语号修改功能了');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行修复
fixUser2Data().catch(console.error);

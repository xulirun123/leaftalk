// 添加测试银行卡脚本
const mysql = require('mysql2/promise');

async function addTestBankCards() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new'
  });

  try {
    console.log('🔄 开始添加测试银行卡...');

    // 获取所有用户
    const [users] = await connection.query('SELECT id FROM users LIMIT 10');

    for (const user of users) {
      // 为每个用户添加2张测试银行卡
      const cards = [
        {
          bank_name: '中国工商银行',
          card_number: '****1234',
          card_type: 'debit',
          balance: 1000.00,
          is_default: true
        },
        {
          bank_name: '中国建设银行',
          card_number: '****5678',
          card_type: 'credit',
          balance: 500.00,
          is_default: false
        }
      ];

      for (const card of cards) {
        try {
          await connection.query(
            `INSERT INTO bank_cards (user_id, bank_name, card_number, card_type, balance, is_default) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE balance = VALUES(balance)`,
            [user.id, card.bank_name, card.card_number, card.card_type, card.balance, card.is_default]
          );
          console.log(`✅ 用户 ${user.id} 添加银行卡: ${card.bank_name} ${card.card_number}`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`ℹ️ 用户 ${user.id} 的银行卡 ${card.card_number} 已存在`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ 测试银行卡添加完成！');
  } catch (error) {
    console.error('❌ 添加测试银行卡失败:', error);
  } finally {
    await connection.end();
  }
}

addTestBankCards();


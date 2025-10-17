const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPaymentPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leaftalk'
  });

  try {
    console.log('🔧 开始添加支付密码字段和银行卡表...');

    // 1. 检查 users 表是否已有 payment_password 字段
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'payment_password'
    `);

    if (columns.length === 0) {
      // 添加支付密码字段
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN payment_password VARCHAR(255) DEFAULT NULL COMMENT '支付密码（加密存储）',
        ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 0.00 COMMENT '钱包余额'
      `);
      console.log('✅ 已添加 payment_password 和 wallet_balance 字段');

      // 为所有现有用户设置默认支付密码 123456（加密后）
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await connection.query(`
        UPDATE users 
        SET payment_password = ?, wallet_balance = 1000.00
        WHERE payment_password IS NULL
      `, [hashedPassword]);
      
      console.log('✅ 已为所有用户设置默认支付密码: 123456，钱包余额: 1000.00');
    } else {
      console.log('ℹ️  payment_password 字段已存在');
    }

    // 2. 检查 users 表的 id 字段类型
    const [userIdType] = await connection.query(`
      SELECT DATA_TYPE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'
    `, [process.env.DB_NAME || 'leaftalk']);

    console.log('ℹ️  users.id 字段类型:', userIdType[0]);

    // 3. 创建银行卡表（不使用外键约束，避免类型不匹配问题）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bank_cards (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '用户ID',
        bank_name VARCHAR(50) NOT NULL COMMENT '银行名称',
        card_number VARCHAR(20) NOT NULL COMMENT '卡号（后4位）',
        card_type ENUM('debit', 'credit') DEFAULT 'debit' COMMENT '卡类型：借记卡/信用卡',
        is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='银行卡表'
    `);
    console.log('✅ 银行卡表创建成功');

    // 4. 为测试用户添加示例银行卡
    const [users] = await connection.query('SELECT id FROM users LIMIT 5');
    
    for (const user of users) {
      // 检查是否已有银行卡
      const [existingCards] = await connection.query(
        'SELECT id FROM bank_cards WHERE user_id = ?',
        [user.id]
      );

      if (existingCards.length === 0) {
        await connection.query(`
          INSERT INTO bank_cards (user_id, bank_name, card_number, card_type, is_default)
          VALUES 
            (?, '工商银行', '1234', 'debit', TRUE),
            (?, '建设银行', '5678', 'debit', FALSE)
        `, [user.id, user.id]);
        console.log(`✅ 已为用户 ${user.id} 添加示例银行卡`);
      }
    }

    console.log('✅ 所有操作完成！');
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await connection.end();
  }
}

addPaymentPassword();


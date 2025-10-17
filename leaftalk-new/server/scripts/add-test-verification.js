/**
 * 添加测试用户的实名认证数据
 * 用于开发测试
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function addTestVerification() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leaftalk'
  });

  try {
    console.log('🔄 开始添加测试实名认证数据...\n');

    // 获取所有用户
    const [users] = await connection.query('SELECT id, nickname FROM users LIMIT 10');

    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }

    console.log(`📋 找到 ${users.length} 个用户\n`);

    // 为每个用户添加实名认证
    for (const user of users) {
      // 检查是否已经实名认证
      const [existing] = await connection.query(
        'SELECT id FROM real_name_verifications WHERE user_id = ?',
        [user.id]
      );

      if (existing.length > 0) {
        console.log(`⏭️  用户 ${user.id} (${user.nickname}) 已经实名认证，跳过`);
        continue;
      }

      // 生成测试数据
      const realName = `测试用户${user.id}`;
      const idCard = generateIdCard(user.id);
      const gender = user.id % 2 === 0 ? '男' : '女';
      const birthDate = '1990-01-01';
      const paymentPassword = '123456';

      // 加密支付密码
      const hashedPassword = await bcrypt.hash(paymentPassword, 10);

      // 插入实名认证记录
      await connection.query(
        `INSERT INTO real_name_verifications 
         (user_id, real_name, id_card, gender, birth_date, verification_status, verification_level, verified_at)
         VALUES (?, ?, ?, ?, ?, 'approved', 2, NOW())`,
        [user.id, realName, idCard, gender, birthDate]
      );

      // 更新用户表
      await connection.query(
        `UPDATE users
         SET real_name = ?, id_card = ?, pay_password = ?, verification_status = 'verified'
         WHERE id = ?`,
        [realName, idCard, hashedPassword, user.id]
      );

      console.log(`✅ 用户 ${user.id} (${user.nickname}) 实名认证成功`);
      console.log(`   姓名: ${realName}`);
      console.log(`   身份证: ${idCard}`);
      console.log(`   支付密码: ${paymentPassword}\n`);
    }

    console.log('🎉 所有测试实名认证数据添加完成！');
  } catch (error) {
    console.error('❌ 添加测试实名认证数据失败:', error);
  } finally {
    await connection.end();
  }
}

/**
 * 生成测试身份证号
 */
function generateIdCard(userId) {
  // 地区码（北京）
  const areaCode = '110101';
  
  // 出生日期
  const birthDate = '19900101';
  
  // 顺序码（3位）+ 用户ID
  const sequenceCode = String(userId).padStart(3, '0');
  
  // 前17位
  const first17 = areaCode + birthDate + sequenceCode;
  
  // 计算校验码
  const checkCode = calculateCheckCode(first17);
  
  return first17 + checkCode;
}

/**
 * 计算身份证校验码
 */
function calculateCheckCode(first17) {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(first17[i]) * weights[i];
  }
  
  const mod = sum % 11;
  return checkCodes[mod];
}

// 运行脚本
addTestVerification();


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// 日志函数（简化版）
const logger = {
  info: (msg) => console.log('ℹ️', msg),
  error: (msg, err) => console.error('❌', msg, err)
};

// 获取数据库连接池（从 app.js 中获取）
function getDb(req) {
  return req.app.get('db');
}

/**
 * 获取付款方式列表
 * GET /api/payment/methods
 */
router.get('/methods', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);

    // 获取用户钱包余额
    const [users] = await db.query(
      'SELECT wallet_balance FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const walletBalance = users[0].wallet_balance || 0;

    // 获取用户的银行卡列表
    const [bankCards] = await db.query(
      'SELECT id, bank_name, card_number, card_type, is_default FROM bank_cards WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    // 构建付款方式列表
    const paymentMethods = [
      {
        id: 'wallet',
        name: '叶语钱包',
        balance: walletBalance,
        type: 'wallet'
      }
    ];

    // 添加银行卡
    bankCards.forEach(card => {
      paymentMethods.push({
        id: `bank_${card.id}`,
        name: `${card.bank_name}(${card.card_number})`,
        type: 'bank',
        cardId: card.id,
        isDefault: card.is_default
      });
    });

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    logger.error('获取付款方式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取付款方式失败'
    });
  }
});

/**
 * 发送红包
 * POST /api/payment/send-redpacket
 */
router.post('/send-redpacket', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);
    const {
      type,
      amount,
      count,
      blessing,
      receiverId,
      chatId,
      isGroup,
      paymentMethod,
      paymentPassword
    } = req.body;

    // ✅ 检查是否已实名认证
    const [verifications] = await db.query(
      'SELECT verification_status FROM real_name_verifications WHERE user_id = ?',
      [userId]
    );

    if (verifications.length === 0 || verifications[0].verification_status !== 'approved') {
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: '请先完成实名认证才能使用支付功能'
      });
    }

    // 验证参数
    if (!type || !amount || !blessing || !receiverId || !paymentPassword || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 验证金额
    if (amount < 0.01) {
      return res.status(400).json({
        success: false,
        message: '单个红包金额不能少于0.01元'
      });
    }

    const totalAmount = type === 'normal' ? amount : amount * (count || 1);

    if (totalAmount > 200) {
      return res.status(400).json({
        success: false,
        message: '红包总金额不能超过200元'
      });
    }

    // 获取用户信息
    const [users] = await db.query(
      'SELECT payment_password, wallet_balance FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 验证支付密码
    if (!user.payment_password) {
      return res.status(400).json({
        success: false,
        code: 'NO_PASSWORD',
        message: '请先设置支付密码'
      });
    }

    const passwordMatch = await bcrypt.compare(paymentPassword, user.payment_password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        code: 'WRONG_PASSWORD',
        message: '支付密码错误'
      });
    }

    // 检查付款方式余额
    let paymentSource = '';
    if (paymentMethod === 'wallet') {
      // 从叶语钱包扣款
      if (user.wallet_balance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: '叶语钱包余额不足'
        });
      }
      paymentSource = 'wallet';
    } else if (paymentMethod.startsWith('bank_')) {
      // 从银行卡扣款
      const cardId = paymentMethod.replace('bank_', '');
      const [cards] = await db.query(
        'SELECT balance FROM bank_cards WHERE id = ? AND user_id = ?',
        [cardId, userId]
      );

      if (cards.length === 0) {
        return res.status(404).json({
          success: false,
          message: '银行卡不存在'
        });
      }

      if (cards[0].balance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: '银行卡余额不足'
        });
      }
      paymentSource = paymentMethod;
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的付款方式'
      });
    }

    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 生成红包ID
      const redPacketId = `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

      // 从付款方式扣款
      if (paymentSource === 'wallet') {
        await connection.query(
          'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
          [totalAmount, userId]
        );
      } else {
        const cardId = paymentSource.replace('bank_', '');
        await connection.query(
          'UPDATE bank_cards SET balance = balance - ? WHERE id = ? AND user_id = ?',
          [totalAmount, cardId, userId]
        );
      }

      // 创建红包记录
      await connection.query(
        `INSERT INTO red_packets (id, sender_id, receiver_id, group_id, type, total_amount, total_count,
         remaining_amount, remaining_count, blessing, payment_method, status, expired_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [redPacketId, userId, isGroup ? null : receiverId, isGroup ? receiverId : null,
         type, totalAmount, count || 1, totalAmount, count || 1, blessing, paymentSource, expiredAt]
      );

      // 提交事务
      await connection.commit();

      logger.info(`用户 ${userId} 发送红包成功: ¥${totalAmount}, 付款方式: ${paymentSource}`);

      res.json({
        success: true,
        message: '红包发送成功',
        data: {
          redPacketId,
          totalAmount,
          type,
          blessing,
          paymentMethod: paymentSource
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('发送红包失败:', error);
    res.status(500).json({
      success: false,
      message: '发送红包失败'
    });
  }
});

/**
 * 领取红包
 * POST /api/payment/claim-redpacket
 * POST /api/payment/redpacket/claim (兼容前端调用)
 */
router.post('/claim-redpacket', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);
    const io = req.app.get('io');
    const { redPacketId, senderId, senderName, amount } = req.body;

    console.log('🧧 领取红包请求:', { userId, redPacketId, senderId, senderName, amount });

    // 验证参数
    if (!redPacketId) {
      return res.status(400).json({
        success: false,
        message: '红包ID不能为空'
      });
    }

    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 查询红包信息
      const [redPackets] = await connection.query(
        'SELECT * FROM red_packets WHERE id = ? FOR UPDATE',
        [redPacketId]
      );

      if (redPackets.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: '红包不存在'
        });
      }

      const redPacket = redPackets[0];

      // 检查是否是自己发送的红包
      if (String(userId) === String(redPacket.sender_id)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '不能领取自己发送的红包'
        });
      }

      // 检查红包状态
      if (redPacket.status === 'expired') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '红包已过期'
        });
      }

      if (redPacket.status === 'completed') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '红包已被领完'
        });
      }

      // 检查是否已领取
      const [claims] = await connection.query(
        'SELECT * FROM red_packet_claims WHERE red_packet_id = ? AND user_id = ?',
        [redPacketId, userId]
      );

      if (claims.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '您已经领取过这个红包了'
        });
      }

      // 检查是否过期（24小时）
      const now = new Date();
      if (redPacket.expired_at && new Date(redPacket.expired_at) < now) {
        // 标记为过期
        await connection.query(
          'UPDATE red_packets SET status = ? WHERE id = ?',
          ['expired', redPacketId]
        );
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '红包已过期'
        });
      }

      // 计算领取金额
      let claimAmount;
      if (redPacket.type === 'normal') {
        // 普通红包：平均分配
        claimAmount = redPacket.total_amount / redPacket.total_count;
      } else {
        // 拼手气红包：随机分配
        if (redPacket.remaining_count === 1) {
          // 最后一个红包，领取剩余全部金额
          claimAmount = redPacket.remaining_amount;
        } else {
          // 随机金额，确保剩余红包每个至少0.01元
          const minRemaining = (redPacket.remaining_count - 1) * 0.01;
          const maxClaim = redPacket.remaining_amount - minRemaining;
          claimAmount = Math.max(0.01, Math.random() * maxClaim);
          claimAmount = Math.floor(claimAmount * 100) / 100; // 保留两位小数
        }
      }

      // 记录领取
      await connection.query(
        'INSERT INTO red_packet_claims (red_packet_id, user_id, amount) VALUES (?, ?, ?)',
        [redPacketId, userId, claimAmount]
      );

      // 更新红包剩余金额和数量
      const newRemainingAmount = redPacket.remaining_amount - claimAmount;
      const newRemainingCount = redPacket.remaining_count - 1;
      const newStatus = newRemainingCount === 0 ? 'completed' : 'active';

      await connection.query(
        'UPDATE red_packets SET remaining_amount = ?, remaining_count = ?, status = ? WHERE id = ?',
        [newRemainingAmount, newRemainingCount, newStatus, redPacketId]
      );

      // 将金额存入领取者的叶语钱包
      await connection.query(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [claimAmount, userId]
      );

      // 提交事务
      await connection.commit();

      // 查询领取者信息
      const [claimerUsers] = await db.query(
        'SELECT nickname, real_name FROM users WHERE id = ?',
        [userId]
      );
      const claimerName = claimerUsers[0]?.nickname || claimerUsers[0]?.real_name || '用户';

      // 发送系统消息给发送者
      if (io) {
        const systemMessageForSender = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: String(userId),
          receiverId: String(redPacket.sender_id),
          content: `${claimerName}领取了你的红包`,
          type: 'system',
          timestamp: Date.now(),
          status: 'sent',
          redPacketMessageId: redPacketId
        };

        const senderRoom = `user_${redPacket.sender_id}`;
        io.to(senderRoom).emit('new_message', systemMessageForSender);
        console.log(`✅ 系统消息已发送给发送者 ${redPacket.sender_id}`);
      }

      logger.info(`用户 ${userId} 领取红包成功: ¥${claimAmount}, 红包ID: ${redPacketId}`);

      res.json({
        success: true,
        message: '红包领取成功',
        amount: claimAmount
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ 领取红包失败:', error);
    res.status(500).json({
      success: false,
      message: '领取红包失败'
    });
  }
});

/**
 * 领取红包（兼容路由）
 * POST /api/payment/redpacket/claim
 */
router.post('/redpacket/claim', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);
    const io = req.app.get('io'); // 获取Socket.IO实例
    const { redPacketId, senderId, senderName, amount } = req.body;

    console.log('🧧 领取红包请求 (兼容路由):', { userId, redPacketId, senderId, senderName, amount });

    // 验证参数
    if (!redPacketId || !senderId || !senderName) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 检查是否是自己发送的红包
    if (String(userId) === String(senderId)) {
      return res.status(400).json({
        success: false,
        message: '不能领取自己发送的红包'
      });
    }

    // TODO: 这里应该检查红包是否存在、是否已被领取、是否过期等
    // 目前先简单实现，直接返回成功

    // 查询领取者的昵称
    const [claimerUsers] = await db.execute(
      'SELECT nickname, real_name FROM users WHERE id = ?',
      [userId]
    );

    const claimerName = claimerUsers[0]?.nickname || claimerUsers[0]?.real_name || '用户';

    console.log('🧧 领取者信息:', { userId, claimerName });

    // 生成会话ID（发送者和领取者之间的会话）
    const sessionId = `chat_${Math.min(senderId, userId)}_${Math.max(senderId, userId)}`;

    // 创建系统消息：发送给发送者
    const systemMessageForSender = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: String(userId), // 领取者ID作为发送者
      receiverId: String(senderId), // 红包发送者ID作为接收者
      content: `${claimerName}领取了你的红包`,
      type: 'system',
      timestamp: Date.now(),
      status: 'sent',
      redPacketMessageId: redPacketId // 添加红包消息ID，用于前端更新红包状态
    };

    console.log('🧧 准备发送系统消息:', systemMessageForSender);

    // 通过WebSocket发送系统消息给发送者
    if (io) {
      const senderRoom = `user_${senderId}`;
      io.to(senderRoom).emit('new_message', systemMessageForSender);
      console.log(`✅ 系统消息已发送给发送者 ${senderId}:`, systemMessageForSender.content);
      console.log(`✅ 发送到房间: ${senderRoom}`);
    } else {
      console.warn('⚠️ Socket.IO实例不存在，无法发送系统消息');
    }

    // 返回成功
    res.json({
      success: true,
      message: '红包领取成功',
      data: {
        amount: amount || 0,
        isLucky: false,
        redPacket: {
          id: redPacketId,
          senderId: senderId,
          senderName: senderName,
          amount: amount || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ 领取红包失败:', error);
    res.status(500).json({
      success: false,
      message: '领取红包失败'
    });
  }
});

/**
 * 处理过期红包退款
 * 定时任务：每小时执行一次
 */
async function processExpiredRedPackets(db) {
  try {
    const connection = await db.getConnection();

    try {
      // 查询所有过期但未退款的红包
      const [expiredRedPackets] = await connection.query(
        `SELECT * FROM red_packets
         WHERE status = 'active'
         AND expired_at < NOW()
         AND remaining_amount > 0
         FOR UPDATE`
      );

      console.log(`🔄 发现 ${expiredRedPackets.length} 个过期红包需要退款`);

      for (const redPacket of expiredRedPackets) {
        await connection.beginTransaction();

        try {
          // 原路退回
          if (redPacket.payment_method === 'wallet') {
            // 退回到叶语钱包
            await connection.query(
              'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
              [redPacket.remaining_amount, redPacket.sender_id]
            );
          } else if (redPacket.payment_method.startsWith('bank_')) {
            // 退回到银行卡
            const cardId = redPacket.payment_method.replace('bank_', '');
            await connection.query(
              'UPDATE bank_cards SET balance = balance + ? WHERE id = ? AND user_id = ?',
              [redPacket.remaining_amount, cardId, redPacket.sender_id]
            );
          }

          // 更新红包状态为已过期
          await connection.query(
            'UPDATE red_packets SET status = ?, remaining_amount = 0, remaining_count = 0 WHERE id = ?',
            ['expired', redPacket.id]
          );

          await connection.commit();
          logger.info(`✅ 红包 ${redPacket.id} 已退款: ¥${redPacket.remaining_amount} 退回到 ${redPacket.payment_method}`);
        } catch (error) {
          await connection.rollback();
          logger.error(`❌ 红包 ${redPacket.id} 退款失败:`, error);
        }
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('❌ 处理过期红包失败:', error);
  }
}

/**
 * 充值
 * POST /api/payment/recharge
 */
router.post('/recharge', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);
    const { amount, paymentMethod } = req.body;

    // ✅ 检查是否已实名认证
    const [verifications] = await db.query(
      'SELECT verification_status FROM real_name_verifications WHERE user_id = ?',
      [userId]
    );

    if (verifications.length === 0 || verifications[0].verification_status !== 'approved') {
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: '请先完成实名认证才能使用充值功能'
      });
    }

    // 验证参数
    if (!amount || amount < 0.01) {
      return res.status(400).json({
        success: false,
        message: '充值金额不能少于0.01元'
      });
    }

    if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: '请选择支付方式'
      });
    }

    // 生成充值订单号
    const orderId = `recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 模拟模式：直接增加余额
    const MOCK_MODE = true; // 开发阶段使用模拟模式

    if (MOCK_MODE) {
      // 直接增加余额
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, userId]
      );

      logger.info(`用户 ${userId} 模拟充值成功: ¥${amount}`);

      return res.json({
        success: true,
        message: '充值成功（模拟）',
        data: {
          orderId,
          amount,
          mock: true
        }
      });
    }

    // 真实模式：调用微信/支付宝支付API
    if (paymentMethod === 'wechat') {
      const wechatPay = require('../payment/wechatpay');

      // 获取用户的微信openid（需要提前获取）
      const [users] = await db.query(
        'SELECT wechat_openid FROM users WHERE id = ?',
        [userId]
      );

      if (!users[0]?.wechat_openid) {
        return res.status(400).json({
          success: false,
          message: '请先绑定微信账号'
        });
      }

      // 创建微信支付订单
      const result = await wechatPay.createRedPacketOrder({
        userId,
        redPacketId: orderId,
        amount,
        description: '叶语钱包充值',
        openid: users[0].wechat_openid
      });

      return res.json({
        success: true,
        data: {
          orderId,
          paymentParams: result.data.paymentParams
        }
      });
    } else {
      // 支付宝支付
      return res.json({
        success: true,
        data: {
          orderId,
          paymentParams: {
            payUrl: `https://alipay.com/pay?orderId=${orderId}`
          }
        }
      });
    }

  } catch (error) {
    logger.error('充值失败:', error);
    res.status(500).json({
      success: false,
      message: '充值失败'
    });
  }
});

/**
 * 提现
 * POST /api/payment/withdraw
 */
router.post('/withdraw', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = getDb(req);
    const { amount, paymentMethod, paymentPassword } = req.body;

    // ✅ 检查是否已实名认证
    const [verifications] = await db.query(
      'SELECT verification_status FROM real_name_verifications WHERE user_id = ?',
      [userId]
    );

    if (verifications.length === 0 || verifications[0].verification_status !== 'approved') {
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: '请先完成实名认证才能使用提现功能'
      });
    }

    // 验证参数
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: '提现金额不能少于1元'
      });
    }

    if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: '请选择提现方式'
      });
    }

    // 获取用户信息
    const [users] = await db.query(
      'SELECT payment_password, wallet_balance FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 验证支付密码
    if (!user.payment_password) {
      return res.status(400).json({
        success: false,
        code: 'NO_PASSWORD',
        message: '请先设置支付密码'
      });
    }

    const passwordMatch = await bcrypt.compare(paymentPassword, user.payment_password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        code: 'WRONG_PASSWORD',
        message: '支付密码错误'
      });
    }

    // 检查余额
    if (user.wallet_balance < amount) {
      return res.status(400).json({
        success: false,
        message: '余额不足'
      });
    }

    // 生成提现订单号
    const orderId = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 扣除余额
      await connection.query(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, userId]
      );

      // 模拟模式：直接返回成功
      const MOCK_MODE = true;

      if (MOCK_MODE) {
        await connection.commit();

        logger.info(`用户 ${userId} 模拟提现成功: ¥${amount}`);

        return res.json({
          success: true,
          message: '提现成功（模拟）',
          data: {
            orderId,
            amount,
            mock: true
          }
        });
      }

      // 真实模式：调用微信/支付宝企业付款API
      // TODO: 实现真实提现逻辑

      await connection.commit();

      res.json({
        success: true,
        message: '提现成功',
        data: { orderId }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('提现失败:', error);
    res.status(500).json({
      success: false,
      message: '提现失败'
    });
  }
});

// 导出定时任务函数
router.processExpiredRedPackets = processExpiredRedPackets;

module.exports = router;


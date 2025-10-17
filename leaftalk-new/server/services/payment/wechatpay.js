/**
 * 微信支付服务
 * 用于接入真实银行卡支付
 */

const fs = require('fs');
const path = require('path');

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appid: process.env.WECHAT_APPID || 'wx1234567890', // 微信公众号/小程序AppID
  mchid: process.env.WECHAT_MCHID || '1234567890', // 微信商户号
  serial_no: process.env.WECHAT_SERIAL_NO || 'XXXXX', // 证书序列号
  private_key_path: process.env.WECHAT_PRIVATE_KEY_PATH || './cert/apiclient_key.pem', // 商户私钥路径
  notify_url: process.env.WECHAT_NOTIFY_URL || 'https://yourdomain.com/api/payment/wechat/notify', // 支付回调地址
};

class WechatPayService {
  constructor() {
    this.payment = null;
    this.initialized = false;
  }

  /**
   * 初始化微信支付
   */
  async init() {
    try {
      // 检查是否已安装SDK
      try {
        const { Payment } = require('wechatpay-node-v3');
        
        // 读取商户私钥
        const privateKey = fs.readFileSync(
          path.resolve(__dirname, WECHAT_PAY_CONFIG.private_key_path),
          'utf-8'
        );

        this.payment = new Payment({
          appid: WECHAT_PAY_CONFIG.appid,
          mchid: WECHAT_PAY_CONFIG.mchid,
          private_key: privateKey,
          serial_no: WECHAT_PAY_CONFIG.serial_no,
        });

        this.initialized = true;
        console.log('✅ 微信支付初始化成功');
      } catch (error) {
        console.warn('⚠️ 微信支付SDK未安装，请运行: npm install wechatpay-node-v3');
        console.warn('⚠️ 当前使用模拟支付模式');
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ 微信支付初始化失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 创建支付订单（红包）
   * @param {Object} params - 支付参数
   * @returns {Object} 支付订单信息
   */
  async createRedPacketOrder(params) {
    const {
      userId,
      redPacketId,
      amount,
      description = '叶语红包',
      openid, // 用户的微信openid
    } = params;

    // 如果未初始化，返回模拟数据
    if (!this.initialized) {
      console.log('🔄 使用模拟支付模式');
      return {
        success: true,
        mock: true,
        message: '模拟支付成功',
        data: {
          orderId: redPacketId,
          amount: amount,
          paymentMethod: 'mock_wechat',
        },
      };
    }

    try {
      // 调用微信支付API
      const result = await this.payment.transactions_jsapi({
        description: description,
        out_trade_no: redPacketId, // 商户订单号
        notify_url: WECHAT_PAY_CONFIG.notify_url,
        amount: {
          total: Math.round(amount * 100), // 转换为分
          currency: 'CNY',
        },
        payer: {
          openid: openid, // 用户的微信openid
        },
      });

      console.log('✅ 微信支付订单创建成功:', redPacketId);

      return {
        success: true,
        mock: false,
        data: {
          orderId: redPacketId,
          prepayId: result.prepay_id,
          paymentParams: this._generatePaymentParams(result.prepay_id),
        },
      };
    } catch (error) {
      console.error('❌ 创建微信支付订单失败:', error);
      throw new Error('创建支付订单失败');
    }
  }

  /**
   * 生成前端支付参数
   * @param {String} prepayId - 预支付ID
   * @returns {Object} 支付参数
   */
  _generatePaymentParams(prepayId) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = Math.random().toString(36).substr(2, 15);
    const packageStr = `prepay_id=${prepayId}`;

    // 生成签名（需要使用商户私钥）
    // 这里简化处理，实际需要使用SDK的签名方法
    const signStr = `${WECHAT_PAY_CONFIG.appid}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;

    return {
      appId: WECHAT_PAY_CONFIG.appid,
      timeStamp: timestamp,
      nonceStr: nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign: 'SIGNATURE', // 实际需要计算签名
    };
  }

  /**
   * 处理支付回调
   * @param {Object} notifyData - 微信支付回调数据
   * @returns {Object} 处理结果
   */
  async handleNotify(notifyData) {
    try {
      // 验证签名
      const isValid = await this.payment.verifySign(notifyData);
      
      if (!isValid) {
        console.error('❌ 微信支付回调签名验证失败');
        return { success: false, message: '签名验证失败' };
      }

      // 解密数据
      const decryptData = this.payment.decipher(notifyData.resource);
      
      const {
        out_trade_no, // 商户订单号（红包ID）
        transaction_id, // 微信支付订单号
        trade_state, // 交易状态
        amount,
      } = decryptData;

      console.log('✅ 微信支付回调:', {
        orderId: out_trade_no,
        transactionId: transaction_id,
        state: trade_state,
        amount: amount.total / 100,
      });

      return {
        success: true,
        data: {
          orderId: out_trade_no,
          transactionId: transaction_id,
          state: trade_state,
          amount: amount.total / 100,
        },
      };
    } catch (error) {
      console.error('❌ 处理微信支付回调失败:', error);
      return { success: false, message: '处理回调失败' };
    }
  }

  /**
   * 查询订单状态
   * @param {String} orderId - 订单号
   * @returns {Object} 订单状态
   */
  async queryOrder(orderId) {
    if (!this.initialized) {
      return {
        success: true,
        mock: true,
        data: { state: 'SUCCESS' },
      };
    }

    try {
      const result = await this.payment.query({
        out_trade_no: orderId,
      });

      return {
        success: true,
        data: {
          state: result.trade_state,
          amount: result.amount.total / 100,
          transactionId: result.transaction_id,
        },
      };
    } catch (error) {
      console.error('❌ 查询订单失败:', error);
      throw new Error('查询订单失败');
    }
  }

  /**
   * 退款
   * @param {Object} params - 退款参数
   * @returns {Object} 退款结果
   */
  async refund(params) {
    const {
      orderId,
      refundId,
      totalAmount,
      refundAmount,
      reason = '红包过期退款',
    } = params;

    if (!this.initialized) {
      console.log('🔄 使用模拟退款模式');
      return {
        success: true,
        mock: true,
        message: '模拟退款成功',
      };
    }

    try {
      const result = await this.payment.refund({
        out_trade_no: orderId,
        out_refund_no: refundId,
        reason: reason,
        amount: {
          refund: Math.round(refundAmount * 100),
          total: Math.round(totalAmount * 100),
          currency: 'CNY',
        },
      });

      console.log('✅ 微信支付退款成功:', refundId);

      return {
        success: true,
        data: {
          refundId: result.out_refund_no,
          status: result.status,
        },
      };
    } catch (error) {
      console.error('❌ 微信支付退款失败:', error);
      throw new Error('退款失败');
    }
  }
}

// 导出单例
const wechatPayService = new WechatPayService();

module.exports = wechatPayService;


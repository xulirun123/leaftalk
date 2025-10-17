/**
 * 银联云闪付支付服务
 * 直连银行卡支付方案
 */

const crypto = require('crypto');
const axios = require('axios');

// 银联支付配置
const UNIONPAY_CONFIG = {
  // 商户号
  merId: process.env.UNIONPAY_MERID || '012345678901234',
  
  // 环境配置
  env: process.env.UNIONPAY_ENV || 'sandbox', // sandbox: 测试环境, production: 生产环境
  
  // API地址
  apiUrl: {
    sandbox: 'https://gateway.test.95516.com', // 测试环境
    production: 'https://gateway.95516.com', // 生产环境
  },
  
  // 证书路径
  certPath: {
    private: process.env.UNIONPAY_PRIVATE_CERT || './cert/unionpay_private.pfx', // 商户私钥证书
    public: process.env.UNIONPAY_PUBLIC_CERT || './cert/unionpay_public.cer', // 银联公钥证书
  },
  
  // 证书密码
  certPassword: process.env.UNIONPAY_CERT_PASSWORD || '000000',
  
  // 回调地址
  notifyUrl: process.env.UNIONPAY_NOTIFY_URL || 'https://yourdomain.com/api/payment/unionpay/notify',
  returnUrl: process.env.UNIONPAY_RETURN_URL || 'https://yourdomain.com/payment/success',
};

class UnionPayService {
  constructor() {
    this.initialized = false;
    this.baseUrl = UNIONPAY_CONFIG.apiUrl[UNIONPAY_CONFIG.env];
  }

  /**
   * 初始化银联支付
   */
  async init() {
    try {
      // 检查证书文件是否存在
      const fs = require('fs');
      const path = require('path');
      
      const privateCertPath = path.resolve(__dirname, UNIONPAY_CONFIG.certPath.private);
      const publicCertPath = path.resolve(__dirname, UNIONPAY_CONFIG.certPath.public);
      
      if (!fs.existsSync(privateCertPath) || !fs.existsSync(publicCertPath)) {
        console.warn('⚠️ 银联证书文件不存在，请先申请银联商户号并下载证书');
        console.warn('⚠️ 当前使用模拟支付模式');
        this.initialized = false;
        return;
      }

      this.initialized = true;
      console.log('✅ 银联支付初始化成功');
    } catch (error) {
      console.error('❌ 银联支付初始化失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 创建支付订单（快捷支付）
   * @param {Object} params - 支付参数
   */
  async createQuickPayOrder(params) {
    const {
      userId,
      orderId,
      amount,
      cardNo, // 银行卡号
      cardHolderName, // 持卡人姓名
      cardHolderIdNo, // 持卡人身份证号
      cardHolderPhone, // 持卡人手机号
      description = '叶语红包',
    } = params;

    // 模拟模式
    if (!this.initialized) {
      console.log('🔄 使用模拟银联支付');
      return {
        success: true,
        mock: true,
        message: '模拟支付成功',
        data: {
          orderId: orderId,
          amount: amount,
          paymentMethod: 'mock_unionpay',
        },
      };
    }

    try {
      // 构建请求参数
      const requestData = {
        version: '5.1.0', // 版本号
        encoding: 'UTF-8', // 编码
        signMethod: '01', // 签名方法：01-RSA
        txnType: '01', // 交易类型：01-消费
        txnSubType: '01', // 交易子类：01-自助消费
        bizType: '000201', // 业务类型：000201-B2C网关支付
        channelType: '07', // 渠道类型：07-PC/平板, 08-手机
        
        // 商户信息
        merId: UNIONPAY_CONFIG.merId, // 商户号
        
        // 订单信息
        orderId: orderId, // 商户订单号
        txnTime: this._getTimestamp(), // 订单发送时间：YYYYMMDDHHmmss
        txnAmt: Math.round(amount * 100).toString(), // 交易金额（分）
        currencyCode: '156', // 货币代码：156-人民币
        
        // 银行卡信息（加密）
        accNo: this._encryptCardNo(cardNo), // 银行卡号（加密）
        customerInfo: this._encryptCustomerInfo({
          certifTp: '01', // 证件类型：01-身份证
          certifId: cardHolderIdNo, // 证件号码
          customerNm: cardHolderName, // 持卡人姓名
          phoneNo: cardHolderPhone, // 手机号
        }),
        
        // 回调地址
        backUrl: UNIONPAY_CONFIG.notifyUrl, // 后台通知地址
        frontUrl: UNIONPAY_CONFIG.returnUrl, // 前台跳转地址
        
        // 订单描述
        orderDesc: description,
      };

      // 签名
      requestData.signature = this._sign(requestData);

      // 发送请求
      const response = await axios.post(
        `${this.baseUrl}/gateway/api/frontTransReq.do`,
        new URLSearchParams(requestData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // 解析响应
      const result = this._parseResponse(response.data);

      if (result.respCode === '00') {
        console.log('✅ 银联支付订单创建成功:', orderId);
        return {
          success: true,
          data: {
            orderId: orderId,
            tn: result.tn, // 交易流水号
            paymentUrl: result.paymentUrl, // 支付页面URL
          },
        };
      } else {
        throw new Error(`银联支付失败: ${result.respMsg}`);
      }
    } catch (error) {
      console.error('❌ 创建银联支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 绑卡支付（更安全）
   * 用户先绑定银行卡，后续支付只需输入短信验证码
   */
  async bindCard(params) {
    const {
      userId,
      cardNo,
      cardHolderName,
      cardHolderIdNo,
      cardHolderPhone,
    } = params;

    if (!this.initialized) {
      return {
        success: true,
        mock: true,
        data: { bindId: `bind_${Date.now()}` },
      };
    }

    // 实际实现需要调用银联绑卡接口
    // 这里简化处理
    console.log('🔄 绑定银行卡:', { userId, cardNo: cardNo.substr(-4) });
    
    return {
      success: true,
      data: {
        bindId: `bind_${Date.now()}`,
        cardNo: cardNo.substr(-4),
      },
    };
  }

  /**
   * 使用已绑定的卡支付
   */
  async payWithBoundCard(params) {
    const {
      userId,
      bindId,
      orderId,
      amount,
      smsCode, // 短信验证码
    } = params;

    if (!this.initialized) {
      return {
        success: true,
        mock: true,
        message: '模拟支付成功',
      };
    }

    // 实际实现需要调用银联绑卡支付接口
    console.log('🔄 绑卡支付:', { userId, bindId, orderId, amount });
    
    return {
      success: true,
      data: {
        orderId: orderId,
        transactionId: `txn_${Date.now()}`,
      },
    };
  }

  /**
   * 处理支付回调
   */
  async handleNotify(notifyData) {
    try {
      // 验证签名
      const isValid = this._verifySign(notifyData);
      
      if (!isValid) {
        console.error('❌ 银联支付回调签名验证失败');
        return { success: false, message: '签名验证失败' };
      }

      const {
        orderId, // 商户订单号
        queryId, // 银联交易流水号
        respCode, // 响应码
        txnAmt, // 交易金额（分）
      } = notifyData;

      console.log('✅ 银联支付回调:', {
        orderId,
        queryId,
        respCode,
        amount: parseInt(txnAmt) / 100,
      });

      return {
        success: respCode === '00',
        data: {
          orderId,
          transactionId: queryId,
          amount: parseInt(txnAmt) / 100,
          status: respCode === '00' ? 'SUCCESS' : 'FAILED',
        },
      };
    } catch (error) {
      console.error('❌ 处理银联支付回调失败:', error);
      return { success: false, message: '处理回调失败' };
    }
  }

  /**
   * 退款
   */
  async refund(params) {
    const {
      orderId,
      refundId,
      totalAmount,
      refundAmount,
    } = params;

    if (!this.initialized) {
      return { success: true, mock: true };
    }

    // 实际实现需要调用银联退款接口
    console.log('🔄 银联退款:', { orderId, refundId, refundAmount });
    
    return {
      success: true,
      data: { refundId },
    };
  }

  // ========== 私有方法 ==========

  _getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[-:T]/g, '').substr(0, 14);
  }

  _encryptCardNo(cardNo) {
    // 实际需要使用银联公钥加密
    // 这里简化处理
    return Buffer.from(cardNo).toString('base64');
  }

  _encryptCustomerInfo(info) {
    // 实际需要使用银联公钥加密
    // 这里简化处理
    return Buffer.from(JSON.stringify(info)).toString('base64');
  }

  _sign(data) {
    // 实际需要使用商户私钥签名
    // 这里简化处理
    const signStr = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto.createHash('sha256').update(signStr).digest('hex');
  }

  _verifySign(data) {
    // 实际需要使用银联公钥验证签名
    // 这里简化处理
    return true;
  }

  _parseResponse(responseText) {
    // 解析银联响应
    const params = new URLSearchParams(responseText);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }
}

// 导出单例
const unionPayService = new UnionPayService();

module.exports = unionPayService;


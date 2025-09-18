/**
 * 叶语企业版安全配置
 * 包含加密、认证、授权、防护等安全措施
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 安全配置常量
const SECURITY_CONFIG = {
  // 加密配置
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltRounds: 12
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: 'leaftalk-enterprise',
    audience: 'leaftalk-users'
  },
  
  // 会话配置
  session: {
    maxAge: 2 * 60 * 60 * 1000, // 2小时
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // 密码策略
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15分钟
  },
  
  // 速率限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 最多100个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // CORS配置
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  }
};

/**
 * 数据加密工具类
 */
class EncryptionUtils {
  /**
   * 生成随机密钥
   */
  static generateKey() {
    return crypto.randomBytes(SECURITY_CONFIG.encryption.keyLength);
  }
  
  /**
   * 生成随机IV
   */
  static generateIV() {
    return crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
  }
  
  /**
   * 加密数据
   */
  static encrypt(text, key) {
    const iv = this.generateIV();
    const cipher = crypto.createCipher(SECURITY_CONFIG.encryption.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  /**
   * 解密数据
   */
  static decrypt(encryptedData, key) {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipher(
      SECURITY_CONFIG.encryption.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * 哈希密码
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, SECURITY_CONFIG.encryption.saltRounds);
  }
  
  /**
   * 验证密码
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  
  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * JWT工具类
 */
class JWTUtils {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, SECURITY_CONFIG.jwt.secret, {
      expiresIn: SECURITY_CONFIG.jwt.accessTokenExpiry,
      issuer: SECURITY_CONFIG.jwt.issuer,
      audience: SECURITY_CONFIG.jwt.audience
    });
  }
  
  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, SECURITY_CONFIG.jwt.secret, {
      expiresIn: SECURITY_CONFIG.jwt.refreshTokenExpiry,
      issuer: SECURITY_CONFIG.jwt.issuer,
      audience: SECURITY_CONFIG.jwt.audience
    });
  }
  
  /**
   * 验证令牌
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, SECURITY_CONFIG.jwt.secret, {
        issuer: SECURITY_CONFIG.jwt.issuer,
        audience: SECURITY_CONFIG.jwt.audience
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

/**
 * 密码策略验证
 */
class PasswordValidator {
  /**
   * 验证密码强度
   */
  static validate(password) {
    const errors = [];
    const config = SECURITY_CONFIG.password;
    
    if (password.length < config.minLength) {
      errors.push(`密码长度至少${config.minLength}位`);
    }
    
    if (password.length > config.maxLength) {
      errors.push(`密码长度不能超过${config.maxLength}位`);
    }
    
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 生成强密码
   */
  static generate(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*(),.?":{}|<>';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // 打乱密码字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

/**
 * 安全中间件
 */
const SecurityMiddleware = {
  /**
   * Helmet安全头中间件
   */
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  /**
   * 速率限制中间件
   */
  rateLimit: rateLimit(SECURITY_CONFIG.rateLimit),
  
  /**
   * 登录速率限制
   */
  loginRateLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试过于频繁，请15分钟后再试',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip + ':' + (req.body.username || req.body.email)
  }),
  
  /**
   * JWT认证中间件
   */
  authenticate: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供访问令牌' });
    }
    
    try {
      const decoded = JWTUtils.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: '无效的访问令牌' });
    }
  },
  
  /**
   * 权限检查中间件
   */
  authorize: (permissions) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: '未认证' });
      }
      
      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({ error: '权限不足' });
      }
      
      next();
    };
  }
};

module.exports = {
  SECURITY_CONFIG,
  EncryptionUtils,
  JWTUtils,
  PasswordValidator,
  SecurityMiddleware
};

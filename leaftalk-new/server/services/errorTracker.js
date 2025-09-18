/**
 * 错误追踪系统
 * 收集、分析和报告应用程序错误
 */

class ErrorTracker {
  constructor(logger) {
    this.logger = logger;
    this.errors = new Map(); // errorId -> errorInfo
    this.errorStats = {
      total: 0,
      byType: new Map(),
      byEndpoint: new Map(),
      byUser: new Map(),
      recent: []
    };
    
    this.maxRecentErrors = 100;
    this.maxStoredErrors = 1000;
    
    // 设置全局错误处理
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      this.captureError(error, {
        type: 'uncaughtException',
        fatal: true
      });
      
      this.logger.error('Uncaught Exception', error, {
        fatal: true,
        pid: process.pid
      });
      
      // 给应用一些时间来记录错误，然后退出
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // 未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      this.captureError(error, {
        type: 'unhandledRejection',
        promise: promise.toString()
      });
      
      this.logger.error('Unhandled Rejection', error, {
        reason: reason,
        promise: promise.toString()
      });
    });

    // 警告事件
    process.on('warning', (warning) => {
      this.logger.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  // 捕获错误
  captureError(error, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const errorInfo = {
      id: errorId,
      timestamp,
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: context.type || 'application',
      context: {
        ...context,
        userAgent: context.req?.get('User-Agent'),
        ip: context.req?.ip,
        url: context.req?.url,
        method: context.req?.method,
        userId: context.req?.user?.userId,
        sessionId: context.req?.sessionID
      },
      fingerprint: this.generateFingerprint(error),
      severity: this.determineSeverity(error, context),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };

    // 存储错误
    this.storeError(errorInfo);
    
    // 更新统计
    this.updateStats(errorInfo);
    
    // 记录日志
    this.logger.error(`Error captured: ${error.message}`, error, {
      errorId,
      fingerprint: errorInfo.fingerprint,
      severity: errorInfo.severity,
      context: errorInfo.context
    });

    return errorId;
  }

  // 生成错误ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成错误指纹（用于分组相似错误）
  generateFingerprint(error) {
    const crypto = require('crypto');
    const key = `${error.name}:${error.message}:${this.getStackSignature(error.stack)}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  // 获取堆栈签名
  getStackSignature(stack) {
    if (!stack) return '';
    
    // 提取前3行堆栈信息，忽略行号
    const lines = stack.split('\n').slice(1, 4);
    return lines.map(line => {
      return line.replace(/:\d+:\d+/g, ':*:*'); // 替换行号和列号
    }).join('|');
  }

  // 确定错误严重程度
  determineSeverity(error, context) {
    if (context.fatal || context.type === 'uncaughtException') {
      return 'fatal';
    }
    
    if (context.type === 'unhandledRejection') {
      return 'error';
    }
    
    if (error.name === 'ValidationError' || error.status === 400) {
      return 'warning';
    }
    
    if (error.status >= 500) {
      return 'error';
    }
    
    return 'info';
  }

  // 存储错误
  storeError(errorInfo) {
    this.errors.set(errorInfo.id, errorInfo);
    
    // 限制存储的错误数量
    if (this.errors.size > this.maxStoredErrors) {
      const oldestKey = this.errors.keys().next().value;
      this.errors.delete(oldestKey);
    }
  }

  // 更新统计信息
  updateStats(errorInfo) {
    this.errorStats.total++;
    
    // 按类型统计
    const typeCount = this.errorStats.byType.get(errorInfo.name) || 0;
    this.errorStats.byType.set(errorInfo.name, typeCount + 1);
    
    // 按端点统计
    if (errorInfo.context.url) {
      const endpointCount = this.errorStats.byEndpoint.get(errorInfo.context.url) || 0;
      this.errorStats.byEndpoint.set(errorInfo.context.url, endpointCount + 1);
    }
    
    // 按用户统计
    if (errorInfo.context.userId) {
      const userCount = this.errorStats.byUser.get(errorInfo.context.userId) || 0;
      this.errorStats.byUser.set(errorInfo.context.userId, userCount + 1);
    }
    
    // 最近错误
    this.errorStats.recent.unshift({
      id: errorInfo.id,
      timestamp: errorInfo.timestamp,
      message: errorInfo.message,
      severity: errorInfo.severity,
      fingerprint: errorInfo.fingerprint
    });
    
    if (this.errorStats.recent.length > this.maxRecentErrors) {
      this.errorStats.recent = this.errorStats.recent.slice(0, this.maxRecentErrors);
    }
  }

  // 获取错误详情
  getError(errorId) {
    return this.errors.get(errorId);
  }

  // 获取错误列表
  getErrors(options = {}) {
    const {
      limit = 50,
      offset = 0,
      severity,
      type,
      since,
      fingerprint
    } = options;

    let errors = Array.from(this.errors.values());
    
    // 过滤
    if (severity) {
      errors = errors.filter(error => error.severity === severity);
    }
    
    if (type) {
      errors = errors.filter(error => error.type === type);
    }
    
    if (since) {
      const sinceDate = new Date(since);
      errors = errors.filter(error => new Date(error.timestamp) >= sinceDate);
    }
    
    if (fingerprint) {
      errors = errors.filter(error => error.fingerprint === fingerprint);
    }
    
    // 排序（最新的在前）
    errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 分页
    const total = errors.length;
    errors = errors.slice(offset, offset + limit);
    
    return {
      errors,
      total,
      limit,
      offset
    };
  }

  // 获取错误统计
  getStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentErrors = Array.from(this.errors.values());
    const errorsLastHour = recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    ).length;
    
    const errorsLastDay = recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    ).length;

    return {
      total: this.errorStats.total,
      stored: this.errors.size,
      lastHour: errorsLastHour,
      lastDay: errorsLastDay,
      byType: Object.fromEntries(this.errorStats.byType),
      byEndpoint: Object.fromEntries(this.errorStats.byEndpoint),
      byUser: Object.fromEntries(this.errorStats.byUser),
      recent: this.errorStats.recent.slice(0, 10),
      topErrors: this.getTopErrors(),
      severityDistribution: this.getSeverityDistribution()
    };
  }

  // 获取最常见的错误
  getTopErrors(limit = 10) {
    const fingerprints = new Map();
    
    Array.from(this.errors.values()).forEach(error => {
      const count = fingerprints.get(error.fingerprint) || 0;
      fingerprints.set(error.fingerprint, count + 1);
    });
    
    return Array.from(fingerprints.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([fingerprint, count]) => {
        const sampleError = Array.from(this.errors.values())
          .find(error => error.fingerprint === fingerprint);
        
        return {
          fingerprint,
          count,
          message: sampleError?.message,
          name: sampleError?.name,
          lastSeen: sampleError?.timestamp
        };
      });
  }

  // 获取严重程度分布
  getSeverityDistribution() {
    const distribution = { fatal: 0, error: 0, warning: 0, info: 0 };
    
    Array.from(this.errors.values()).forEach(error => {
      distribution[error.severity] = (distribution[error.severity] || 0) + 1;
    });
    
    return distribution;
  }

  // Express错误处理中间件
  getErrorMiddleware() {
    return (error, req, res, next) => {
      const errorId = this.captureError(error, {
        type: 'http',
        req,
        endpoint: `${req.method} ${req.path}`
      });

      // 设置错误ID到响应头
      res.set('X-Error-ID', errorId);

      // 如果响应还没有发送，发送错误响应
      if (!res.headersSent) {
        const statusCode = error.status || error.statusCode || 500;
        
        res.status(statusCode).json({
          success: false,
          message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : error.message,
          errorId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // 清理旧错误
  cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 默认7天
    const cutoff = Date.now() - maxAge;
    let deletedCount = 0;
    
    for (const [id, error] of this.errors.entries()) {
      if (new Date(error.timestamp).getTime() < cutoff) {
        this.errors.delete(id);
        deletedCount++;
      }
    }
    
    this.logger.info(`Error cleanup completed: ${deletedCount} errors removed`);
    return deletedCount;
  }
}

module.exports = ErrorTracker;

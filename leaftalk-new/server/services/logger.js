/**
 * 日志管理器
 * 统一的日志记录和管理系统
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

class Logger {
  constructor(options = {}) {
    this.options = {
      level: process.env.LOG_LEVEL || 'info',
      maxFiles: '30d',
      maxSize: '20m',
      logDir: path.join(__dirname, '../logs'),
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: true,
      enableError: true,
      enableAccess: true,
      ...options
    };

    this.createLogDirectory();
    this.initializeLoggers();
  }

  createLogDirectory() {
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  initializeLoggers() {
    // 自定义日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(meta).length > 0) {
          try {
            // 安全的JSON序列化，避免循环引用
            log += ` ${JSON.stringify(meta, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (value.constructor && value.constructor.name === 'Socket') {
                  return '[Socket]';
                }
                if (value.constructor && value.constructor.name === 'IncomingMessage') {
                  return '[IncomingMessage]';
                }
                if (value.constructor && value.constructor.name === 'ServerResponse') {
                  return '[ServerResponse]';
                }
              }
              return value;
            })}`;
          } catch (error) {
            log += ` [JSON serialization error: ${error.message}]`;
          }
        }

        if (stack) {
          log += `\n${stack}`;
        }

        return log;
      })
    );

    // 控制台格式
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;

        if (Object.keys(meta).length > 0) {
          try {
            // 安全的JSON序列化，避免循环引用
            log += ` ${JSON.stringify(meta, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (value.constructor && value.constructor.name === 'Socket') {
                  return '[Socket]';
                }
                if (value.constructor && value.constructor.name === 'IncomingMessage') {
                  return '[IncomingMessage]';
                }
                if (value.constructor && value.constructor.name === 'ServerResponse') {
                  return '[ServerResponse]';
                }
              }
              return value;
            }, 2)}`;
          } catch (error) {
            log += ` [JSON serialization error: ${error.message}]`;
          }
        }

        return log;
      })
    );

    // 主日志器
    this.logger = winston.createLogger({
      level: this.options.level,
      format: logFormat,
      transports: []
    });

    // 控制台输出
    if (this.options.enableConsole) {
      this.logger.add(new winston.transports.Console({
        format: consoleFormat
      }));
    }

    // 文件输出
    if (this.options.enableFile) {
      // 所有日志
      this.logger.add(new DailyRotateFile({
        filename: path.join(this.options.logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: this.options.maxFiles,
        maxSize: this.options.maxSize,
        level: 'info'
      }));

      // 调试日志
      this.logger.add(new DailyRotateFile({
        filename: path.join(this.options.logDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: this.options.maxFiles,
        maxSize: this.options.maxSize,
        level: 'debug'
      }));
    }

    // 错误日志
    if (this.options.enableError) {
      this.errorLogger = winston.createLogger({
        level: 'error',
        format: logFormat,
        transports: [
          new DailyRotateFile({
            filename: path.join(this.options.logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: this.options.maxFiles,
            maxSize: this.options.maxSize,
            level: 'error'
          })
        ]
      });
    }

    // 访问日志
    if (this.options.enableAccess) {
      this.accessLogger = winston.createLogger({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [
          new DailyRotateFile({
            filename: path.join(this.options.logDir, 'access-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: this.options.maxFiles,
            maxSize: this.options.maxSize
          })
        ]
      });
    }
  }

  // 基础日志方法
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    const logData = { ...meta };
    
    if (error) {
      if (error instanceof Error) {
        logData.error = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      } else {
        logData.error = error;
      }
    }

    this.logger.error(message, logData);
    
    if (this.errorLogger) {
      this.errorLogger.error(message, logData);
    }
  }

  // 业务日志方法
  logUserAction(userId, action, details = {}) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      details,
      category: 'user_action'
    });
  }

  logAPIRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.userId,
      category: 'api_request'
    };

    if (this.accessLogger) {
      this.accessLogger.info('API Request', logData);
    }

    this.info(`${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`, logData);
  }

  logDatabaseQuery(query, duration, error = null) {
    const logData = {
      query: query.substring(0, 200),
      duration,
      category: 'database'
    };

    if (error) {
      this.error('Database query failed', error, logData);
    } else {
      this.debug('Database query executed', logData);
    }
  }

  logWebSocketEvent(event, userId, data = {}) {
    this.info(`WebSocket event: ${event}`, {
      event,
      userId,
      data,
      category: 'websocket'
    });
  }

  logSecurityEvent(event, details = {}) {
    this.warn(`Security event: ${event}`, {
      event,
      details,
      category: 'security'
    });
  }

  logPerformanceMetric(metric, value, unit = 'ms') {
    this.info(`Performance metric: ${metric}`, {
      metric,
      value,
      unit,
      category: 'performance'
    });
  }

  // 获取日志统计
  async getLogStats() {
    const logDir = this.options.logDir;
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      files: []
    };

    try {
      const files = fs.readdirSync(logDir);
      
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const fileStat = fs.statSync(filePath);
        
        stats.files.push({
          name: file,
          size: fileStat.size,
          created: fileStat.birthtime,
          modified: fileStat.mtime
        });
        
        stats.totalFiles++;
        stats.totalSize += fileStat.size;
      }
    } catch (error) {
      this.error('Failed to get log stats', error);
    }

    return stats;
  }

  // 清理旧日志
  async cleanupLogs(daysToKeep = 30) {
    const logDir = this.options.logDir;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const files = fs.readdirSync(logDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const fileStat = fs.statSync(filePath);
        
        if (fileStat.birthtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.info(`Deleted old log file: ${file}`);
        }
      }

      this.info(`Log cleanup completed: ${deletedCount} files deleted`);
      return deletedCount;
    } catch (error) {
      this.error('Failed to cleanup logs', error);
      return 0;
    }
  }

  // 获取Morgan中间件
  getMorganMiddleware() {
    const morgan = require('morgan');
    
    // 自定义格式
    morgan.token('user-id', (req) => req.user?.userId || 'anonymous');
    morgan.token('response-time-ms', (req, res) => {
      const responseTime = res.getHeader('X-Response-Time');
      return responseTime ? `${responseTime}ms` : '-';
    });

    const format = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

    return morgan(format, {
      stream: {
        write: (message) => {
          this.accessLogger?.info(message.trim());
        }
      }
    });
  }
}

// 创建全局日志器实例
const logger = new Logger();

module.exports = { Logger, logger };

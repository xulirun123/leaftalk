// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误接口
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  severity: ErrorSeverity;
  timestamp: Date;
  stack?: string;
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    url?: string;
    userAgent?: string;
  };
}

// 错误处理器类
export class ErrorHandler {
  private static errorQueue: AppError[] = [];
  private static maxQueueSize = 100;
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;

  // 处理错误
  static handle(error: any, context?: Partial<AppError['context']>): AppError {
    const appError = this.normalizeError(error, context);
    
    // 记录错误
    this.logError(appError);
    
    // 添加到错误队列
    this.addToQueue(appError);
    
    // 显示用户友好的错误消息
    this.showUserError(appError);
    
    // 上报错误（如果需要）
    this.reportError(appError);
    
    return appError;
  }

  // 标准化错误
  private static normalizeError(error: any, context?: Partial<AppError['context']>): AppError {
    let type = ErrorType.UNKNOWN_ERROR;
    let message = '发生未知错误';
    let code = 'UNKNOWN';
    let severity = ErrorSeverity.MEDIUM;
    let details = null;

    if (error?.response) {
      // HTTP 错误
      const status = error.response.status;
      const data = error.response.data;
      
      if (status >= 400 && status < 500) {
        if (status === 401) {
          type = ErrorType.AUTHENTICATION_ERROR;
          message = '身份验证失败，请重新登录';
          severity = ErrorSeverity.HIGH;
        } else if (status === 403) {
          type = ErrorType.AUTHORIZATION_ERROR;
          message = '权限不足，无法执行此操作';
          severity = ErrorSeverity.MEDIUM;
        } else if (status === 404) {
          type = ErrorType.NOT_FOUND_ERROR;
          message = '请求的资源不存在';
          severity = ErrorSeverity.LOW;
        } else if (status === 422) {
          type = ErrorType.VALIDATION_ERROR;
          message = data?.error?.message || '输入数据验证失败';
          details = data?.error?.details;
          severity = ErrorSeverity.LOW;
        } else {
          type = ErrorType.VALIDATION_ERROR;
          message = data?.error?.message || '请求参数错误';
          severity = ErrorSeverity.LOW;
        }
      } else if (status >= 500) {
        type = ErrorType.SERVER_ERROR;
        message = '服务器内部错误，请稍后重试';
        severity = ErrorSeverity.HIGH;
      }
      
      code = data?.error?.code || `HTTP_${status}`;
      details = data?.error?.details || data;
    } else if (error?.code) {
      // 网络错误
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        type = ErrorType.NETWORK_ERROR;
        message = '网络连接失败，请检查网络设置';
        severity = ErrorSeverity.HIGH;
      } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
        type = ErrorType.TIMEOUT_ERROR;
        message = '请求超时，请稍后重试';
        severity = ErrorSeverity.MEDIUM;
      }
      code = error.code;
    } else if (error instanceof Error) {
      // JavaScript 错误
      message = error.message;
      details = { stack: error.stack };
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      type,
      message,
      code,
      details,
      severity,
      timestamp: new Date(),
      stack: error?.stack,
      context: {
        component: context?.component,
        action: context?.action,
        userId: context?.userId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      }
    };
  }

  // 记录错误到控制台
  private static logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    console[logLevel](logMessage, {
      code: error.code,
      details: error.details,
      context: error.context,
      timestamp: error.timestamp
    });
  }

  // 获取日志级别
  private static getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  // 添加到错误队列
  private static addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // 保持队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  // 显示用户错误
  private static showUserError(error: AppError): void {
    // 这里可以集成具体的UI组件来显示错误
    // 例如：Toast、Modal、Notification等
    
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      // 显示模态框或重要提示
      this.showCriticalError(error);
    } else {
      // 显示轻量级提示
      this.showToast(error);
    }
  }

  // 显示关键错误
  private static showCriticalError(error: AppError): void {
    // 可以触发全局状态管理器来显示错误模态框
    console.error('Critical error:', error.message);
    
    // 示例：发送事件到全局事件总线
    window.dispatchEvent(new CustomEvent('critical-error', {
      detail: error
    }));
  }

  // 显示Toast提示
  private static showToast(error: AppError): void {
    // 示例：发送事件到Toast组件
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        type: 'error',
        message: error.message,
        duration: this.getToastDuration(error.severity)
      }
    }));
  }

  // 获取Toast显示时长
  private static getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000; // 10秒
      case ErrorSeverity.HIGH:
        return 7000;  // 7秒
      case ErrorSeverity.MEDIUM:
        return 5000;  // 5秒
      case ErrorSeverity.LOW:
      default:
        return 3000;  // 3秒
    }
  }

  // 上报错误
  private static async reportError(error: AppError): Promise<void> {
    try {
      // 只上报高严重性错误
      if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
        // 这里可以发送到错误监控服务
        // 例如：Sentry、Bugsnag等
        console.log('Reporting error to monitoring service:', error);
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // 重试机制
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(operationId); // 成功后清除重试计数
      return result;
    } catch (error) {
      if (attempts < maxRetries && this.isRetryableError(error)) {
        this.retryAttempts.set(operationId, attempts + 1);
        
        console.warn(`Operation ${operationId} failed, retrying (${attempts + 1}/${maxRetries})`);
        
        // 指数退避
        await this.delay(1000 * Math.pow(2, attempts));
        return this.withRetry(operation, operationId, maxRetries);
      } else {
        this.retryAttempts.delete(operationId);
        throw this.handle(error, { action: operationId });
      }
    }
  }

  // 判断是否可重试
  private static isRetryableError(error: any): boolean {
    if (error?.response?.status) {
      const status = error.response.status;
      // 5xx错误和部分4xx错误可重试
      return status >= 500 || status === 408 || status === 429;
    }
    
    if (error?.code) {
      const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNABORTED', 'ERR_NETWORK'];
      return retryableCodes.includes(error.code);
    }
    
    return false;
  }

  // 延迟函数
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取错误统计
  static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorQueue.slice(-10) // 最近10个错误
    };

    // 统计错误类型和严重程度
    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // 清除错误队列
  static clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // 导出错误日志
  static exportErrorLog(): string {
    return JSON.stringify(this.errorQueue, null, 2);
  }
}

// 全局错误处理器
export const setupGlobalErrorHandling = (): void => {
  // 处理未捕获的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(event.reason, {
      component: 'global',
      action: 'unhandledrejection'
    });
    event.preventDefault();
  });

  // 处理未捕获的JavaScript错误
  window.addEventListener('error', (event) => {
    ErrorHandler.handle(event.error || event.message, {
      component: 'global',
      action: 'javascript_error',
      url: event.filename,
      details: {
        line: event.lineno,
        column: event.colno
      }
    });
  });

  // 处理资源加载错误
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      ErrorHandler.handle(`Failed to load resource: ${(event.target as any)?.src || 'unknown'}`, {
        component: 'global',
        action: 'resource_error'
      });
    }
  }, true);
};

// 创建错误处理装饰器
export const withErrorHandling = (component: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        ErrorHandler.handle(error, {
          component,
          action: propertyKey
        });
        throw error;
      }
    };
    
    return descriptor;
  };
};

// 导出默认实例
export default ErrorHandler;

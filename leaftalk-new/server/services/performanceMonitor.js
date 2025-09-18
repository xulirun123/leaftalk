/**
 * 性能监控模块
 * 监控API响应时间、数据库查询、内存使用等
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      database: new Map(),
      memory: [],
      errors: [],
      websocket: {
        connections: 0,
        messages: 0,
        errors: 0
      }
    };
    
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    
    // 定期收集系统指标
    this.startSystemMetricsCollection();
  }

  // 开始请求监控
  startRequest(req) {
    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = process.hrtime.bigint();
    
    const requestInfo = {
      id: requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      startTime,
      timestamp: new Date().toISOString()
    };
    
    this.metrics.requests.set(requestId, requestInfo);
    this.requestCount++;
    
    return requestId;
  }

  // 结束请求监控
  endRequest(requestId, res, error = null) {
    const requestInfo = this.metrics.requests.get(requestId);
    if (!requestInfo) return;

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - requestInfo.startTime) / 1000000; // 转换为毫秒

    requestInfo.endTime = endTime;
    requestInfo.duration = duration;
    requestInfo.statusCode = res.statusCode;
    requestInfo.contentLength = res.get('Content-Length') || 0;

    if (error) {
      requestInfo.error = {
        message: error.message,
        stack: error.stack
      };
      this.errorCount++;
      this.recordError(error, requestInfo);
    }

    // 保留最近1000个请求记录
    if (this.metrics.requests.size > 1000) {
      const firstKey = this.metrics.requests.keys().next().value;
      this.metrics.requests.delete(firstKey);
    }
  }

  // 记录数据库查询性能
  recordDatabaseQuery(query, duration, error = null) {
    const queryInfo = {
      query: query.substring(0, 200), // 截取前200字符
      duration,
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    };

    const queryKey = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.database.set(queryKey, queryInfo);

    // 保留最近500个查询记录
    if (this.metrics.database.size > 500) {
      const firstKey = this.metrics.database.keys().next().value;
      this.metrics.database.delete(firstKey);
    }
  }

  // 记录错误
  recordError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    this.metrics.errors.push(errorInfo);

    // 保留最近100个错误记录
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }
  }

  // 记录WebSocket指标
  recordWebSocketConnection(connected = true) {
    if (connected) {
      this.metrics.websocket.connections++;
    } else {
      this.metrics.websocket.connections = Math.max(0, this.metrics.websocket.connections - 1);
    }
  }

  recordWebSocketMessage() {
    this.metrics.websocket.messages++;
  }

  recordWebSocketError() {
    this.metrics.websocket.errors++;
  }

  // 获取性能统计
  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // 计算请求统计
    const requests = Array.from(this.metrics.requests.values());
    const recentRequests = requests.filter(r => 
      new Date(r.timestamp).getTime() > now - 60000 // 最近1分钟
    );

    const requestStats = {
      total: this.requestCount,
      recent: recentRequests.length,
      errors: this.errorCount,
      averageResponseTime: this.calculateAverageResponseTime(requests),
      recentAverageResponseTime: this.calculateAverageResponseTime(recentRequests),
      statusCodes: this.calculateStatusCodeDistribution(requests)
    };

    // 计算数据库统计
    const dbQueries = Array.from(this.metrics.database.values());
    const recentDbQueries = dbQueries.filter(q => 
      new Date(q.timestamp).getTime() > now - 60000
    );

    const databaseStats = {
      totalQueries: dbQueries.length,
      recentQueries: recentDbQueries.length,
      averageQueryTime: this.calculateAverageQueryTime(dbQueries),
      recentAverageQueryTime: this.calculateAverageQueryTime(recentDbQueries),
      slowQueries: dbQueries.filter(q => q.duration > 1000).length
    };

    // 系统指标
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime,
      timestamp: new Date().toISOString(),
      requests: requestStats,
      database: databaseStats,
      websocket: { ...this.metrics.websocket },
      system: {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers
        },
        cpu: cpuUsage,
        loadAverage: require('os').loadavg(),
        platform: process.platform,
        nodeVersion: process.version
      },
      errors: {
        total: this.metrics.errors.length,
        recent: this.metrics.errors.filter(e => 
          new Date(e.timestamp).getTime() > now - 60000
        ).length
      }
    };
  }

  // 获取详细的性能报告
  getDetailedReport() {
    const stats = this.getStats();
    
    return {
      ...stats,
      recentRequests: Array.from(this.metrics.requests.values())
        .slice(-10)
        .map(r => ({
          method: r.method,
          url: r.url,
          duration: r.duration,
          statusCode: r.statusCode,
          timestamp: r.timestamp
        })),
      recentErrors: this.metrics.errors.slice(-5),
      slowQueries: Array.from(this.metrics.database.values())
        .filter(q => q.duration > 1000)
        .slice(-5),
      memoryHistory: this.metrics.memory.slice(-10)
    };
  }

  // 计算平均响应时间
  calculateAverageResponseTime(requests) {
    if (requests.length === 0) return 0;
    
    const totalTime = requests.reduce((sum, req) => sum + (req.duration || 0), 0);
    return Math.round(totalTime / requests.length);
  }

  // 计算平均查询时间
  calculateAverageQueryTime(queries) {
    if (queries.length === 0) return 0;
    
    const totalTime = queries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(totalTime / queries.length);
  }

  // 计算状态码分布
  calculateStatusCodeDistribution(requests) {
    const distribution = {};
    
    requests.forEach(req => {
      const code = req.statusCode || 'unknown';
      distribution[code] = (distribution[code] || 0) + 1;
    });
    
    return distribution;
  }

  // 开始系统指标收集
  startSystemMetricsCollection() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      this.metrics.memory.push({
        timestamp: new Date().toISOString(),
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      });

      // 保留最近100个内存记录
      if (this.metrics.memory.length > 100) {
        this.metrics.memory.shift();
      }
    }, 30000); // 每30秒收集一次
  }

  // 检查系统健康状态
  checkHealth() {
    const stats = this.getStats();
    const health = {
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString()
    };

    // 检查内存使用
    const memoryUsagePercent = (stats.system.memory.heapUsed / stats.system.memory.heapTotal) * 100;
    health.checks.memory = {
      status: memoryUsagePercent < 80 ? 'healthy' : memoryUsagePercent < 90 ? 'warning' : 'critical',
      usage: `${memoryUsagePercent.toFixed(1)}%`,
      heapUsed: stats.system.memory.heapUsed,
      heapTotal: stats.system.memory.heapTotal
    };

    // 检查响应时间
    health.checks.responseTime = {
      status: stats.requests.recentAverageResponseTime < 1000 ? 'healthy' : 
              stats.requests.recentAverageResponseTime < 3000 ? 'warning' : 'critical',
      averageMs: stats.requests.recentAverageResponseTime
    };

    // 检查错误率
    const errorRate = stats.requests.recent > 0 ? 
      (stats.errors.recent / stats.requests.recent) * 100 : 0;
    health.checks.errorRate = {
      status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'warning' : 'critical',
      percentage: errorRate.toFixed(2)
    };

    // 检查数据库性能
    health.checks.database = {
      status: stats.database.recentAverageQueryTime < 500 ? 'healthy' : 
              stats.database.recentAverageQueryTime < 1000 ? 'warning' : 'critical',
      averageQueryTimeMs: stats.database.recentAverageQueryTime,
      slowQueries: stats.database.slowQueries
    };

    // 确定整体状态
    const checkStatuses = Object.values(health.checks).map(check => check.status);
    if (checkStatuses.includes('critical')) {
      health.status = 'critical';
    } else if (checkStatuses.includes('warning')) {
      health.status = 'warning';
    }

    return health;
  }

  // 重置统计数据
  reset() {
    this.metrics.requests.clear();
    this.metrics.database.clear();
    this.metrics.memory = [];
    this.metrics.errors = [];
    this.metrics.websocket = {
      connections: 0,
      messages: 0,
      errors: 0
    };
    
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }
}

module.exports = PerformanceMonitor;

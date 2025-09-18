/**
 * 缓存管理器
 * 支持Redis和内存缓存的统一接口
 */

const Redis = require('ioredis');

class CacheManager {
  constructor(options = {}) {
    this.options = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      },
      memory: {
        maxSize: 1000,
        ttl: 3600 // 默认1小时
      },
      ...options
    };

    this.memoryCache = new Map();
    this.memoryTimers = new Map();
    this.redisClient = null;
    this.useRedis = false;

    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      this.redisClient = new Redis(this.options.redis);
      
      this.redisClient.on('connect', () => {
        console.log('✅ Redis缓存连接成功');
        this.useRedis = true;
      });

      this.redisClient.on('error', (error) => {
        console.warn('⚠️ Redis连接失败，使用内存缓存:', error.message);
        this.useRedis = false;
      });

      this.redisClient.on('close', () => {
        console.warn('⚠️ Redis连接关闭，切换到内存缓存');
        this.useRedis = false;
      });

      // 测试连接
      await this.redisClient.ping();
      this.useRedis = true;
    } catch (error) {
      console.warn('⚠️ Redis初始化失败，使用内存缓存:', error.message);
      this.useRedis = false;
    }
  }

  // 设置缓存
  async set(key, value, ttl = null) {
    const finalTtl = ttl || this.options.memory.ttl;
    
    try {
      if (this.useRedis && this.redisClient) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          await this.redisClient.setex(key, finalTtl, serializedValue);
        } else {
          await this.redisClient.set(key, serializedValue);
        }
        return true;
      }
    } catch (error) {
      console.warn('Redis设置失败，使用内存缓存:', error.message);
      this.useRedis = false;
    }

    // 内存缓存
    this.memoryCache.set(key, value);
    
    // 清除旧的定时器
    if (this.memoryTimers.has(key)) {
      clearTimeout(this.memoryTimers.get(key));
    }
    
    // 设置过期时间
    if (finalTtl > 0) {
      const timer = setTimeout(() => {
        this.memoryCache.delete(key);
        this.memoryTimers.delete(key);
      }, finalTtl * 1000);
      
      this.memoryTimers.set(key, timer);
    }
    
    // 检查内存缓存大小
    this.checkMemorySize();
    return true;
  }

  // 获取缓存
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value !== null) {
          return JSON.parse(value);
        }
        return null;
      }
    } catch (error) {
      console.warn('Redis获取失败，使用内存缓存:', error.message);
      this.useRedis = false;
    }

    // 内存缓存
    return this.memoryCache.get(key) || null;
  }

  // 删除缓存
  async del(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (error) {
      console.warn('Redis删除失败:', error.message);
    }

    // 内存缓存
    this.memoryCache.delete(key);
    if (this.memoryTimers.has(key)) {
      clearTimeout(this.memoryTimers.get(key));
      this.memoryTimers.delete(key);
    }
  }

  // 检查缓存是否存在
  async exists(key) {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.exists(key) === 1;
      }
    } catch (error) {
      console.warn('Redis检查失败:', error.message);
    }

    return this.memoryCache.has(key);
  }

  // 设置过期时间
  async expire(key, ttl) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.expire(key, ttl);
        return true;
      }
    } catch (error) {
      console.warn('Redis设置过期时间失败:', error.message);
    }

    // 内存缓存
    if (this.memoryCache.has(key)) {
      if (this.memoryTimers.has(key)) {
        clearTimeout(this.memoryTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        this.memoryCache.delete(key);
        this.memoryTimers.delete(key);
      }, ttl * 1000);
      
      this.memoryTimers.set(key, timer);
      return true;
    }
    
    return false;
  }

  // 获取所有匹配的键
  async keys(pattern) {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.keys(pattern);
      }
    } catch (error) {
      console.warn('Redis获取键失败:', error.message);
    }

    // 内存缓存
    const keys = Array.from(this.memoryCache.keys());
    if (pattern === '*') {
      return keys;
    }
    
    // 简单的模式匹配
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  // 清空缓存
  async clear() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
      }
    } catch (error) {
      console.warn('Redis清空失败:', error.message);
    }

    // 内存缓存
    this.memoryCache.clear();
    this.memoryTimers.forEach(timer => clearTimeout(timer));
    this.memoryTimers.clear();
  }

  // 获取缓存统计信息
  async getStats() {
    const stats = {
      type: this.useRedis ? 'redis' : 'memory',
      memoryKeys: this.memoryCache.size,
      memoryTimers: this.memoryTimers.size
    };

    try {
      if (this.useRedis && this.redisClient) {
        const info = await this.redisClient.info('memory');
        const keyspace = await this.redisClient.info('keyspace');
        
        stats.redis = {
          connected: true,
          memory: info,
          keyspace: keyspace
        };
      }
    } catch (error) {
      stats.redis = {
        connected: false,
        error: error.message
      };
    }

    return stats;
  }

  // 检查内存缓存大小
  checkMemorySize() {
    if (this.memoryCache.size > this.options.memory.maxSize) {
      // 删除最旧的条目
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
        if (this.memoryTimers.has(firstKey)) {
          clearTimeout(this.memoryTimers.get(firstKey));
          this.memoryTimers.delete(firstKey);
        }
      }
    }
  }

  // 关闭连接
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    this.memoryTimers.forEach(timer => clearTimeout(timer));
    this.memoryTimers.clear();
    this.memoryCache.clear();
  }
}

// 缓存键生成器
class CacheKeyGenerator {
  static user(userId) {
    return `user:${userId}`;
  }

  static userProfile(userId) {
    return `user:profile:${userId}`;
  }

  static userFriends(userId) {
    return `user:friends:${userId}`;
  }

  static chat(chatId) {
    return `chat:${chatId}`;
  }

  static chatMessages(chatId, page = 1) {
    return `chat:messages:${chatId}:${page}`;
  }

  static speechRecord(recordId) {
    return `speech:${recordId}`;
  }

  static mapGeocode(lat, lng) {
    return `map:geocode:${lat}:${lng}`;
  }

  static mapPOI(lat, lng, keyword, radius) {
    return `map:poi:${lat}:${lng}:${keyword}:${radius}`;
  }

  static businessCard(cardId) {
    return `card:${cardId}`;
  }

  static apiResponse(endpoint, params) {
    const paramStr = JSON.stringify(params);
    const hash = require('crypto').createHash('md5').update(paramStr).digest('hex');
    return `api:${endpoint}:${hash}`;
  }
}

module.exports = { CacheManager, CacheKeyGenerator };

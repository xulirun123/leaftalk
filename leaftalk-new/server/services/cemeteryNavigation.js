/**
 * 墓地导航服务
 * 提供墓地位置管理、路线规划、语音导航等功能
 */

const axios = require('axios');

class CemeteryNavigationService {
  constructor(mapConfig, ttsService) {
    this.mapConfig = mapConfig;
    this.ttsService = ttsService;
    this.routeCache = new Map();
  }

  // ================================
  // 墓地位置管理
  // ================================

  // 搜索附近墓地
  async searchNearbyCemeteries(latitude, longitude, radius = 50000, options = {}) {
    try {
      const {
        cemeteryType = null,
        hasAvailableSites = false,
        sortBy = 'distance'
      } = options;

      console.log('🔍 搜索附近墓地:', { latitude, longitude, radius });

      // 使用高德地图POI搜索
      const amapUrl = 'https://restapi.amap.com/v3/place/around';
      const params = {
        key: this.mapConfig.AMAP_KEY,
        location: `${longitude},${latitude}`,
        keywords: '墓地,公墓,陵园',
        types: '190301', // 墓地POI类型
        radius,
        offset: 20,
        page: 1,
        extensions: 'all'
      };

      const response = await axios.get(amapUrl, { params, timeout: 5000 });
      const data = response.data;

      if (data.status === '1' && data.pois) {
        const cemeteries = data.pois.map(poi => {
          const [lng, lat] = poi.location.split(',').map(Number);
          const distance = this.calculateDistance(latitude, longitude, lat, lng);
          
          return {
            id: poi.id,
            name: poi.name,
            address: poi.address,
            latitude: lat,
            longitude: lng,
            distance: Math.round(distance),
            phone: poi.tel,
            type: this.determineCemeteryType(poi.name),
            photos: poi.photos?.map(photo => photo.url) || [],
            rating: poi.biz_ext?.rating || 0,
            source: 'amap'
          };
        });

        // 排序
        if (sortBy === 'distance') {
          cemeteries.sort((a, b) => a.distance - b.distance);
        } else if (sortBy === 'rating') {
          cemeteries.sort((a, b) => b.rating - a.rating);
        }

        return {
          success: true,
          cemeteries,
          total: cemeteries.length
        };
      } else {
        throw new Error(data.info || '搜索失败');
      }

    } catch (error) {
      console.error('❌ 搜索附近墓地失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取墓地详细信息
  async getCemeteryDetails(cemeteryId, source = 'database') {
    try {
      if (source === 'database') {
        // 从数据库获取详细信息
        const [cemeteries] = await db.execute(`
          SELECT c.*, 
                 COUNT(gs.id) as total_sites,
                 COUNT(CASE WHEN gs.status = 'available' THEN 1 END) as available_sites,
                 AVG(cr.rating) as avg_rating,
                 COUNT(cr.id) as review_count
          FROM cemeteries c
          LEFT JOIN grave_sites gs ON c.id = gs.cemetery_id
          LEFT JOIN cemetery_reviews cr ON c.id = cr.cemetery_id
          WHERE c.id = ?
          GROUP BY c.id
        `, [cemeteryId]);

        if (cemeteries.length === 0) {
          throw new Error('墓地不存在');
        }

        const cemetery = cemeteries[0];
        
        // 获取最近的祭拜记录
        const [recentWorships] = await db.execute(`
          SELECT wr.*, u.nickname as user_name
          FROM worship_records wr
          JOIN grave_sites gs ON wr.grave_site_id = gs.id
          JOIN users u ON wr.user_id = u.id
          WHERE gs.cemetery_id = ?
          ORDER BY wr.worship_date DESC, wr.worship_time DESC
          LIMIT 5
        `, [cemeteryId]);

        return {
          success: true,
          cemetery: {
            ...cemetery,
            recentWorships,
            facilities: cemetery.facilities ? JSON.parse(cemetery.facilities) : {},
            photos: cemetery.photos ? JSON.parse(cemetery.photos) : []
          }
        };
      }

      return { success: false, error: '不支持的数据源' };

    } catch (error) {
      console.error('❌ 获取墓地详情失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 路线规划
  // ================================

  // 规划到墓地的路线
  async planRouteToGrave(startLat, startLng, targetCemeteryId, targetGraveSiteId = null, options = {}) {
    try {
      const {
        transportMode = 'driving',
        avoidTraffic = true,
        routePreference = 'fastest'
      } = options;

      console.log('🗺️ 规划墓地路线:', { startLat, startLng, targetCemeteryId, transportMode });

      // 获取目标位置
      let targetLat, targetLng, targetName;
      
      if (targetGraveSiteId) {
        // 精确到墓位
        const [graveSites] = await db.execute(`
          SELECT gs.*, c.name as cemetery_name
          FROM grave_sites gs
          JOIN cemeteries c ON gs.cemetery_id = c.id
          WHERE gs.id = ? AND c.id = ?
        `, [targetGraveSiteId, targetCemeteryId]);

        if (graveSites.length === 0) {
          throw new Error('墓位不存在');
        }

        const site = graveSites[0];
        targetLat = site.latitude || site.cemetery_latitude;
        targetLng = site.longitude || site.cemetery_longitude;
        targetName = `${site.cemetery_name} ${site.section} ${site.site_number}`;
      } else {
        // 到墓地入口
        const [cemeteries] = await db.execute('SELECT * FROM cemeteries WHERE id = ?', [targetCemeteryId]);
        
        if (cemeteries.length === 0) {
          throw new Error('墓地不存在');
        }

        const cemetery = cemeteries[0];
        targetLat = cemetery.latitude;
        targetLng = cemetery.longitude;
        targetName = cemetery.name;
      }

      // 调用高德路径规划API
      const routeResult = await this.calculateRoute(
        startLat, startLng,
        targetLat, targetLng,
        transportMode,
        { avoidTraffic, routePreference }
      );

      if (routeResult.success) {
        // 保存路线记录
        const routeData = {
          ...routeResult.route,
          targetName,
          targetType: targetGraveSiteId ? 'grave_site' : 'cemetery'
        };

        return {
          success: true,
          route: routeData,
          navigationInstructions: this.generateNavigationInstructions(routeResult.route)
        };
      } else {
        throw new Error(routeResult.error);
      }

    } catch (error) {
      console.error('❌ 路线规划失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 调用高德路径规划API
  async calculateRoute(startLat, startLng, endLat, endLng, mode = 'driving', options = {}) {
    try {
      const cacheKey = `route_${startLat}_${startLng}_${endLat}_${endLng}_${mode}`;
      
      // 检查缓存
      if (this.routeCache.has(cacheKey)) {
        const cached = this.routeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          return cached.data;
        }
      }

      let apiUrl, params;

      if (mode === 'driving') {
        apiUrl = 'https://restapi.amap.com/v3/direction/driving';
        params = {
          key: this.mapConfig.AMAP_KEY,
          origin: `${startLng},${startLat}`,
          destination: `${endLng},${endLat}`,
          strategy: options.routePreference === 'shortest' ? 2 : 1,
          extensions: 'all',
          output: 'json'
        };
      } else if (mode === 'walking') {
        apiUrl = 'https://restapi.amap.com/v3/direction/walking';
        params = {
          key: this.mapConfig.AMAP_KEY,
          origin: `${startLng},${startLat}`,
          destination: `${endLng},${endLat}`,
          output: 'json'
        };
      } else {
        throw new Error('不支持的交通方式');
      }

      const response = await axios.get(apiUrl, { params, timeout: 10000 });
      const data = response.data;

      if (data.status === '1' && data.route) {
        const route = data.route;
        const path = route.paths[0];

        const result = {
          success: true,
          route: {
            distance: parseInt(path.distance), // 米
            duration: parseInt(path.duration), // 秒
            tolls: parseInt(path.tolls || 0), // 过路费（分）
            traffic: path.traffic_lights || 0, // 红绿灯数量
            steps: path.steps.map(step => ({
              instruction: step.instruction,
              distance: parseInt(step.distance),
              duration: parseInt(step.duration),
              polyline: step.polyline,
              action: step.action,
              road: step.road
            })),
            polyline: path.polyline,
            strategy: params.strategy || 1
          }
        };

        // 缓存结果
        this.routeCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      } else {
        throw new Error(data.info || '路线规划失败');
      }

    } catch (error) {
      console.error('❌ 路线计算失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 语音导航
  // ================================

  // 生成导航指令
  generateNavigationInstructions(route) {
    const instructions = [];
    
    instructions.push({
      type: 'start',
      text: `开始导航，全程约${(route.distance / 1000).toFixed(1)}公里，预计${Math.ceil(route.duration / 60)}分钟`,
      distance: 0
    });

    route.steps.forEach((step, index) => {
      let instruction = step.instruction;
      
      // 优化指令文本
      instruction = instruction
        .replace(/请/g, '')
        .replace(/您/g, '')
        .replace(/沿着/g, '沿')
        .replace(/继续/g, '继续前行');

      instructions.push({
        type: 'navigation',
        text: instruction,
        distance: step.distance,
        road: step.road,
        action: step.action
      });
    });

    instructions.push({
      type: 'arrive',
      text: '您已到达目的地，祭拜时请保持肃静，缅怀先人',
      distance: 0
    });

    return instructions;
  }

  // 生成语音导航
  async generateVoiceNavigation(instructions, userId) {
    try {
      const voiceInstructions = [];

      for (const instruction of instructions) {
        if (this.ttsService) {
          // 使用TTS服务生成语音
          const audioData = await this.ttsService.synthesize(instruction.text, {
            voice: 'female',
            speed: 0.9,
            volume: 0.8
          });

          voiceInstructions.push({
            ...instruction,
            audioData,
            audioFormat: 'mp3'
          });
        } else {
          // 如果没有TTS服务，只返回文本
          voiceInstructions.push(instruction);
        }
      }

      return {
        success: true,
        voiceInstructions
      };

    } catch (error) {
      console.error('❌ 生成语音导航失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 工具函数
  // ================================

  // 计算两点间距离（米）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // 判断墓地类型
  determineCemeteryType(name) {
    if (name.includes('公墓') || name.includes('人民')) return 'public';
    if (name.includes('寺') || name.includes('庙') || name.includes('院')) return 'temple';
    if (name.includes('家族') || name.includes('祖坟')) return 'family';
    return 'private';
  }

  // 清理路线缓存
  clearRouteCache() {
    this.routeCache.clear();
  }
}

module.exports = CemeteryNavigationService;

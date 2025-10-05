/**
 * 统一地图服务抽象层
 * 支持Web端、移动端的地图功能
 */

export interface LocationInfo {
  id: string
  name: string
  address: string
  distance: string
  latitude: number
  longitude: number
}

export interface MapConfig {
  apiKey: string
  securityCode?: string
  platform: 'web' | 'android' | 'ios'
}

export interface MapInstance {
  setCenter(lng: number, lat: number): void
  setZoom(zoom: number): void
  addMarker(lng: number, lat: number, options?: any): any
  removeMarker(marker: any): void
  destroy(): void
}

export abstract class BaseMapService {
  protected config: MapConfig
  protected map: MapInstance | null = null

  constructor(config: MapConfig) {
    this.config = config
  }

  abstract loadAPI(): Promise<any>
  abstract createMap(containerId: string): Promise<MapInstance>
  abstract getCurrentLocation(): Promise<{ lat: number; lng: number }>
  abstract searchNearby(lat: number, lng: number, radius: number): Promise<LocationInfo[]>
  abstract searchByKeyword(keyword: string, lat: number, lng: number): Promise<LocationInfo[]>
  abstract startLocationWatch(callback: (location: { lat: number; lng: number }) => void): number
  abstract stopLocationWatch(watchId: number): void
}

/**
 * 高德地图Web端实现
 */
export class AMapWebService extends BaseMapService {
  private AMap: any = null

  async loadAPI(): Promise<any> {
    if (window.AMap) {
      this.AMap = window.AMap
      return this.AMap
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.config.apiKey}&plugin=AMap.Geolocation,AMap.PlaceSearch`
      
      script.onload = () => {
        if (window.AMap) {
          // 设置安全密钥
          if (this.config.securityCode) {
            window._AMapSecurityConfig = {
              securityJsCode: this.config.securityCode
            }
          }

          // 设置API版本和配置
          console.log('高德地图API加载成功，版本:', window.AMap.version)
          this.AMap = window.AMap
          resolve(this.AMap)
        } else {
          reject(new Error('高德地图API加载失败'))
        }
      }
      
      script.onerror = () => reject(new Error('高德地图API加载失败'))
      document.head.appendChild(script)
    })
  }

  async createMap(containerId: string): Promise<MapInstance> {
    if (!this.AMap) {
      await this.loadAPI()
    }

    const mapInstance = new this.AMap.Map(containerId, {
      zoom: 16,
      center: [116.4074, 39.9042],
      mapStyle: 'amap://styles/normal',
      viewMode: '2D'
    })

    this.map = {
      setCenter: (lng: number, lat: number) => mapInstance.setCenter([lng, lat]),
      setZoom: (zoom: number) => mapInstance.setZoom(zoom),
      addMarker: (lng: number, lat: number, options = {}) => {
        const marker = new this.AMap.Marker({
          position: [lng, lat],
          ...options
        })
        mapInstance.add(marker)
        return marker
      },
      removeMarker: (marker: any) => mapInstance.remove(marker),
      destroy: () => mapInstance.destroy()
    }

    return this.map
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    if (!this.AMap) {
      await this.loadAPI()
    }

    return new Promise((resolve, reject) => {
      const geolocation = new this.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        convert: true, // 自动转换坐标系
        showButton: false,
        showMarker: false,
        showCircle: false
      })

      geolocation.getCurrentPosition((status: string, result: any) => {
        console.log('定位状态:', status, result)

        if (status === 'complete') {
          resolve({
            lat: result.position.lat,
            lng: result.position.lng
          })
        } else {
          console.error('定位失败:', result.message || result.info)
          // 定位失败时使用默认位置（北京）
          resolve({
            lat: 39.9042,
            lng: 116.4074
          })
        }
      })
    })
  }

  async searchNearby(lat: number, lng: number, radius: number): Promise<LocationInfo[]> {
    if (!this.AMap) {
      await this.loadAPI()
    }

    return new Promise((resolve, reject) => {
      const placeSearch = new this.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        city: '全国', // 设置搜索城市
        citylimit: false, // 不限制城市
        extensions: 'all' // 返回详细信息
      })

      placeSearch.searchNearBy('', [lng, lat], radius, (status: string, result: any) => {
        console.log('POI搜索状态:', status, result)

        if (status === 'complete') {
          if (result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
            const locations: LocationInfo[] = result.poiList.pois.map((poi: any, index: number) => ({
              id: poi.id || `poi_${index}`,
              name: poi.name || '未知地点',
              address: poi.address || poi.district || poi.cityname || '',
              distance: poi.distance ? `${Math.round(poi.distance)}m` : '',
              latitude: poi.location ? poi.location.lat : lat,
              longitude: poi.location ? poi.location.lng : lng
            }))
            resolve(locations)
          } else {
            // 如果没有POI数据，返回空数组而不是错误
            console.log('附近没有找到POI数据，返回空列表')
            resolve([])
          }
        } else {
          console.error('POI搜索失败，状态:', status, '结果:', result)
          // 搜索失败时返回空数组，而不是抛出错误
          resolve([])
        }
      })
    })
  }

  async searchByKeyword(keyword: string, lat: number, lng: number): Promise<LocationInfo[]> {
    if (!this.AMap) {
      await this.loadAPI()
    }

    return new Promise((resolve) => {
      const placeSearch = new this.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        city: '全国',
        citylimit: false,
        extensions: 'all'
      })

      placeSearch.searchNearBy(keyword, [lng, lat], 5000, (status: string, result: any) => {
        console.log('关键词搜索状态:', status, result)

        if (status === 'complete') {
          if (result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
            const locations: LocationInfo[] = result.poiList.pois.map((poi: any, index: number) => ({
              id: poi.id || `search_${index}`,
              name: poi.name || '未知地点',
              address: poi.address || poi.district || poi.cityname || '',
              distance: poi.distance ? `${Math.round(poi.distance)}m` : '',
              latitude: poi.location ? poi.location.lat : lat,
              longitude: poi.location ? poi.location.lng : lng
            }))
            resolve(locations)
          } else {
            console.log('没有找到相关搜索结果')
            resolve([])
          }
        } else {
          console.error('关键词搜索失败，状态:', status, '结果:', result)
          resolve([])
        }
      })
    })
  }

  startLocationWatch(callback: (location: { lat: number; lng: number }) => void): number {
    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => console.error('位置监听失败:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )
  }

  stopLocationWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * 地图服务工厂
 */
export class MapServiceFactory {
  static create(config: MapConfig): BaseMapService {
    switch (config.platform) {
      case 'web':
        return new AMapWebService(config)
      case 'android':
        // TODO: 实现Android原生地图服务
        throw new Error('Android地图服务待实现')
      case 'ios':
        // TODO: 实现iOS原生地图服务  
        throw new Error('iOS地图服务待实现')
      default:
        throw new Error(`不支持的平台: ${config.platform}`)
    }
  }
}

// 全局地图服务实例
let mapServiceInstance: BaseMapService | null = null

export function getMapService(): BaseMapService {
  if (!mapServiceInstance) {
    const config: MapConfig = {
      apiKey: import.meta.env.VITE_AMAP_KEY || '57eda573d29a3034ad1419599454760e',
      securityCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '2ca6ed5c420b9fb7eaa4f0e7766e1775',
      platform: 'web' // 当前平台
    }
    mapServiceInstance = MapServiceFactory.create(config)
  }
  return mapServiceInstance
}

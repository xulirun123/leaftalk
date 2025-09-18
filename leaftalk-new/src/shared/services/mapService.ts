/**
 * 高德地图服务
 */

import { AMAP_CONFIG, MAP_UTILS } from '../config/map'

declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

export interface MapLocation {
  lng: number
  lat: number
  address?: string
  city?: string
  district?: string
  province?: string
}

export interface SearchResult {
  name: string
  address: string
  location: MapLocation
  distance?: number
}

export class MapService {
  private map: any = null
  private geocoder: any = null
  private placeSearch: any = null
  private geolocation: any = null
  private isLoaded = false

  constructor() {
    this.loadMapScript()
  }

  /**
   * 加载高德地图脚本
   */
  private async loadMapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        this.isLoaded = true
        resolve()
        return
      }

      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_CONFIG.securityKey
      }

      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.src = `https://webapi.amap.com/maps?v=${AMAP_CONFIG.version}&key=${AMAP_CONFIG.key}&plugin=${AMAP_CONFIG.plugins.join(',')}`
      
      script.onload = () => {
        this.isLoaded = true
        console.log('✅ 高德地图加载成功')
        resolve()
      }
      
      script.onerror = () => {
        console.error('❌ 高德地图加载失败')
        reject(new Error('高德地图加载失败'))
      }

      document.head.appendChild(script)
    })
  }

  /**
   * 初始化地图
   */
  async initMap(containerId: string, options?: any): Promise<any> {
    await this.loadMapScript()
    
    const mapOptions = {
      ...AMAP_CONFIG.mapOptions,
      ...options
    }

    this.map = new window.AMap.Map(containerId, mapOptions)
    
    // 初始化地理编码
    this.geocoder = new window.AMap.Geocoder(AMAP_CONFIG.geocoder)
    
    // 初始化地点搜索
    this.placeSearch = new window.AMap.PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
      city: '全国',
      citylimit: false,
      map: this.map,
      panel: false
    })

    // 初始化定位
    this.geolocation = new window.AMap.Geolocation(AMAP_CONFIG.geolocation)

    console.log('✅ 地图初始化成功')
    return this.map
  }

  /**
   * 获取当前位置
   */
  async getCurrentLocation(): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!this.geolocation) {
        reject(new Error('定位服务未初始化'))
        return
      }

      this.geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          const location: MapLocation = {
            lng: result.position.lng,
            lat: result.position.lat,
            address: result.formattedAddress,
            city: result.addressComponent.city,
            district: result.addressComponent.district,
            province: result.addressComponent.province
          }
          resolve(location)
        } else {
          reject(new Error('定位失败：' + result.message))
        }
      })
    })
  }

  /**
   * 地理编码（地址转坐标）
   */
  async geocode(address: string): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('地理编码服务未初始化'))
        return
      }

      this.geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const geocode = result.geocodes[0]
          const location: MapLocation = {
            lng: geocode.location.lng,
            lat: geocode.location.lat,
            address: geocode.formattedAddress,
            city: geocode.city,
            district: geocode.district,
            province: geocode.province
          }
          resolve(location)
        } else {
          reject(new Error('地址解析失败'))
        }
      })
    })
  }

  /**
   * 逆地理编码（坐标转地址）
   */
  async reverseGeocode(lng: number, lat: number): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('地理编码服务未初始化'))
        return
      }

      const lnglat = new window.AMap.LngLat(lng, lat)
      this.geocoder.getAddress(lnglat, (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          const regeocode = result.regeocode
          const location: MapLocation = {
            lng,
            lat,
            address: regeocode.formattedAddress,
            city: regeocode.addressComponent.city,
            district: regeocode.addressComponent.district,
            province: regeocode.addressComponent.province
          }
          resolve(location)
        } else {
          reject(new Error('坐标解析失败'))
        }
      })
    })
  }

  /**
   * 搜索地点
   */
  async searchPlace(keyword: string, city?: string): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.placeSearch) {
        reject(new Error('地点搜索服务未初始化'))
        return
      }

      if (city) {
        this.placeSearch.setCity(city)
      }

      this.placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          const results: SearchResult[] = result.poiList.pois.map((poi: any) => ({
            name: poi.name,
            address: poi.address,
            location: {
              lng: poi.location.lng,
              lat: poi.location.lat,
              address: poi.address,
              city: poi.cityname,
              district: poi.adname,
              province: poi.pname
            },
            distance: poi.distance
          }))
          resolve(results)
        } else {
          reject(new Error('搜索失败'))
        }
      })
    })
  }

  /**
   * 添加标记点
   */
  addMarker(location: MapLocation, options?: any): any {
    if (!this.map) {
      throw new Error('地图未初始化')
    }

    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(location.lng, location.lat),
      title: location.address || '',
      ...options
    })

    this.map.add(marker)
    return marker
  }

  /**
   * 设置地图中心点
   */
  setCenter(lng: number, lat: number, zoom?: number): void {
    if (!this.map) {
      throw new Error('地图未初始化')
    }

    this.map.setCenter(new window.AMap.LngLat(lng, lat))
    if (zoom) {
      this.map.setZoom(zoom)
    }
  }

  /**
   * 销毁地图
   */
  destroy(): void {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
  }

  /**
   * 获取地图实例
   */
  getMap(): any {
    return this.map
  }
}

// 创建单例实例
export const mapService = new MapService()
export default mapService

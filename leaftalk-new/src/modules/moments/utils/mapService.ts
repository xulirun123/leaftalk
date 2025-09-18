/**
 * 地图服务工具
 */

export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface POI {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance?: number
}

class MapService {
  // 获取当前位置
  async getCurrentPosition(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          // 如果获取位置失败，返回默认位置（北京）
          console.warn('获取位置失败，使用默认位置:', error)
          resolve({
            latitude: 39.9042,
            longitude: 116.4074
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }

  // 搜索附近POI
  async searchNearbyPOI(
    coordinates: LocationCoordinates, 
    keyword: string = '', 
    radius: number = 1000
  ): Promise<POI[]> {
    // 模拟附近POI数据
    const mockPOIs: POI[] = [
      {
        id: '1',
        name: '星巴克咖啡',
        address: '朝阳区建国门外大街1号',
        latitude: coordinates.latitude + 0.001,
        longitude: coordinates.longitude + 0.001,
        distance: 100
      },
      {
        id: '2',
        name: '麦当劳',
        address: '朝阳区建国门外大街2号',
        latitude: coordinates.latitude + 0.002,
        longitude: coordinates.longitude - 0.001,
        distance: 200
      },
      {
        id: '3',
        name: '中央公园',
        address: '朝阳区建国门外大街3号',
        latitude: coordinates.latitude - 0.001,
        longitude: coordinates.longitude + 0.002,
        distance: 300
      },
      {
        id: '4',
        name: '购物中心',
        address: '朝阳区建国门外大街4号',
        latitude: coordinates.latitude + 0.003,
        longitude: coordinates.longitude + 0.003,
        distance: 400
      },
      {
        id: '5',
        name: '电影院',
        address: '朝阳区建国门外大街5号',
        latitude: coordinates.latitude - 0.002,
        longitude: coordinates.longitude - 0.002,
        distance: 500
      }
    ]

    // 如果有关键词，进行过滤
    let filteredPOIs = mockPOIs
    if (keyword) {
      filteredPOIs = mockPOIs.filter(poi => 
        poi.name.includes(keyword) || poi.address.includes(keyword)
      )
    }

    // 按距离排序
    return filteredPOIs.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  // 根据地址获取坐标
  async geocode(address: string): Promise<LocationCoordinates | null> {
    // 模拟地理编码
    console.log('地理编码:', address)
    
    // 返回默认坐标
    return {
      latitude: 39.9042,
      longitude: 116.4074
    }
  }

  // 根据坐标获取地址
  async reverseGeocode(coordinates: LocationCoordinates): Promise<string> {
    // 模拟逆地理编码
    console.log('逆地理编码:', coordinates)
    
    return '北京市朝阳区建国门外大街'
  }
}

export const mapService = new MapService()
export default MapService

/**
 * 高德地图配置
 */

// 高德地图API配置
export const AMAP_CONFIG = {
  // API Key
  key: '57eda573d29a3034ad1419599454760e',
  
  // 安全密钥（用于服务端API调用）
  securityKey: '2ca6ed5c420b9fb7eaa4f0e7766e1775',
  
  // 地图版本
  version: '2.0',
  
  // 插件列表
  plugins: [
    'AMap.Scale',          // 比例尺
    'AMap.ToolBar',        // 工具条
    'AMap.Geolocation',    // 定位
    'AMap.Geocoder',       // 地理编码
    'AMap.PlaceSearch',    // 地点搜索
    'AMap.AutoComplete',   // 输入提示
    'AMap.Marker',         // 标记点
    'AMap.InfoWindow',     // 信息窗体
    'AMap.DistrictSearch', // 行政区查询
    'AMap.CitySearch'      // 城市查询
  ],
  
  // 默认地图配置
  mapOptions: {
    zoom: 10,              // 缩放级别
    center: [116.397428, 39.90923], // 默认中心点（北京天安门）
    mapStyle: 'amap://styles/normal', // 地图样式
    resizeEnable: true,    // 是否监控地图容器尺寸变化
    rotateEnable: true,    // 是否允许旋转
    pitchEnable: true,     // 是否允许倾斜
    zoomEnable: true,      // 是否允许缩放
    dragEnable: true       // 是否允许拖拽
  },
  
  // 地理编码服务配置
  geocoder: {
    city: '全国',          // 城市范围
    radius: 1000,          // 搜索半径
    extensions: 'all'      // 返回详细信息
  },
  
  // 定位配置
  geolocation: {
    enableHighAccuracy: true,  // 是否使用高精度定位
    timeout: 10000,           // 定位超时时间
    maximumAge: 0,            // 定位结果缓存时间
    convert: true,            // 是否将GPS坐标转换为高德坐标
    showButton: true,         // 是否显示定位按钮
    buttonPosition: 'LB',     // 定位按钮位置
    showMarker: true,         // 是否显示定位标记
    showCircle: true,         // 是否显示精度圆圈
    panToLocation: true,      // 是否将地图中心移动到定位点
    zoomToAccuracy: true      // 是否根据定位精度调整地图缩放级别
  }
}

// 地图主题样式
export const MAP_STYLES = {
  normal: 'amap://styles/normal',           // 标准
  dark: 'amap://styles/dark',               // 幻影黑
  light: 'amap://styles/light',             // 月光银
  fresh: 'amap://styles/fresh',             // 草色青
  grey: 'amap://styles/grey',               // 雅士灰
  graffiti: 'amap://styles/graffiti',       // 涂鸦
  macaron: 'amap://styles/macaron',         // 马卡龙
  blue: 'amap://styles/blue',               // 靛青蓝
  darkblue: 'amap://styles/darkblue',       // 极夜蓝
  wine: 'amap://styles/wine'                // 酱籽
}

// 常用城市坐标
export const CITY_COORDINATES = {
  北京: [116.397428, 39.90923],
  上海: [121.473701, 31.230416],
  广州: [113.264434, 23.129162],
  深圳: [114.085947, 22.547],
  杭州: [120.153576, 30.287459],
  南京: [118.767413, 32.041544],
  武汉: [114.298572, 30.584355],
  成都: [104.065735, 30.659462],
  西安: [108.948024, 34.263161],
  长沙: [112.982279, 28.19409],
  重庆: [106.504962, 29.533155],
  天津: [117.190182, 39.125596],
  苏州: [120.619585, 31.299379],
  郑州: [113.665412, 34.757975],
  长春: [125.3245, 43.886841],
  沈阳: [123.429096, 41.796767],
  青岛: [120.355173, 36.082982],
  宁波: [121.549792, 29.868388],
  无锡: [120.301663, 31.574729],
  合肥: [117.283042, 31.86119]
}

// 地图工具函数
export const MAP_UTILS = {
  // 获取城市坐标
  getCityCoordinate: (cityName: string): [number, number] => {
    return CITY_COORDINATES[cityName] || CITY_COORDINATES['北京']
  },
  
  // 计算两点距离
  getDistance: (point1: [number, number], point2: [number, number]): number => {
    const [lng1, lat1] = point1
    const [lng2, lat2] = point2
    const radLat1 = lat1 * Math.PI / 180.0
    const radLat2 = lat2 * Math.PI / 180.0
    const a = radLat1 - radLat2
    const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
    s = s * 6378.137
    s = Math.round(s * 10000) / 10000
    return s * 1000 // 返回米
  },
  
  // 格式化距离显示
  formatDistance: (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}米`
    } else {
      return `${(distance / 1000).toFixed(1)}公里`
    }
  }
}

export default AMAP_CONFIG

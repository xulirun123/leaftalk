import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SecurityPolicy {
  id: string
  name: string
  description: string
  type: 'password' | 'access' | 'data' | 'audit' | 'device' | 'network'
  isEnabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  rules: SecurityRule[]
  createdAt: number
  updatedAt: number
  createdBy: string
}

export interface SecurityRule {
  id: string
  name: string
  condition: string
  action: 'allow' | 'deny' | 'warn' | 'log' | 'block'
  parameters: Record<string, any>
  isEnabled: boolean
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'access_denied' | 'data_breach' | 'suspicious_activity' | 'policy_violation'
  severity: 'info' | 'warning' | 'error' | 'critical'
  userId: string
  userName: string
  userAvatar: string
  deviceId: string
  deviceInfo: DeviceInfo
  location: LocationInfo
  description: string
  details: Record<string, any>
  timestamp: number
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: number
  resolution?: string
}

export interface DeviceInfo {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown'
  os: string
  browser: string
  version: string
  fingerprint: string
  isTrusted: boolean
  lastSeen: number
  location: LocationInfo
}

export interface LocationInfo {
  ip: string
  country: string
  region: string
  city: string
  latitude?: number
  longitude?: number
  isp?: string
  isVpn?: boolean
  riskScore: number
}

export interface AccessControl {
  id: string
  userId: string
  resourceType: 'chat' | 'file' | 'contact' | 'group' | 'admin' | 'api'
  resourceId: string
  permissions: Permission[]
  restrictions: Restriction[]
  expiresAt?: number
  createdAt: number
  createdBy: string
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'share' | 'admin'
  isGranted: boolean
  conditions?: string[]
}

export interface Restriction {
  type: 'time' | 'location' | 'device' | 'network'
  rule: string
  isActive: boolean
}

export interface SecurityAlert {
  id: string
  type: 'threat_detected' | 'policy_violation' | 'unusual_activity' | 'system_breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedUsers: string[]
  affectedResources: string[]
  recommendations: string[]
  status: 'active' | 'investigating' | 'resolved' | 'dismissed'
  createdAt: number
  updatedAt: number
  assignedTo?: string
}

export interface SecurityAudit {
  id: string
  action: string
  resource: string
  userId: string
  userName: string
  userRole: string
  deviceId: string
  location: LocationInfo
  timestamp: number
  success: boolean
  details: Record<string, any>
  riskScore: number
}

export interface ThreatIntelligence {
  id: string
  type: 'malware' | 'phishing' | 'suspicious_ip' | 'data_leak' | 'vulnerability'
  source: string
  indicator: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  firstSeen: number
  lastSeen: number
  isActive: boolean
}

export interface SecurityDashboard {
  overview: {
    totalEvents: number
    criticalAlerts: number
    activeThreats: number
    riskScore: number
  }
  trends: {
    eventsToday: number
    eventsThisWeek: number
    eventsThisMonth: number
    riskTrend: 'increasing' | 'stable' | 'decreasing'
  }
  topThreats: ThreatIntelligence[]
  recentEvents: SecurityEvent[]
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    lastScan: number
    vulnerabilities: number
  }
}

export const useSecurityStore = defineStore('security', () => {
  // 状态
  const policies = ref<SecurityPolicy[]>([])
  const events = ref<SecurityEvent[]>([])
  const devices = ref<DeviceInfo[]>([])
  const accessControls = ref<AccessControl[]>([])
  const alerts = ref<SecurityAlert[]>([])
  const audits = ref<SecurityAudit[]>([])
  const threats = ref<ThreatIntelligence[]>([])
  const dashboard = ref<SecurityDashboard | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activePolicies = computed(() => 
    policies.value.filter(policy => policy.isEnabled)
  )

  const criticalEvents = computed(() => 
    events.value.filter(event => event.severity === 'critical' && !event.isResolved)
  )

  const activeAlerts = computed(() => 
    alerts.value.filter(alert => alert.status === 'active')
  )

  const trustedDevices = computed(() => 
    devices.value.filter(device => device.isTrusted)
  )

  const suspiciousDevices = computed(() => 
    devices.value.filter(device => !device.isTrusted)
  )

  const todayEvents = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return events.value.filter(event => event.timestamp >= today.getTime())
  })

  const riskScore = computed(() => {
    if (!dashboard.value) return 0
    return dashboard.value.overview.riskScore
  })

  // 初始化
  const initialize = async () => {
    try {
      await Promise.all([
        loadDashboard(),
        loadPolicies(),
        loadEvents(),
        loadDevices(),
        loadAlerts(),
        loadThreats()
      ])
      
      console.log('✅ 安全系统初始化完成')
    } catch (err) {
      console.error('❌ 安全系统初始化失败:', err)
      error.value = err instanceof Error ? err.message : '初始化失败'
    }
  }

  // 仪表板管理
  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/security/dashboard')
      
      if (!response.ok) {
        throw new Error('获取安全仪表板失败')
      }

      const data = await response.json()
      dashboard.value = data.dashboard || getMockDashboard()

    } catch (err) {
      console.error('加载安全仪表板失败:', err)
      // 使用模拟数据
      dashboard.value = getMockDashboard()
    }
  }

  // 安全策略管理
  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/security/policies')
      
      if (!response.ok) {
        throw new Error('获取安全策略失败')
      }

      const data = await response.json()
      policies.value = data.policies || getMockPolicies()

    } catch (err) {
      console.error('加载安全策略失败:', err)
      // 使用模拟数据
      policies.value = getMockPolicies()
    }
  }

  const createPolicy = async (policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      loading.value = true

      const response = await fetch('/api/security/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      })

      if (!response.ok) {
        throw new Error('创建安全策略失败')
      }

      const data = await response.json()
      
      const newPolicy: SecurityPolicy = {
        ...policy,
        id: data.policyId || `policy_${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      policies.value.unshift(newPolicy)
      return newPolicy

    } catch (err) {
      console.error('创建安全策略失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePolicy = async (policyId: string, updates: Partial<SecurityPolicy>) => {
    try {
      loading.value = true

      const response = await fetch(`/api/security/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('更新安全策略失败')
      }

      const policyIndex = policies.value.findIndex(p => p.id === policyId)
      if (policyIndex !== -1) {
        policies.value[policyIndex] = {
          ...policies.value[policyIndex],
          ...updates,
          updatedAt: Date.now()
        }
      }

    } catch (err) {
      console.error('更新安全策略失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePolicy = async (policyId: string) => {
    try {
      loading.value = true

      const response = await fetch(`/api/security/policies/${policyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除安全策略失败')
      }

      policies.value = policies.value.filter(p => p.id !== policyId)

    } catch (err) {
      console.error('删除安全策略失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 安全事件管理
  const loadEvents = async (page = 1, limit = 50, filters?: any) => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString() 
      })
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value as string)
        })
      }

      const response = await fetch(`/api/security/events?${params}`)
      
      if (!response.ok) {
        throw new Error('获取安全事件失败')
      }

      const data = await response.json()
      
      if (page === 1) {
        events.value = data.events || getMockEvents()
      } else {
        events.value.push(...(data.events || []))
      }

    } catch (err) {
      console.error('加载安全事件失败:', err)
      // 使用模拟数据
      if (page === 1) {
        events.value = getMockEvents()
      }
    }
  }

  const resolveEvent = async (eventId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/security/events/${eventId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      })

      if (!response.ok) {
        throw new Error('解决安全事件失败')
      }

      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].isResolved = true
        events.value[eventIndex].resolvedAt = Date.now()
        events.value[eventIndex].resolution = resolution
      }

    } catch (err) {
      console.error('解决安全事件失败:', err)
      throw err
    }
  }

  // 设备管理
  const loadDevices = async () => {
    try {
      const response = await fetch('/api/security/devices')
      
      if (!response.ok) {
        throw new Error('获取设备列表失败')
      }

      const data = await response.json()
      devices.value = data.devices || getMockDevices()

    } catch (err) {
      console.error('加载设备列表失败:', err)
      // 使用模拟数据
      devices.value = getMockDevices()
    }
  }

  const trustDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/security/devices/${deviceId}/trust`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('信任设备失败')
      }

      const deviceIndex = devices.value.findIndex(d => d.id === deviceId)
      if (deviceIndex !== -1) {
        devices.value[deviceIndex].isTrusted = true
      }

    } catch (err) {
      console.error('信任设备失败:', err)
      throw err
    }
  }

  const blockDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/security/devices/${deviceId}/block`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('阻止设备失败')
      }

      const deviceIndex = devices.value.findIndex(d => d.id === deviceId)
      if (deviceIndex !== -1) {
        devices.value[deviceIndex].isTrusted = false
      }

    } catch (err) {
      console.error('阻止设备失败:', err)
      throw err
    }
  }

  // 安全警报管理
  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts')
      
      if (!response.ok) {
        throw new Error('获取安全警报失败')
      }

      const data = await response.json()
      alerts.value = data.alerts || getMockAlerts()

    } catch (err) {
      console.error('加载安全警报失败:', err)
      // 使用模拟数据
      alerts.value = getMockAlerts()
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}/dismiss`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('忽略警报失败')
      }

      const alertIndex = alerts.value.findIndex(a => a.id === alertId)
      if (alertIndex !== -1) {
        alerts.value[alertIndex].status = 'dismissed'
        alerts.value[alertIndex].updatedAt = Date.now()
      }

    } catch (err) {
      console.error('忽略警报失败:', err)
      throw err
    }
  }

  // 威胁情报管理
  const loadThreats = async () => {
    try {
      const response = await fetch('/api/security/threats')
      
      if (!response.ok) {
        throw new Error('获取威胁情报失败')
      }

      const data = await response.json()
      threats.value = data.threats || getMockThreats()

    } catch (err) {
      console.error('加载威胁情报失败:', err)
      // 使用模拟数据
      threats.value = getMockThreats()
    }
  }

  // 安全扫描
  const performSecurityScan = async () => {
    try {
      loading.value = true

      const response = await fetch('/api/security/scan', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('安全扫描失败')
      }

      const data = await response.json()
      
      // 刷新仪表板数据
      await loadDashboard()
      
      return data.scanResult

    } catch (err) {
      console.error('安全扫描失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 模拟数据生成
  const getMockDashboard = (): SecurityDashboard => ({
    overview: {
      totalEvents: 1247,
      criticalAlerts: 3,
      activeThreats: 12,
      riskScore: 65
    },
    trends: {
      eventsToday: 23,
      eventsThisWeek: 156,
      eventsThisMonth: 678,
      riskTrend: 'stable'
    },
    topThreats: [],
    recentEvents: [],
    systemHealth: {
      status: 'warning',
      uptime: 99.8,
      lastScan: Date.now() - 3600000,
      vulnerabilities: 5
    }
  })

  const getMockPolicies = (): SecurityPolicy[] => [
    {
      id: 'policy_001',
      name: '密码安全策略',
      description: '强制用户使用强密码并定期更换',
      type: 'password',
      isEnabled: true,
      severity: 'high',
      rules: [
        {
          id: 'rule_001',
          name: '密码复杂度',
          condition: 'password_complexity >= 8',
          action: 'deny',
          parameters: { minLength: 8, requireSpecialChars: true },
          isEnabled: true
        }
      ],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      createdBy: 'admin'
    }
  ]

  const getMockEvents = (): SecurityEvent[] => [
    {
      id: 'event_001',
      type: 'suspicious_activity',
      severity: 'warning',
      userId: 'user_001',
      userName: '张三',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      deviceId: 'device_001',
      deviceInfo: {
        id: 'device_001',
        name: 'iPhone 15',
        type: 'mobile',
        os: 'iOS 17.0',
        browser: 'Safari',
        version: '17.0',
        fingerprint: 'abc123',
        isTrusted: true,
        lastSeen: Date.now(),
        location: {
          ip: '192.168.1.100',
          country: '中国',
          region: '北京',
          city: '北京',
          riskScore: 20
        }
      },
      location: {
        ip: '192.168.1.100',
        country: '中国',
        region: '北京',
        city: '北京',
        riskScore: 20
      },
      description: '检测到异常登录行为',
      details: { loginAttempts: 5, timeWindow: '5分钟' },
      timestamp: Date.now() - 1800000,
      isResolved: false
    }
  ]

  const getMockDevices = (): DeviceInfo[] => [
    {
      id: 'device_001',
      name: 'iPhone 15',
      type: 'mobile',
      os: 'iOS 17.0',
      browser: 'Safari',
      version: '17.0',
      fingerprint: 'abc123',
      isTrusted: true,
      lastSeen: Date.now(),
      location: {
        ip: '192.168.1.100',
        country: '中国',
        region: '北京',
        city: '北京',
        riskScore: 20
      }
    }
  ]

  const getMockAlerts = (): SecurityAlert[] => [
    {
      id: 'alert_001',
      type: 'threat_detected',
      severity: 'high',
      title: '检测到恶意IP访问',
      description: '发现来自已知恶意IP的访问尝试',
      affectedUsers: ['user_001', 'user_002'],
      affectedResources: ['chat_001'],
      recommendations: ['阻止该IP地址', '加强监控'],
      status: 'active',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000
    }
  ]

  const getMockThreats = (): ThreatIntelligence[] => [
    {
      id: 'threat_001',
      type: 'suspicious_ip',
      source: 'threat_feed',
      indicator: '192.168.1.200',
      description: '已知的恶意IP地址',
      severity: 'high',
      confidence: 85,
      firstSeen: Date.now() - 86400000,
      lastSeen: Date.now() - 3600000,
      isActive: true
    }
  ]

  // 清理错误状态
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    policies,
    events,
    devices,
    accessControls,
    alerts,
    audits,
    threats,
    dashboard,
    loading,
    error,

    // 计算属性
    activePolicies,
    criticalEvents,
    activeAlerts,
    trustedDevices,
    suspiciousDevices,
    todayEvents,
    riskScore,

    // 方法
    initialize,
    loadDashboard,
    loadPolicies,
    createPolicy,
    updatePolicy,
    loadEvents,
    resolveEvent,
    loadDevices,
    trustDevice,
    blockDevice,
    loadAlerts,
    dismissAlert,
    loadThreats,
    performSecurityScan,
    clearError,
    deletePolicy
  }
})

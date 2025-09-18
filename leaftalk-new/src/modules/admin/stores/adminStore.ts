import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  nickname: string
  phone: string
  email?: string
  avatar: string
  status: 'active' | 'disabled' | 'banned'
  createdAt: number
  lastLoginAt?: number
}

export interface SystemNotification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  scope: 'all' | 'online' | 'specific'
  targetUsers?: string[]
  status: 'draft' | 'sent'
  createdAt: number
  sentAt?: number
}

export interface ContentReport {
  id: string
  contentId: string
  contentType: 'message' | 'moment' | 'video'
  content: string
  reporterId: string
  reporterName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  reviewedAt?: number
  reviewerId?: string
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  onlineUsers: number
  totalMessages: number
  totalGroups: number
  pendingReports: number
  systemHealth: {
    cpu: number
    memory: number
    disk: number
    uptime: number
  }
}

export const useAdminStore = defineStore('admin', () => {
  // 状态
  const users = ref<User[]>([])
  const notifications = ref<SystemNotification[]>([])
  const reports = ref<ContentReport[]>([])
  const systemStats = ref<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalGroups: 0,
    pendingReports: 0,
    systemHealth: {
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 0
    }
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activeUsers = computed(() => 
    users.value.filter(user => user.status === 'active')
  )

  const pendingReports = computed(() => 
    reports.value.filter(report => report.status === 'pending')
  )

  const recentNotifications = computed(() => 
    notifications.value
      .filter(notif => notif.status === 'sent')
      .sort((a, b) => b.sentAt! - a.sentAt!)
      .slice(0, 10)
  )

  // 用户管理
  const loadUsers = async (page = 1, limit = 20, search = '') => {
    try {
      loading.value = true
      
      const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}&search=${search}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('获取用户列表失败')
      
      const data = await response.json()
      users.value = data.users
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('加载用户失败:', err)
    } finally {
      loading.value = false
    }
  }

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('更新用户状态失败')
      
      // 更新本地状态
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex].status = status
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('更新用户状态失败:', err)
      return false
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('删除用户失败')
      
      // 从本地列表中移除
      users.value = users.value.filter(u => u.id !== userId)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('删除用户失败:', err)
      return false
    }
  }

  // 系统通知管理
  const sendSystemNotification = async (notification: Omit<SystemNotification, 'id' | 'status' | 'createdAt' | 'sentAt'>) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(notification)
      })
      
      if (!response.ok) throw new Error('发送通知失败')
      
      const data = await response.json()
      
      // 添加到本地列表
      notifications.value.unshift({
        ...notification,
        id: data.id,
        status: 'sent',
        createdAt: Date.now(),
        sentAt: Date.now()
      })
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('发送通知失败:', err)
      throw err
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('获取通知列表失败')
      
      const data = await response.json()
      notifications.value = data.notifications
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('加载通知失败:', err)
    }
  }

  // 内容审核管理
  const loadReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('获取举报列表失败')
      
      const data = await response.json()
      reports.value = data.reports
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('加载举报失败:', err)
    }
  }

  const reviewReport = async (reportId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ action, reason })
      })
      
      if (!response.ok) throw new Error('审核失败')
      
      // 更新本地状态
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        reports.value[reportIndex].status = action === 'approve' ? 'approved' : 'rejected'
        reports.value[reportIndex].reviewedAt = Date.now()
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('审核失败:', err)
      return false
    }
  }

  // 系统统计
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('获取系统统计失败')
      
      const data = await response.json()
      systemStats.value = data.stats
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('加载系统统计失败:', err)
    }
  }

  // 系统健康检查
  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('获取系统健康状态失败')
      
      const data = await response.json()
      systemStats.value.systemHealth = data.health
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('检查系统健康失败:', err)
    }
  }

  // 综合数据加载
  const loadDashboardData = async () => {
    try {
      loading.value = true
      
      await Promise.all([
        loadSystemStats(),
        loadUsers(1, 10),
        loadNotifications(),
        loadReports(),
        checkSystemHealth()
      ])
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载仪表板数据失败'
      console.error('加载仪表板数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 清理错误状态
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    users,
    notifications,
    reports,
    systemStats,
    loading,
    error,
    
    // 计算属性
    activeUsers,
    pendingReports,
    recentNotifications,
    
    // 方法
    loadUsers,
    updateUserStatus,
    deleteUser,
    sendSystemNotification,
    loadNotifications,
    loadReports,
    reviewReport,
    loadSystemStats,
    checkSystemHealth,
    loadDashboardData,
    clearError
  }
})

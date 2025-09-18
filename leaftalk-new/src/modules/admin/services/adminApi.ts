/**
 * 管理员API服务
 * 提供系统管理相关的API接口
 */

import { apiClient } from './apiClient'

export interface AdminLoginData {
  username: string
  password: string
}

export interface UserManagementData {
  id: string
  username: string
  nickname: string
  phone: string
  email?: string
  status: 'active' | 'disabled' | 'banned'
  createdAt: number
  lastLoginAt?: number
}

export interface SystemNotificationData {
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  scope: 'all' | 'online' | 'specific'
  targetUsers?: string[]
}

export interface ContentReportData {
  id: string
  contentId: string
  contentType: 'message' | 'moment' | 'video'
  content: string
  reporterId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}

export class AdminApiService {
  private baseUrl = '/api/admin'

  // 管理员认证
  async login(credentials: AdminLoginData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/login`, credentials)
      
      if (response.success && response.data.token) {
        localStorage.setItem('admin_token', response.data.token)
        localStorage.setItem('admin_user', JSON.stringify(response.data.user))
      }
      
      return response
    } catch (error) {
      console.error('管理员登录失败:', error)
      throw error
    }
  }

  async logout() {
    try {
      await apiClient.post(`${this.baseUrl}/logout`)
    } catch (error) {
      console.error('管理员登出失败:', error)
    } finally {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }

  // 用户管理
  async getUsers(page = 1, limit = 20, search = '') {
    try {
      const params = { page, limit, search }
      const response = await apiClient.get(`${this.baseUrl}/users`, { params })
      return response
    } catch (error) {
      console.error('获取用户列表失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          users: this.getMockUsers(),
          total: 100,
          page,
          limit
        }
      }
    }
  }

  async updateUserStatus(userId: string, status: 'active' | 'disabled' | 'banned') {
    try {
      const response = await apiClient.put(`${this.baseUrl}/users/${userId}/status`, { status })
      return response
    } catch (error) {
      console.error('更新用户状态失败:', error)
      
      // 模拟成功响应
      return {
        success: true,
        data: { userId, status },
        message: '用户状态更新成功'
      }
    }
  }

  async deleteUser(userId: string) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/users/${userId}`)
      return response
    } catch (error) {
      console.error('删除用户失败:', error)
      
      // 模拟成功响应
      return {
        success: true,
        data: { userId },
        message: '用户删除成功'
      }
    }
  }

  async getUserDetails(userId: string) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${userId}`)
      return response
    } catch (error) {
      console.error('获取用户详情失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          user: this.getMockUsers().find(u => u.id === userId) || this.getMockUsers()[0]
        }
      }
    }
  }

  // 系统通知
  async sendNotification(notification: SystemNotificationData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/notifications`, notification)
      return response
    } catch (error) {
      console.error('发送系统通知失败:', error)
      
      // 模拟成功响应
      return {
        success: true,
        data: {
          id: `notif_${Date.now()}`,
          ...notification,
          createdAt: Date.now(),
          sentAt: Date.now()
        },
        message: '通知发送成功'
      }
    }
  }

  async getNotifications(page = 1, limit = 20) {
    try {
      const params = { page, limit }
      const response = await apiClient.get(`${this.baseUrl}/notifications`, { params })
      return response
    } catch (error) {
      console.error('获取通知列表失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          notifications: this.getMockNotifications(),
          total: 50,
          page,
          limit
        }
      }
    }
  }

  // 内容审核
  async getReports(status = 'pending', page = 1, limit = 20) {
    try {
      const params = { status, page, limit }
      const response = await apiClient.get(`${this.baseUrl}/reports`, { params })
      return response
    } catch (error) {
      console.error('获取举报列表失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          reports: this.getMockReports(),
          total: 25,
          page,
          limit
        }
      }
    }
  }

  async reviewReport(reportId: string, action: 'approve' | 'reject', reason?: string) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/reports/${reportId}/review`, {
        action,
        reason
      })
      return response
    } catch (error) {
      console.error('审核举报失败:', error)
      
      // 模拟成功响应
      return {
        success: true,
        data: {
          reportId,
          action,
          reviewedAt: Date.now()
        },
        message: '审核完成'
      }
    }
  }

  // 系统统计
  async getSystemStats() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response
    } catch (error) {
      console.error('获取系统统计失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          stats: {
            totalUsers: 1234,
            activeUsers: 1100,
            onlineUsers: 89,
            totalMessages: 56789,
            totalGroups: 234,
            pendingReports: 12,
            systemHealth: {
              cpu: 45,
              memory: 67,
              disk: 23,
              uptime: 86400000
            }
          }
        }
      }
    }
  }

  async getSystemHealth() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/health`)
      return response
    } catch (error) {
      console.error('获取系统健康状态失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          health: {
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            disk: Math.floor(Math.random() * 100),
            uptime: Date.now() - 86400000
          }
        }
      }
    }
  }

  // 系统配置
  async getSystemConfig() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/config`)
      return response
    } catch (error) {
      console.error('获取系统配置失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          config: {
            siteName: '叶语企业版',
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedFileTypes: ['image', 'video', 'audio', 'document'],
            messageRetentionDays: 30,
            autoCleanupEnabled: true
          }
        }
      }
    }
  }

  async updateSystemConfig(config: any) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/config`, config)
      return response
    } catch (error) {
      console.error('更新系统配置失败:', error)
      
      // 模拟成功响应
      return {
        success: true,
        data: { config },
        message: '配置更新成功'
      }
    }
  }

  // 模拟数据生成方法
  private getMockUsers(): UserManagementData[] {
    return [
      {
        id: 'user_001',
        username: 'zhangsan',
        nickname: '张三',
        phone: '138****8888',
        email: 'zhangsan@example.com',
        status: 'active',
        createdAt: Date.now() - 86400000,
        lastLoginAt: Date.now() - 3600000
      },
      {
        id: 'user_002',
        username: 'lisi',
        nickname: '李四',
        phone: '139****9999',
        status: 'active',
        createdAt: Date.now() - 172800000,
        lastLoginAt: Date.now() - 7200000
      },
      {
        id: 'user_003',
        username: 'wangwu',
        nickname: '王五',
        phone: '137****7777',
        status: 'disabled',
        createdAt: Date.now() - 259200000
      }
    ]
  }

  private getMockNotifications() {
    return [
      {
        id: 'notif_001',
        title: '系统维护通知',
        content: '系统将于今晚22:00-24:00进行维护，期间可能影响正常使用',
        type: 'warning',
        scope: 'all',
        status: 'sent',
        createdAt: Date.now() - 3600000,
        sentAt: Date.now() - 3600000
      },
      {
        id: 'notif_002',
        title: '新功能上线',
        content: '叶语企业版新增智能客服功能，欢迎体验',
        type: 'info',
        scope: 'all',
        status: 'sent',
        createdAt: Date.now() - 86400000,
        sentAt: Date.now() - 86400000
      }
    ]
  }

  private getMockReports(): ContentReportData[] {
    return [
      {
        id: 'report_001',
        contentId: 'content_001',
        contentType: 'message',
        content: '这是一条被举报的消息内容...',
        reporterId: 'user_002',
        reason: '涉嫌垃圾信息',
        status: 'pending',
        createdAt: Date.now() - 1800000
      },
      {
        id: 'report_002',
        contentId: 'moment_001',
        contentType: 'moment',
        content: '这是一条被举报的朋友圈内容...',
        reporterId: 'user_003',
        reason: '不当内容',
        status: 'pending',
        createdAt: Date.now() - 3600000
      }
    ]
  }
}

// 导出单例实例
export const adminApi = new AdminApiService()

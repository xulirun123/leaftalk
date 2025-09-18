/**
 * 设置相关API
 */

import { apiClient } from '../../../shared/services/apiClient'

// 隐私设置API
export const privacyAPI = {
  // 获取隐私设置
  async getSettings() {
    try {
      const response = await apiClient.get('/user/privacy-settings')
      return response
    } catch (error) {
      console.error('获取隐私设置失败:', error)
      return {
        data: {
          success: false,
          error: '获取隐私设置失败'
        }
      }
    }
  },

  // 更新隐私设置
  async updateSettings(settings: any) {
    try {
      const response = await apiClient.put('/user/privacy-settings', settings)
      return response
    } catch (error) {
      console.error('更新隐私设置失败:', error)
      throw error
    }
  }
}

// 通用设置API
export const settingsAPI = {
  // 获取用户设置
  async getUserSettings() {
    try {
      const response = await apiClient.get('/user/settings')
      return response
    } catch (error) {
      console.error('获取用户设置失败:', error)
      return {
        data: {
          success: false,
          error: '获取用户设置失败'
        }
      }
    }
  },

  // 更新用户设置
  async updateUserSettings(settings: any) {
    try {
      const response = await apiClient.put('/user/settings', settings)
      return response
    } catch (error) {
      console.error('更新用户设置失败:', error)
      throw error
    }
  },

  // 获取设置 (别名方法)
  async getSettings() {
    return this.getUserSettings()
  },

  // 更新设置 (别名方法)
  async updateSettings(settings: any) {
    return this.updateUserSettings(settings)
  }
}

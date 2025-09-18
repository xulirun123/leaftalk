/**
 * 隐私设置数据存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { privacyAPI } from '../services/api'

export interface PrivacySettings {
  // 朋友权限
  needVerification: boolean
  recommendFriends: boolean
  phoneSearchable: boolean
  yeyuIdSearchable: boolean
  
  // 朋友圈权限
  momentsVisibleRange: 'all' | 'recent_3_days' | 'recent_week' | 'recent_month' | 'recent_3_months' | 'recent_6_months'
  momentsBlacklist: string[] // 不让他看我的朋友圈
  momentsWhitelist: string[] // 不看他的朋友圈
  
  // 个人信息权限
  allowStrangerPhotos: boolean
  showRealName: boolean
  showPhone: boolean
  showEmail: boolean
  showRegion: boolean
  showSignature: boolean
  
  // 位置权限
  shareLocation: boolean
  locationAccuracy: 'precise' | 'approximate' | 'city_only'
  
  // 其他权限
  allowDataCollection: boolean
  allowPersonalization: boolean
  allowThirdPartySharing: boolean
}

export const usePrivacyStore = defineStore('privacy', () => {
  // 默认隐私设置
  const defaultSettings: PrivacySettings = {
    needVerification: true,
    recommendFriends: true,
    phoneSearchable: true,
    yeyuIdSearchable: true,
    momentsVisibleRange: 'recent_3_days',
    momentsBlacklist: [],
    momentsWhitelist: [],
    allowStrangerPhotos: false,
    showRealName: true,
    showPhone: false,
    showEmail: false,
    showRegion: true,
    showSignature: true,
    shareLocation: true,
    locationAccuracy: 'approximate',
    allowDataCollection: true,
    allowPersonalization: true,
    allowThirdPartySharing: false
  }
  
  // 当前隐私设置
  const settings = ref<PrivacySettings>({ ...defaultSettings })
  
  // 初始化设置
  const init = async () => {
    try {
      // 先尝试从API获取设置
      const response = await privacyAPI.getSettings()
      if (response.data.success) {
        const apiSettings = response.data.data
        settings.value = {
          ...defaultSettings,
          phoneSearchable: apiSettings.phoneSearchable,
          yeyuIdSearchable: apiSettings.yeyuIdSearchable,
          // 其他设置保持默认值或从本地存储获取
          needVerification: defaultSettings.needVerification,
          recommendFriends: defaultSettings.recommendFriends,
          momentsVisibleRange: defaultSettings.momentsVisibleRange,
          momentsBlacklist: defaultSettings.momentsBlacklist,
          momentsWhitelist: defaultSettings.momentsWhitelist,
          allowStrangerPhotos: defaultSettings.allowStrangerPhotos,
          showRealName: defaultSettings.showRealName,
          // showOnlineStatus: defaultSettings.showOnlineStatus // 暂时注释掉不存在的属性
        }
        console.log('✅ 隐私设置已从API加载')
        return
      }
    } catch (error) {
      console.warn('⚠️ 从API加载隐私设置失败，使用本地存储:', error)
    }

    // 如果API失败，从本地存储加载
    const savedSettings = localStorage.getItem('privacy_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        settings.value = { ...defaultSettings, ...parsed }
        console.log('✅ 隐私设置已从本地存储加载')
      } catch (error) {
        console.error('❌ 隐私设置加载失败:', error)
        settings.value = { ...defaultSettings }
      }
    } else {
      settings.value = { ...defaultSettings }
    }
  }
  
  // 保存设置
  const saveSettings = async () => {
    try {
      // 保存到API
      await privacyAPI.updateSettings({
        phoneSearchable: settings.value.phoneSearchable,
        yeyuIdSearchable: settings.value.yeyuIdSearchable,
        needVerification: settings.value.needVerification,
        recommendFriends: settings.value.recommendFriends,
        momentsVisibleRange: settings.value.momentsVisibleRange,
        allowStrangerPhotos: settings.value.allowStrangerPhotos,
        showRealName: settings.value.showRealName,
        showPhone: settings.value.showPhone,
        showEmail: settings.value.showEmail,
        showRegion: settings.value.showRegion,
        showSignature: settings.value.showSignature,
        shareLocation: settings.value.shareLocation,
        locationAccuracy: settings.value.locationAccuracy,
        allowDataCollection: settings.value.allowDataCollection,
        allowPersonalization: settings.value.allowPersonalization,
        allowThirdPartySharing: settings.value.allowThirdPartySharing
      })
      console.log('✅ 隐私设置已保存到API')
    } catch (error) {
      console.warn('⚠️ 保存到API失败，使用本地存储:', error)
    }

    try {
      // 同时保存到本地存储作为备份
      localStorage.setItem('privacy_settings', JSON.stringify(settings.value))
      console.log('✅ 隐私设置已保存到本地存储')
    } catch (error) {
      console.error('❌ 隐私设置本地保存失败:', error)
    }
  }
  
  // 更新单个设置
  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    settings.value[key] = value
    saveSettings()
  }
  
  // 批量更新设置
  const updateSettings = (newSettings: Partial<PrivacySettings>) => {
    Object.assign(settings.value, newSettings)
    saveSettings()
  }
  
  // 重置为默认设置
  const resetToDefault = () => {
    settings.value = { ...defaultSettings }
    saveSettings()
  }
  
  // 朋友圈可见范围选项
  const momentsRangeOptions = [
    { value: 'all', label: '全部' },
    { value: 'recent_3_days', label: '最近三天' },
    { value: 'recent_week', label: '最近一周' },
    { value: 'recent_month', label: '最近一个月' },
    { value: 'recent_3_months', label: '最近三个月' },
    { value: 'recent_6_months', label: '最近半年' }
  ]
  
  // 位置精度选项
  const locationAccuracyOptions = [
    { value: 'precise', label: '精确位置' },
    { value: 'approximate', label: '大概位置' },
    { value: 'city_only', label: '仅城市' }
  ]
  
  // 计算属性
  const momentsRangeLabel = computed(() => {
    const option = momentsRangeOptions.find(opt => opt.value === settings.value.momentsVisibleRange)
    return option?.label || '最近三天'
  })
  
  const locationAccuracyLabel = computed(() => {
    const option = locationAccuracyOptions.find(opt => opt.value === settings.value.locationAccuracy)
    return option?.label || '大概位置'
  })
  
  // 朋友圈黑白名单管理
  const addToMomentsBlacklist = (userId: string) => {
    if (!settings.value.momentsBlacklist.includes(userId)) {
      settings.value.momentsBlacklist.push(userId)
      saveSettings()
    }
  }
  
  const removeFromMomentsBlacklist = (userId: string) => {
    const index = settings.value.momentsBlacklist.indexOf(userId)
    if (index > -1) {
      settings.value.momentsBlacklist.splice(index, 1)
      saveSettings()
    }
  }
  
  const addToMomentsWhitelist = (userId: string) => {
    if (!settings.value.momentsWhitelist.includes(userId)) {
      settings.value.momentsWhitelist.push(userId)
      saveSettings()
    }
  }
  
  const removeFromMomentsWhitelist = (userId: string) => {
    const index = settings.value.momentsWhitelist.indexOf(userId)
    if (index > -1) {
      settings.value.momentsWhitelist.splice(index, 1)
      saveSettings()
    }
  }
  
  // 检查用户是否在黑名单
  const isInMomentsBlacklist = (userId: string) => {
    return settings.value.momentsBlacklist.includes(userId)
  }
  
  // 检查用户是否在白名单
  const isInMomentsWhitelist = (userId: string) => {
    return settings.value.momentsWhitelist.includes(userId)
  }
  
  // 获取隐私设置摘要
  const getPrivacySummary = () => {
    return {
      friendVerification: settings.value.needVerification ? '需要验证' : '无需验证',
      phoneSearch: settings.value.phoneSearchable ? '允许' : '不允许',
      momentsRange: momentsRangeLabel.value,
      blacklistCount: settings.value.momentsBlacklist.length,
      whitelistCount: settings.value.momentsWhitelist.length,
      strangerPhotos: settings.value.allowStrangerPhotos ? '允许' : '不允许',
      locationSharing: settings.value.shareLocation ? '允许' : '不允许'
    }
  }
  
  return {
    settings,
    momentsRangeOptions,
    locationAccuracyOptions,
    momentsRangeLabel,
    locationAccuracyLabel,
    init,
    saveSettings,
    updateSetting,
    updateSettings,
    resetToDefault,
    addToMomentsBlacklist,
    removeFromMomentsBlacklist,
    addToMomentsWhitelist,
    removeFromMomentsWhitelist,
    isInMomentsBlacklist,
    isInMomentsWhitelist,
    getPrivacySummary
  }
})

<template>
  <div class="privacy">
    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 朋友权限 -->
      <div class="settings-section">
        <div class="section-title">朋友权限</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>加我为朋友时需要验证</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.needVerification ?? true"
            on-text="开启"
            off-text="关闭"
            @update:model-value="toggleVerification"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>向我推荐可能认识的人</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.recommendFriends ?? true"
            on-text="开启"
            off-text="关闭"
            @update:model-value="toggleRecommendFriends"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>可通过手机号搜索到我</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.phoneSearchable ?? true"
            on-text="开启"
            off-text="关闭"
            @update:model-value="togglePhoneSearch"
          />
        </div>
      </div>

      <!-- 朋友圈权限 -->
      <div class="settings-section">
        <div class="section-title">朋友圈权限</div>
        <div class="setting-item" @click="setMomentsPrivacy">
          <div class="setting-info">
            <span>允许朋友查看朋友圈的范围</span>
            <span class="setting-value">{{ privacyStore.momentsRangeLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setMomentsBlacklist">
          <div class="setting-info">
            <span>不让他看我的朋友圈</span>
            <span class="setting-value">{{ privacyStore.settings.momentsBlacklist.length }}人</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setMomentsWhitelist">
          <div class="setting-info">
            <span>不看他的朋友圈</span>
            <span class="setting-value">{{ privacyStore.settings.momentsWhitelist.length }}人</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 个人信息权限 -->
      <div class="settings-section">
        <div class="section-title">个人信息权限</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>允许陌生人查看十张照片</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.allowStrangerPhotos ?? false"
            on-text="开启"
            off-text="关闭"
            @update:model-value="toggleStrangerPhotos"
          />
        </div>
        <div class="setting-item" @click="setPersonalInfoPrivacy">
          <div class="setting-info">
            <span>个人信息与权限</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 通讯录权限 -->
      <div class="settings-section">
        <div class="section-title">通讯录权限</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>通过手机号搜索到我</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.phoneSearchable ?? true"
            on-text="开启"
            off-text="关闭"
            @update:model-value="togglePhoneSearch"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>通过叶语号搜索到我</span>
          </div>
          <ToggleSwitch
            :model-value="privacyStore.settings?.yeyuIdSearchable ?? true"
            on-text="开启"
            off-text="关闭"
            @update:model-value="toggleYeyuIdSearch"
          />
        </div>
      </div>

      <!-- 其他 -->
      <div class="settings-section">
        <div class="section-title">其他</div>
        <div class="setting-item" @click="setLocationPrivacy">
          <div class="setting-info">
            <span>位置信息</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setDataPrivacy">
          <div class="setting-info">
            <span>个人信息收集清单</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivacyStore } from '../../../stores/privacy'
import ToggleSwitch from '../../../shared/components/common/ToggleSwitch.vue'

const router = useRouter()
const privacyStore = usePrivacyStore()

const goBack = () => {
  router.back()
}

// 切换开关
const toggleVerification = (value: boolean) => {
  privacyStore.updateSetting('needVerification', value)
}

const toggleRecommendFriends = (value: boolean) => {
  privacyStore.updateSetting('recommendFriends', value)
}

const togglePhoneSearch = (value: boolean) => {
  privacyStore.updateSetting('phoneSearchable', value)
}

const toggleStrangerPhotos = (value: boolean) => {
  privacyStore.updateSetting('allowStrangerPhotos', value)
}

const toggleYeyuIdSearch = (value: boolean) => {
  privacyStore.updateSetting('yeyuIdSearchable', value)
}

// 页面跳转
const setAddMeWay = () => {
  console.log('设置加好友方式')
  // 这里可以添加加好友方式设置页面
}

const setMomentsPrivacy = () => {
  router.push('/settings/moments-privacy')
}

const setMomentsBlacklist = () => {
  router.push('/settings/select-friends?type=blacklist')
}

const setMomentsWhitelist = () => {
  router.push('/settings/select-friends?type=whitelist')
}

const setPersonalInfoPrivacy = () => {
  router.push('/settings/personal-info-privacy')
}

const setLocationPrivacy = () => {
  router.push('/settings/personal-info-privacy')
}

const setDataPrivacy = () => {
  console.log('查看个人信息收集清单')
  // 这里可以添加数据收集清单页面
}

onMounted(() => {
  privacyStore.init()
})
</script>

<style scoped>
.privacy {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.settings-content {
  position: absolute;
  top: 0; /* 让第一项与导航栏重合 */
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
  overflow-y: auto;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 13px;
  color: #666;
  font-weight: normal;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 13px;
  color: #333;
}

.setting-value {
  font-size: 13px;
  color: #666;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}
</style>

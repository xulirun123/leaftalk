<template>
  <div class="friend-permissions">


    <!-- 内容区域（按你的UI规范精简重排） -->
    <div class="content">
      <!-- 第一项：加我为好友时需要验证（48px，高；与顶部导航间距5px） -->
      <div class="cell">
        <span class="label yy-function-item-text">加我为好友时需要验证</span>
        <div class="switch">
          <input type="checkbox" id="verify-switch" v-model="requireVerification" @change="updatePermission('verification', requireVerification)">
          <label for="verify-switch" class="switch-label"></label>
        </div>
      </div>

      <!-- 朋友权限文本分隔（25px，高，背景 #E5E5E5） -->
      <div class="section-divider">朋友权限</div>

      <!-- 朋友圈（48px高） -->
      <div class="cell" @click="setMomentsPrivacy">
        <span class="label yy-function-item-text">朋友圈</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
      </div>

      <div class="spacer-5"></div>

      <!-- 通讯录黑名单（48px，高） -->
      <div class="cell" @click="goBlacklist">
        <span class="label yy-function-item-text">通讯录黑名单</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()



// 权限设置
const allowPhoneAdd = ref(true)
const allowYeyuIdAdd = ref(true)
const allowGroupAdd = ref(true)
const allowQRAdd = ref(true)
const allowRecommend = ref(true)
const requireVerification = ref(false)

// 朋友圈相关
const momentsPrivacy = ref('all') // all, friends, custom
const blockedFromMomentsCount = ref(0)
const hiddenMomentsCount = ref(0)

const momentsPrivacyText = computed(() => {
  switch (momentsPrivacy.value) {
    case 'all':
      return '所有人'
    case 'friends':
      return '仅朋友'
    case 'custom':
      return '自定义'
    default:
      return '所有人'
  }
})

const goBack = () => {
  router.back()
}

const setMomentsPrivacy = () => {
  router.push('/settings/moments-privacy')
}

const goBlacklist = () => {
  router.push('/blacklist')
}


const updatePermission = async (type: string, value: boolean) => {
  try {
    // 这里应该调用API保存权限设置
    console.log(`更新权限设置: ${type} = ${value}`)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))

    // 保存到本地存储
    localStorage.setItem(`yeyu_permission_${type}`, value.toString())

    appStore.showToast('权限设置已更新', 'success')

  } catch (error) {
    console.error('更新权限设置失败:', error)
    appStore.showToast('设置失败，请重试', 'error')
  }
}

const loadPermissions = () => {
  // 从本地存储加载权限设置
  const permissions = [
    { key: 'phone', ref: allowPhoneAdd },
    { key: 'yeyuId', ref: allowYeyuIdAdd },
    { key: 'group', ref: allowGroupAdd },
    { key: 'qr', ref: allowQRAdd },
    { key: 'recommend', ref: allowRecommend },
    { key: 'verification', ref: requireVerification }
  ]

  permissions.forEach(({ key, ref: permissionRef }) => {
    const saved = localStorage.getItem(`yeyu_permission_${key}`)
    if (saved !== null) {
      permissionRef.value = saved === 'true'
    }
  })

  // 加载朋友圈设置
  const savedPrivacy = localStorage.getItem('yeyu_moments_privacy')
  if (savedPrivacy) {
    momentsPrivacy.value = savedPrivacy
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.friend-permissions {
  min-height: 100vh;
  background: #E5E5E5;
}

.content {
  margin-top: 5px; /* 与顶部导航栏间距 5px */
}

.permission-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.permission-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.permission-desc {
  font-size: 14px;
  color: #666;
}

.permission-switch {
  position: relative;
}

.permission-switch input[type="checkbox"] {
  display: none;
}

.switch-label {
  display: block;
  width: 50px;
  height: 30px;
  background: #ddd;
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
}

.switch-label::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.permission-switch input[type="checkbox"]:checked + .switch-label {
  background: #07c160;
}

.permission-switch input[type="checkbox"]:checked + .switch-label::after {
  transform: translateX(20px);
}

/* 简洁版列表与分隔样式 */
.section-divider { height: 25px; background: #E5E5E5; color: #666; font-size: 13px; display: flex; align-items: center; padding: 0 16px; }
.list { background: #fff; margin: 12px 16px; border-radius: 12px; overflow: hidden; }
.cell { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px; border-bottom: 1px solid #f0f0f0; background: #fff; }
.cell:last-child { border-bottom: none; }
.spacer-5 { height: 5px; }
.label {}
.switch { position: relative; }
.switch input[type="checkbox"] { display: none; }
.switch .switch-label { display: block; width: 50px; height: 30px; background: #ddd; border-radius: 15px; cursor: pointer; transition: background-color 0.3s; position: relative; }
.switch .switch-label::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; background: white; border-radius: 50%; transition: transform 0.3s; }
.switch input[type="checkbox"]:checked + .switch-label { background: #07c160; }
.switch input[type="checkbox"]:checked + .switch-label::after { transform: translateX(20px); }

</style>

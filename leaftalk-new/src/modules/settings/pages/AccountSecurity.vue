<template>
  <div class="account-security">
    <!-- 账号安全功能列表 -->
    <div class="security-list">
      <!-- 修改叶语密码 -->
      <div class="security-item" @click="goToChangePassword">
        <span class="item-text">修改叶语密码</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <!-- 修改支付密码 -->
      <div class="security-item" @click="goToChangePayPassword">
        <span class="item-text">修改支付密码</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <!-- 选择支付密码输入样式 -->
      <div class="security-item" @click="goToPayPasswordStyle">
        <span class="item-text">选择支付密码输入样式</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到修改叶语密码页面
const goToChangePassword = () => {
  router.push('/settings/change-password')
}

// 跳转到修改支付密码选择页面
const goToChangePayPassword = () => {
  router.push('/settings/pay-password-options')
}

// 跳转到选择支付密码输入样式页面
const goToPayPasswordStyle = () => {
  router.push('/settings/pay-password-style')
}
</script>

<style scoped>
.account-security {
  height: 100vh;
  background: #e5e5e5;
  overflow: hidden;
}

.security-list {
  background: white;
}

.security-item {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
}

.security-item:last-child {
  border-bottom: none;
}

.security-item:active {
  background: #f5f5f5;
}

.item-text {
  font-size: 13px;
  color: #333;
  font-weight: normal;
}
</style>
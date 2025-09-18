<template>
  <div class="pay-password-options">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      :show-back="true"
      @back="router.back()"
    />

    <!-- 选项列表 -->
    <div class="options-list">
      <!-- 修改数字密码 -->
      <div class="option-item" @click="goToChangeNumericPassword">
        <div class="option-icon">
          <iconify-icon icon="heroicons:calculator" width="24" style="color: #07C160;"></iconify-icon>
        </div>
        <div class="option-info">
          <div class="option-title">修改数字密码</div>
          <div class="option-desc">修改6位数字支付密码</div>
        </div>
        <div class="option-arrow">
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 修改手势密码 -->
      <div class="option-item" @click="goToChangeGesturePassword">
        <div class="option-icon">
          <iconify-icon icon="heroicons:finger-print" width="24" style="color: #07C160;"></iconify-icon>
        </div>
        <div class="option-info">
          <div class="option-title">修改手势密码</div>
          <div class="option-desc">修改手势解锁密码</div>
        </div>
        <div class="option-arrow">
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="tips-section">
      <div class="tips-text">
        <iconify-icon icon="heroicons:information-circle" width="16" style="color: #999; margin-right: 6px;"></iconify-icon>
        为了您的资金安全，建议同时设置数字密码和手势密码
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 跳转到修改数字密码页面
const goToChangeNumericPassword = () => {
  router.push('/settings/change-pay-password')
}

// 跳转到修改手势密码页面
const goToChangeGesturePassword = () => {
  router.push('/settings/change-gesture-password')
}
</script>

<style scoped>
.pay-password-options {
  height: 100vh;
  background: #e5e5e5;
  display: flex;
  flex-direction: column;
}



.options-list {
  margin-top: 16px;
  background: white;
  border-radius: 8px;
  margin-left: 16px;
  margin-right: 16px;
  overflow: hidden;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:active {
  background: #f5f5f5;
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.option-info {
  flex: 1;
}

.option-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 13px;
  color: #666;
}

.option-arrow {
  margin-left: 8px;
}

.tips-section {
  margin-top: 24px;
  padding: 0 16px;
}

.tips-text {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  line-height: 1.4;
}
</style>

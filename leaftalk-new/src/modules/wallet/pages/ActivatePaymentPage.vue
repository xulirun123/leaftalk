<template>
  <div class="activate-payment-page">
    <!-- 主内容 -->
    <div class="content">
      <!-- 欢迎信息 -->
      <div class="welcome-section">
        <iconify-icon icon="heroicons:wallet" width="48" class="wallet-icon"></iconify-icon>
        <h2 class="welcome-title">开通叶语支付</h2>
        <p class="welcome-desc">完成以下步骤，即可使用转账、红包、充值等功能</p>
      </div>

      <!-- 开通步骤 -->
      <div class="steps-section">
        <div
          class="step-item"
          :class="{ completed: step1Completed, active: currentStep === 1 }"
          @click="!step1Completed && goToRealNameVerification()"
        >
          <div class="step-number">
            <iconify-icon v-if="step1Completed" icon="heroicons:check" width="20"></iconify-icon>
            <span v-else>1</span>
          </div>
          <div class="step-content">
            <h3 class="step-title">实名认证</h3>
            <p class="step-desc">上传身份证，验证真实身份</p>
            <div v-if="step1Completed" class="step-status">
              <iconify-icon icon="heroicons:check-circle" width="16" class="check-icon"></iconify-icon>
              <span>已完成</span>
            </div>
          </div>
          <iconify-icon
            v-if="!step1Completed"
            icon="heroicons:chevron-right"
            width="20"
            class="arrow-icon"
          ></iconify-icon>
        </div>

        <div
          class="step-item"
          :class="{ completed: step2Completed, active: currentStep === 2, disabled: !step1Completed }"
          @click="!step2Completed && step1Completed && goToSetPayPassword()"
        >
          <div class="step-number">
            <iconify-icon v-if="step2Completed" icon="heroicons:check" width="20"></iconify-icon>
            <span v-else>2</span>
          </div>
          <div class="step-content">
            <h3 class="step-title">设置支付密码</h3>
            <p class="step-desc">6位数字密码，用于支付验证</p>
            <div v-if="step2Completed" class="step-status">
              <iconify-icon icon="heroicons:check-circle" width="16" class="check-icon"></iconify-icon>
              <span>已完成</span>
            </div>
          </div>
          <iconify-icon
            v-if="!step2Completed && step1Completed"
            icon="heroicons:chevron-right"
            width="20"
            class="arrow-icon"
          ></iconify-icon>
        </div>

        <div
          class="step-item optional"
          :class="{ completed: step3Completed, active: currentStep === 3 }"
          @click="goToBindBankCard()"
        >
          <div class="step-number">
            <iconify-icon v-if="step3Completed" icon="heroicons:check" width="20"></iconify-icon>
            <span v-else>3</span>
          </div>
          <div class="step-content">
            <h3 class="step-title">绑定银行卡 <span class="optional-tag">可选</span></h3>
            <p class="step-desc">用于提现到银行卡</p>
            <div v-if="step3Completed" class="step-status">
              <iconify-icon icon="heroicons:check-circle" width="16" class="check-icon"></iconify-icon>
              <span>已绑定 {{ bankCardCount }} 张</span>
            </div>
          </div>
          <iconify-icon
            icon="heroicons:chevron-right"
            width="20"
            class="arrow-icon"
          ></iconify-icon>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="bottom-section">
        <button 
          v-if="allRequiredStepsCompleted" 
          class="complete-btn"
          @click="completeActivation"
        >
          <iconify-icon icon="heroicons:check-circle" width="20"></iconify-icon>
          开通完成，进入钱包
        </button>
        <button 
          v-else 
          class="continue-btn"
          @click="continueNextStep"
        >
          继续完成开通
        </button>

        <p class="tip-text">
          <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
          您的信息将被加密保护，仅用于支付验证
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 步骤完成状态
const step1Completed = ref(false) // 实名认证
const step2Completed = ref(false) // 设置支付密码
const step3Completed = ref(false) // 绑定银行卡
const bankCardCount = ref(0)

// 当前步骤
const currentStep = ref(1)

// 是否完成所有必需步骤
const allRequiredStepsCompleted = computed(() => {
  return step1Completed.value && step2Completed.value
})

// 检查开通状态
const checkActivationStatus = async () => {
  try {
    // 检查实名认证状态
    const response = await fetch('http://localhost:8893/api/user/verification-status', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.isVerified) {
        step1Completed.value = true
        step2Completed.value = true // 实名认证包含了支付密码设置
        currentStep.value = 3
      } else {
        currentStep.value = 1
      }
    } else {
      currentStep.value = 1
    }

    // 检查银行卡绑定状态（可选）
    // TODO: 实现银行卡API后取消注释
  } catch (error) {
    console.error('❌ 检查开通状态失败:', error)
  }
}

// 前往实名认证
const goToRealNameVerification = () => {
  router.push('/real-name-verification')
}

// 前往设置支付密码
const goToSetPayPassword = () => {
  if (!step1Completed.value) {
    alert('请先完成实名认证')
    return
  }
  // 实名认证流程中已经包含了支付密码设置
  router.push('/real-name-verification')
}

// 前往绑定银行卡
const goToBindBankCard = () => {
  router.push('/cards')
}

// 继续下一步
const continueNextStep = () => {
  if (!step1Completed.value) {
    goToRealNameVerification()
  } else if (!step2Completed.value) {
    goToSetPayPassword()
  } else {
    goToBindBankCard()
  }
}

// 完成开通
const completeActivation = () => {
  router.push('/wallet')
}

// 页面加载时检查状态
onMounted(() => {
  checkActivationStatus()
})
</script>

<style scoped>
.activate-payment-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

/* 主内容 */
.content {
  flex: 1;
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 欢迎信息 */
.welcome-section {
  text-align: center;
  padding: 16px 0 20px;
}

.wallet-icon {
  color: #07C160;
  margin-bottom: 12px;
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.welcome-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* 步骤列表 */
.steps-section {
  margin-top: 16px;
}

.step-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.step-item:hover:not(.disabled):not(.completed) {
  background: #f8f8f8;
  border-color: #e0e0e0;
}

.step-item.active {
  border-color: #07C160;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.1);
}

.step-item.completed {
  background: #f0f9ff;
  cursor: default;
}

.step-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-item:active:not(.disabled):not(.completed) {
  transform: scale(0.98);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #999;
  flex-shrink: 0;
}

.step-item.active .step-number {
  background: #07C160;
  color: white;
}

.step-item.completed .step-number {
  background: #07C160;
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.optional-tag {
  font-size: 12px;
  color: #999;
  font-weight: 400;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 8px;
}

.step-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.step-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
  color: #07C160;
  font-weight: 500;
}

.check-icon {
  color: #07C160;
}

.arrow-icon {
  color: #ccc;
  flex-shrink: 0;
}

/* 底部按钮 */
.bottom-section {
  margin-top: 20px;
  padding-bottom: 8px;
  text-align: center;
}

.complete-btn,
.continue-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.complete-btn {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: white;
}

.complete-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}

.continue-btn {
  background: white;
  color: #07C160;
  border: 2px solid #07C160;
}

.continue-btn:active {
  transform: scale(0.98);
  background: #f0f9ff;
}

.tip-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}
</style>


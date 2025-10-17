<template>
  <div class="recharge-page">
    <div class="recharge-content">
      <!-- 充值金额选择 -->
      <div class="amount-section">
        <div class="amount-label">充值金额</div>
        <div class="amount-input-wrapper">
          <span class="currency">¥</span>
          <input
            v-model="amount"
            type="number"
            class="amount-input"
            placeholder="请输入充值金额"
            @input="handleAmountInput"
          />
        </div>

        <!-- 快捷金额选择 -->
        <div class="quick-amounts">
          <div
            v-for="quickAmount in quickAmounts"
            :key="quickAmount"
            class="quick-amount-item"
            :class="{ active: amount === quickAmount }"
            @click="amount = quickAmount"
          >
            ¥{{ quickAmount }}
          </div>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div class="payment-method-section">
        <div class="section-title">支付方式</div>
        <div class="payment-methods">
          <!-- 微信支付 -->
          <div
            class="payment-method-item"
            :class="{ active: paymentMethod === 'wechat' }"
            @click="paymentMethod = 'wechat'"
          >
            <div class="method-left">
              <Icon icon="ri:wechat-pay-fill" class="method-icon wechat" />
              <span class="method-name">微信支付</span>
            </div>
            <Icon
              v-if="paymentMethod === 'wechat'"
              icon="heroicons:check-circle-solid"
              class="check-icon"
            />
          </div>

          <!-- 支付宝 -->
          <div
            class="payment-method-item"
            :class="{ active: paymentMethod === 'alipay' }"
            @click="paymentMethod = 'alipay'"
          >
            <div class="method-left">
              <Icon icon="ri:alipay-fill" class="method-icon alipay" />
              <span class="method-name">支付宝</span>
            </div>
            <Icon
              v-if="paymentMethod === 'alipay'"
              icon="heroicons:check-circle-solid"
              class="check-icon"
            />
          </div>
        </div>
      </div>

      <!-- 充值说明 -->
      <div class="tips-section">
        <div class="tip-item">• 充值金额将存入叶语钱包</div>
        <div class="tip-item">• 可用于发红包、转账等功能</div>
        <div class="tip-item">• 支持随时提现到微信/支付宝</div>
      </div>
    </div>

    <!-- 底部充值按钮 -->
    <div class="bottom-bar">
      <button
        class="recharge-btn"
        :disabled="!canRecharge"
        @click="handleRecharge"
      >
        {{ recharging ? '充值中...' : `充值 ¥${amount || 0}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import apiClient from '@/shared/services/apiClient'

const router = useRouter()

// 充值金额
const amount = ref<number | null>(null)

// 快捷金额
const quickAmounts = [10, 50, 100, 200, 500, 1000]

// 支付方式
const paymentMethod = ref<'wechat' | 'alipay'>('wechat')

// 充值中
const recharging = ref(false)

// 是否可以充值
const canRecharge = computed(() => {
  return amount.value && amount.value >= 0.01 && !recharging.value
})

// 处理金额输入
const handleAmountInput = () => {
  if (amount.value && amount.value < 0) {
    amount.value = 0
  }
}

// 充值
const handleRecharge = async () => {
  if (!canRecharge.value) return

  // 检查是否已开通微信支付
  if (paymentMethod.value === 'wechat') {
    const hasWechatPay = await checkWechatPayStatus()
    if (!hasWechatPay) {
      // 提示用户开通微信支付
      showWechatPayGuide()
      return
    }
  }

  recharging.value = true

  try {
    // 调用后端API创建充值订单
    const response = await apiClient.post('/payment/recharge', {
      amount: amount.value,
      paymentMethod: paymentMethod.value,
    })

    if (response.success) {
      const { orderId, paymentParams } = response.data

      // 根据支付方式拉起支付
      if (paymentMethod.value === 'wechat') {
        // 拉起微信支付
        await launchWechatPay(paymentParams)
      } else {
        // 拉起支付宝
        await launchAlipay(paymentParams)
      }
    }
  } catch (error) {
    console.error('❌ 充值失败:', error)
    alert('充值失败，请重试')
  } finally {
    recharging.value = false
  }
}

// 检查微信支付状态
const checkWechatPayStatus = async (): Promise<boolean> => {
  // 检查是否在微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)

  if (!isWechat) {
    alert('请在微信中打开叶语APP进行充值')
    return false
  }

  // TODO: 调用微信JSAPI检查是否已开通微信支付
  // 实际上微信没有直接的API检查，只能在支付时才知道
  // 所以这里返回true，让用户尝试支付
  return true
}

// 显示微信支付开通引导
const showWechatPayGuide = () => {
  const confirmed = confirm(
    '检测到您还未开通微信支付\n\n' +
    '开通步骤：\n' +
    '1. 打开微信\n' +
    '2. 进入"我" → "服务" → "钱包"\n' +
    '3. 点击"添加银行卡"\n' +
    '4. 按提示完成实名认证\n\n' +
    '是否前往开通？'
  )

  if (confirmed) {
    // 跳转到微信钱包页面
    window.location.href = 'weixin://dl/wallet'
  }
}

// 拉起微信支付
const launchWechatPay = async (paymentParams: any) => {
  // 检查是否在微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)

  if (isWechat) {
    // 在微信内，使用JSAPI支付
    if (typeof WeixinJSBridge !== 'undefined') {
      WeixinJSBridge.invoke(
        'getBrandWCPayRequest',
        {
          appId: paymentParams.appId,
          timeStamp: paymentParams.timeStamp,
          nonceStr: paymentParams.nonceStr,
          package: paymentParams.package,
          signType: paymentParams.signType,
          paySign: paymentParams.paySign,
        },
        (res: any) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            // 支付成功
            alert('充值成功！')
            router.back()
          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            // 用户取消支付
            alert('您已取消支付')
          } else if (res.err_msg === 'get_brand_wcpay_request:fail') {
            // 支付失败，可能是未开通微信支付
            handleWechatPayError(res)
          } else {
            // 其他错误
            alert('支付失败，请重试')
          }
        }
      )
    }
  } else {
    // 不在微信内，提示用户
    alert('请在微信中打开叶语APP进行充值')
  }
}

// 处理微信支付错误
const handleWechatPayError = (res: any) => {
  // 检查是否是未开通微信支付
  if (res.err_desc && res.err_desc.includes('未开通')) {
    const confirmed = confirm(
      '检测到您还未开通微信支付\n\n' +
      '开通步骤：\n' +
      '1. 打开微信\n' +
      '2. 进入"我" → "服务" → "钱包"\n' +
      '3. 点击"添加银行卡"\n' +
      '4. 输入银行卡信息完成实名认证\n' +
      '5. 设置6位数支付密码\n\n' +
      '开通后即可使用微信支付功能\n\n' +
      '是否前往开通？'
    )

    if (confirmed) {
      // 跳转到微信钱包页面
      window.location.href = 'weixin://dl/wallet'
    }
  } else {
    alert('支付失败：' + (res.err_desc || '未知错误'))
  }
}

// 拉起支付宝
const launchAlipay = async (paymentParams: any) => {
  // 支付宝支付通常是跳转到支付宝页面
  window.location.href = paymentParams.payUrl
}
</script>

<style scoped>
.recharge-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.recharge-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 充值金额 */
.amount-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 2px solid #07c160;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.currency {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.amount-input::placeholder {
  color: #ccc;
  font-size: 18px;
}

/* 快捷金额 */
.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-amount-item {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-amount-item:active {
  transform: scale(0.95);
}

.quick-amount-item.active {
  border-color: #07c160;
  background: #f0f9ff;
  color: #07c160;
}

/* 支付方式 */
.payment-method-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method-item:active {
  transform: scale(0.98);
}

.payment-method-item.active {
  border-color: #07c160;
  background: #f0f9ff;
}

.method-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.method-icon {
  font-size: 28px;
}

.method-icon.wechat {
  color: #09bb07;
}

.method-icon.alipay {
  color: #1677ff;
}

.method-name {
  font-size: 16px;
  color: #333;
}

.check-icon {
  font-size: 24px;
  color: #07c160;
}

/* 充值说明 */
.tips-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.tip-item {
  font-size: 13px;
  color: #999;
  line-height: 1.8;
}

/* 底部按钮 */
.bottom-bar {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.recharge-btn {
  width: 100%;
  height: 48px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.recharge-btn:active:not(:disabled) {
  transform: scale(0.98);
  background: #06ad56;
}

.recharge-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```


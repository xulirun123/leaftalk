<template>
  <div class="wechat-pay-guide-page">
    <!-- 顶部导航 -->
    <MobileTopBar title="开通微信支付" @back="handleBack" />

    <div class="guide-content">
      <!-- 顶部图标 -->
      <div class="header-section">
        <Icon icon="ri:wechat-pay-fill" class="wechat-icon" />
        <h2 class="title">开通微信支付</h2>
        <p class="subtitle">完成实名认证，即可使用微信支付</p>
      </div>

      <!-- 开通步骤 -->
      <div class="steps-section">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">打开微信钱包</div>
            <div class="step-desc">进入微信 → "我" → "服务" → "钱包"</div>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">添加银行卡</div>
            <div class="step-desc">点击"银行卡" → "添加银行卡"</div>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">填写银行卡信息</div>
            <div class="step-desc">
              <div>• 银行卡号</div>
              <div>• 持卡人姓名（真实姓名）</div>
              <div>• 身份证号（真实身份证）</div>
              <div>• 手机号（银行预留手机号）</div>
            </div>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-title">验证并设置密码</div>
            <div class="step-desc">
              <div>• 输入短信验证码</div>
              <div>• 设置6位数支付密码</div>
            </div>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">5</div>
          <div class="step-content">
            <div class="step-title">开通成功</div>
            <div class="step-desc">返回叶语APP，即可使用微信支付</div>
          </div>
        </div>
      </div>

      <!-- 注意事项 -->
      <div class="tips-section">
        <div class="tips-title">
          <Icon icon="heroicons:information-circle" class="tips-icon" />
          注意事项
        </div>
        <div class="tip-item">
          • 必须使用本人真实信息进行实名认证
        </div>
        <div class="tip-item">
          • 一个身份证只能绑定5个微信账号
        </div>
        <div class="tip-item">
          • 未成年人需要监护人协助开通
        </div>
        <div class="tip-item">
          • 开通后即可享受微信支付的所有功能
        </div>
      </div>

      <!-- 实名认证等级说明 -->
      <div class="level-section">
        <div class="level-title">实名认证等级</div>
        <div class="level-table">
          <div class="level-row header">
            <div class="level-cell">等级</div>
            <div class="level-cell">认证方式</div>
            <div class="level-cell">年累计限额</div>
          </div>
          <div class="level-row">
            <div class="level-cell">Ⅰ类</div>
            <div class="level-cell">身份证信息</div>
            <div class="level-cell">¥10万</div>
          </div>
          <div class="level-row highlight">
            <div class="level-cell">Ⅱ类</div>
            <div class="level-cell">身份证+银行卡</div>
            <div class="level-cell">¥20万</div>
          </div>
          <div class="level-row">
            <div class="level-cell">Ⅲ类</div>
            <div class="level-cell">+人脸识别</div>
            <div class="level-cell">无限额</div>
          </div>
        </div>
        <div class="level-note">
          💡 绑定银行卡即可达到Ⅱ类账户，满足日常使用
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-bar">
      <button class="guide-btn" @click="handleOpenWallet">
        前往微信钱包开通
      </button>
      <button class="secondary-btn" @click="handleBack">
        稍后再说
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

const handleBack = () => {
  router.back()
}

const handleOpenWallet = () => {
  // 检查是否在微信环境
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)

  if (isWechat) {
    // 跳转到微信钱包
    window.location.href = 'weixin://dl/wallet'
  } else {
    alert('请在微信中打开叶语APP')
  }
}
</script>

<style scoped>
.wechat-pay-guide-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.guide-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 头部 */
.header-section {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
}

.wechat-icon {
  font-size: 80px;
  color: #09bb07;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #999;
}

/* 步骤 */
.steps-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.step-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #07c160;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.step-desc > div {
  margin-bottom: 4px;
}

/* 注意事项 */
.tips-section {
  background: #fff7e6;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #fa8c16;
  margin-bottom: 12px;
}

.tips-icon {
  font-size: 20px;
}

.tip-item {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

/* 等级说明 */
.level-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.level-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.level-table {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.level-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr;
}

.level-row.header {
  background: #f5f5f5;
  font-weight: bold;
}

.level-row.highlight {
  background: #f0f9ff;
  color: #07c160;
  font-weight: bold;
}

.level-cell {
  padding: 12px;
  font-size: 13px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.level-cell:last-child {
  border-right: none;
}

.level-row:last-child .level-cell {
  border-bottom: none;
}

.level-note {
  font-size: 13px;
  color: #666;
  text-align: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

/* 底部按钮 */
.bottom-bar {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-btn {
  width: 100%;
  height: 48px;
  background: #09bb07;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-btn:active {
  transform: scale(0.98);
  background: #07a005;
}

.secondary-btn {
  width: 100%;
  height: 44px;
  background: white;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:active {
  transform: scale(0.98);
  background: #f5f5f5;
}
</style>

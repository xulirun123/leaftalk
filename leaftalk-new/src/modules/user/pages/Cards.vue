<template>
  <div class="cards-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">卡包</div>
      <button class="add-btn" @click="addCard">
        <iconify-icon icon="heroicons:plus" width="20" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 卡片列表 -->
    <div class="cards-content">
      <div v-if="cards.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:wallet" width="64" style="color: #ccc;"></iconify-icon>
        <p>暂无卡片</p>
        <p class="empty-tip">点击右上角添加银行卡、会员卡等</p>
      </div>

      <div v-else class="cards-list">
        <!-- 银行卡区域 -->
        <div v-if="bankCards.length > 0" class="card-section">
          <div class="section-title">银行卡</div>
          <div 
            v-for="card in bankCards" 
            :key="card.id"
            class="card-item bank-card"
            @click="openCard(card)"
          >
            <div class="card-icon">
              <iconify-icon icon="heroicons:credit-card" width="24" style="color: white;"></iconify-icon>
            </div>
            <div class="card-info">
              <div class="card-name">{{ card.name }}</div>
              <div class="card-number">**** **** **** {{ card.lastFour }}</div>
            </div>
            <div class="card-balance">
              <div class="balance-label">余额</div>
              <div class="balance-amount">¥{{ formatAmount(card.balance) }}</div>
            </div>
          </div>
        </div>

        <!-- 会员卡区域 -->
        <div v-if="memberCards.length > 0" class="card-section">
          <div class="section-title">会员卡</div>
          <div 
            v-for="card in memberCards" 
            :key="card.id"
            class="card-item member-card"
            @click="openCard(card)"
          >
            <div class="card-icon">
              <iconify-icon icon="heroicons:star" width="24" style="color: white;"></iconify-icon>
            </div>
            <div class="card-info">
              <div class="card-name">{{ card.name }}</div>
              <div class="card-level">{{ card.level }}</div>
            </div>
            <div class="card-points">
              <div class="points-label">积分</div>
              <div class="points-amount">{{ card.points }}</div>
            </div>
          </div>
        </div>

        <!-- 优惠券区域 -->
        <div v-if="coupons.length > 0" class="card-section">
          <div class="section-title">优惠券</div>
          <div 
            v-for="coupon in coupons" 
            :key="coupon.id"
            class="card-item coupon-card"
            @click="openCard(coupon)"
          >
            <div class="card-icon">
              <iconify-icon icon="heroicons:ticket" width="24" style="color: white;"></iconify-icon>
            </div>
            <div class="card-info">
              <div class="card-name">{{ coupon.name }}</div>
              <div class="card-desc">{{ coupon.description }}</div>
            </div>
            <div class="card-status">
              <div class="status-label">{{ getStatusText(coupon.status) }}</div>
              <div class="expire-date">{{ formatDate(coupon.expireDate) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加卡片弹窗 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="hideAddDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">添加卡片</div>
        <div class="card-types">
          <div class="card-type" @click="addBankCard">
            <iconify-icon icon="heroicons:credit-card" width="32" style="color: #07C160;"></iconify-icon>
            <span>银行卡</span>
          </div>
          <div class="card-type" @click="addMemberCard">
            <iconify-icon icon="heroicons:star" width="32" style="color: #FFD700;"></iconify-icon>
            <span>会员卡</span>
          </div>
          <div class="card-type" @click="addCoupon">
            <iconify-icon icon="heroicons:ticket" width="32" style="color: #FF6B6B;"></iconify-icon>
            <span>优惠券</span>
          </div>
        </div>
        <button class="dialog-cancel" @click="hideAddDialog">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const showAddDialog = ref(false)

// 模拟卡片数据
const cards = ref([
  {
    id: '1',
    type: 'bank',
    name: '中国银行储蓄卡',
    lastFour: '8888',
    balance: 12580.50,
    bankCode: 'BOC'
  },
  {
    id: '2',
    type: 'bank',
    name: '招商银行信用卡',
    lastFour: '6666',
    balance: 5000.00,
    bankCode: 'CMB'
  },
  {
    id: '3',
    type: 'member',
    name: '星巴克会员卡',
    level: '金卡会员',
    points: 1250,
    brand: 'Starbucks'
  },
  {
    id: '4',
    type: 'member',
    name: '京东PLUS会员',
    level: 'PLUS会员',
    points: 3680,
    brand: 'JD'
  },
  {
    id: '5',
    type: 'coupon',
    name: '满100减20优惠券',
    description: '全场通用',
    status: 'available',
    expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '6',
    type: 'coupon',
    name: '免费配送券',
    description: '外卖专用',
    status: 'used',
    expireDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
])

// 分类卡片
const bankCards = computed(() => cards.value.filter(card => card.type === 'bank'))
const memberCards = computed(() => cards.value.filter(card => card.type === 'member'))
const coupons = computed(() => cards.value.filter(card => card.type === 'coupon'))

// 格式化金额
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    available: '可用',
    used: '已使用',
    expired: '已过期'
  }
  return statusMap[status] || '未知'
}

// 方法
const goBack = () => {
  router.back()
}

const addCard = () => {
  showAddDialog.value = true
}

const hideAddDialog = () => {
  showAddDialog.value = false
}

const openCard = (card: any) => {
  console.log('打开卡片:', card)
  appStore.showToast(`查看${card.name}`, 'info')
}

const addBankCard = () => {
  hideAddDialog()
  appStore.showToast('添加银行卡功能开发中', 'info')
}

const addMemberCard = () => {
  hideAddDialog()
  appStore.showToast('添加会员卡功能开发中', 'info')
}

const addCoupon = () => {
  hideAddDialog()
  appStore.showToast('添加优惠券功能开发中', 'info')
}

onMounted(() => {
  console.log('卡包页面已加载')
})
</script>

<style scoped>
.cards-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
}

.back-btn, .add-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.cards-content {
  padding-top: 60px;
  min-height: calc(100vh - 60px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 16px 0 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
}

.card-section {
  margin-bottom: 20px;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.card-item {
  background: white;
  margin: 0 16px 8px;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bank-card .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.member-card .card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.coupon-card .card-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.card-number, .card-level, .card-desc {
  font-size: 14px;
  color: #666;
}

.card-balance, .card-points, .card-status {
  text-align: right;
}

.balance-label, .points-label, .status-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.balance-amount {
  font-size: 18px;
  font-weight: 600;
  color: #07C160;
}

.points-amount {
  font-size: 16px;
  font-weight: 500;
  color: #FFD700;
}

.expire-date {
  font-size: 12px;
  color: #999;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 0 20px;
  max-width: 320px;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
}

.card-types {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.card-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.card-type:hover {
  background: #f8f8f8;
}

.card-type span {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
}

.dialog-cancel {
  width: 100%;
  padding: 12px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}
</style>

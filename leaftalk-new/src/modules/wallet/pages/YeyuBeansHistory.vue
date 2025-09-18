<template>
  <div class="history-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="叶语豆明细" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 余额概览 -->
    <div class="balance-overview">
      <div class="balance-card">
        <div class="balance-amount">{{ currentBeans }}豆</div>
        <div class="balance-label">当前余额</div>
      </div>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-tabs">
      <div 
        v-for="tab in filterTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- 交易记录 -->
    <div class="transaction-list">
      <div 
        v-for="transaction in filteredTransactions"
        :key="transaction.id"
        class="transaction-item"
      >
        <div class="transaction-icon">
          <iconify-icon 
            :icon="getTransactionIcon(transaction.type)" 
            width="24" 
            :style="{ color: getTransactionColor(transaction.type) }"
          />
        </div>
        <div class="transaction-info">
          <div class="transaction-title">{{ transaction.title }}</div>
          <div class="transaction-time">{{ formatTime(transaction.timestamp) }}</div>
        </div>
        <div class="transaction-amount" :class="{ positive: transaction.amount > 0 }">
          {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}豆
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredTransactions.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:document-text" width="48" class="empty-icon"></iconify-icon>
        <p class="empty-text">暂无交易记录</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 当前叶语豆余额
const currentBeans = ref(1280)

// 筛选选项
const activeFilter = ref('all')
const filterTabs = ref([
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' }
])

// 交易记录
const transactions = ref([
  {
    id: '1',
    type: 'recharge',
    title: '充值叶语豆',
    amount: 300,
    timestamp: Date.now() - 3600000
  },
  {
    id: '2',
    type: 'purchase',
    title: '购买表情包',
    amount: -50,
    timestamp: Date.now() - 7200000
  },
  {
    id: '3',
    type: 'gift',
    title: '签到奖励',
    amount: 10,
    timestamp: Date.now() - 86400000
  },
  {
    id: '4',
    type: 'purchase',
    title: '购买主题',
    amount: -100,
    timestamp: Date.now() - 172800000
  },
  {
    id: '5',
    type: 'recharge',
    title: '充值叶语豆',
    amount: 500,
    timestamp: Date.now() - 259200000
  },
  {
    id: '6',
    type: 'gift',
    title: '邀请好友奖励',
    amount: 20,
    timestamp: Date.now() - 345600000
  }
])

// 筛选后的交易记录
const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') {
    return transactions.value
  } else if (activeFilter.value === 'income') {
    return transactions.value.filter(t => t.amount > 0)
  } else {
    return transactions.value.filter(t => t.amount < 0)
  }
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取交易图标
const getTransactionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    recharge: 'heroicons:plus-circle',
    purchase: 'heroicons:shopping-cart',
    gift: 'heroicons:gift',
    refund: 'heroicons:arrow-uturn-left'
  }
  return iconMap[type] || 'heroicons:banknotes'
}

// 获取交易颜色
const getTransactionColor = (type: string) => {
  const colorMap: Record<string, string> = {
    recharge: '#07C160',
    purchase: '#FF6B35',
    gift: '#FFD700',
    refund: '#1677FF'
  }
  return colorMap[type] || '#666'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 86400000) { // 24小时内
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 604800000) { // 7天内
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

onMounted(() => {
  // 加载交易记录
  console.log('加载叶语豆交易记录')
})
</script>

<style scoped>
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 余额概览 */
.balance-overview {
  margin: 67px 16px 20px 16px;
}

.balance-card {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: #8B4513;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 筛选选项 */
.filter-tabs {
  display: flex;
  background: white;
  margin: 0 16px 16px 16px;
  border-radius: 12px;
  padding: 4px;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab.active {
  background: #FFD700;
  color: #8B4513;
}

/* 交易记录 */
.transaction-list {
  flex: 1;
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 50%;
  margin-right: 12px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.transaction-time {
  font-size: 12px;
  color: #999;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
  color: #FF6B35;
}

.transaction-amount.positive {
  color: #07C160;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
  margin: 0;
}
</style>

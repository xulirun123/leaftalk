<template>
  <div class="redpacket-detail">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>红包详情</h1>
    </div>

    <div class="redpacket-info">
      <div class="redpacket-card">
        <div class="redpacket-icon">
          <iconify-icon icon="mdi:gift" class="gift-icon"></iconify-icon>
        </div>
        <div class="redpacket-title">{{ redpacket.message }}</div>
        <div class="redpacket-amount">¥{{ redpacket.totalAmount }}</div>
        <div class="redpacket-status">
          <span v-if="redpacket.status === 'completed'">已被抢完</span>
          <span v-else-if="redpacket.status === 'expired'">已过期</span>
          <span v-else>{{ redpacket.receivedCount }}/{{ redpacket.totalCount }}个红包被领取</span>
        </div>
      </div>
    </div>

    <div class="receive-list">
      <h3>领取记录</h3>
      <div class="receive-item" v-for="record in redpacket.receiveRecords" :key="record.id">
        <div class="user-info">
          <img :src="record.avatar" :alt="record.name" class="avatar" />
          <div class="user-details">
            <div class="name">{{ record.name }}</div>
            <div class="time">{{ formatTime(record.receiveTime) }}</div>
          </div>
        </div>
        <div class="amount">
          ¥{{ record.amount }}
          <span v-if="record.isLuckiest" class="lucky-tag">手气最佳</span>
        </div>
      </div>
      
      <div v-if="redpacket.receiveRecords.length === 0" class="empty-state">
        <iconify-icon icon="mdi:gift-outline" class="empty-icon"></iconify-icon>
        <p>还没有人领取红包</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 模拟红包数据
const redpacket = ref({
  id: '1',
  message: '恭喜发财，大吉大利',
  totalAmount: 100.00,
  totalCount: 10,
  receivedCount: 8,
  status: 'active', // 'active' | 'completed' | 'expired'
  receiveRecords: [
    {
      id: '1',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      amount: 15.88,
      receiveTime: new Date(Date.now() - 1000 * 60 * 5),
      isLuckiest: true
    },
    {
      id: '2',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      amount: 12.34,
      receiveTime: new Date(Date.now() - 1000 * 60 * 10),
      isLuckiest: false
    },
    {
      id: '3',
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      amount: 8.88,
      receiveTime: new Date(Date.now() - 1000 * 60 * 15),
      isLuckiest: false
    },
    {
      id: '4',
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      amount: 20.00,
      receiveTime: new Date(Date.now() - 1000 * 60 * 20),
      isLuckiest: false
    },
    {
      id: '5',
      name: '钱七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian',
      amount: 6.66,
      receiveTime: new Date(Date.now() - 1000 * 60 * 25),
      isLuckiest: false
    },
    {
      id: '6',
      name: '孙八',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
      amount: 11.11,
      receiveTime: new Date(Date.now() - 1000 * 60 * 30),
      isLuckiest: false
    },
    {
      id: '7',
      name: '周九',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',
      amount: 9.99,
      receiveTime: new Date(Date.now() - 1000 * 60 * 35),
      isLuckiest: false
    },
    {
      id: '8',
      name: '吴十',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu',
      amount: 15.14,
      receiveTime: new Date(Date.now() - 1000 * 60 * 40),
      isLuckiest: false
    }
  ]
})

const goBack = () => {
  router.back()
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}小时前`
  } else {
    return time.toLocaleDateString()
  }
}

onMounted(() => {
  // 这里可以根据路由参数加载具体的红包详情
  console.log('红包详情页面加载，红包ID:', route.query.id)
})
</script>

<style scoped>
.redpacket-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(0,0,0,0.1);
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  margin-right: 15px;
  cursor: pointer;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
}

.redpacket-info {
  padding: 30px 20px;
  text-align: center;
}

.redpacket-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 30px 20px;
  backdrop-filter: blur(10px);
}

.redpacket-icon {
  margin-bottom: 15px;
}

.gift-icon {
  font-size: 48px;
  color: #ffd700;
}

.redpacket-title {
  font-size: 18px;
  margin-bottom: 10px;
}

.redpacket-amount {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
}

.redpacket-status {
  font-size: 14px;
  opacity: 0.8;
}

.receive-list {
  background: white;
  color: #333;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  min-height: 400px;
}

.receive-list h3 {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.receive-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.receive-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-details .name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}

.user-details .time {
  font-size: 12px;
  color: #999;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b6b;
  position: relative;
}

.lucky-tag {
  position: absolute;
  top: -8px;
  right: -10px;
  background: #ffd700;
  color: #333;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}
</style>

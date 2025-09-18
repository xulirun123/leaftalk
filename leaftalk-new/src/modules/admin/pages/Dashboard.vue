<template>
  <div class="analytics-dashboard">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>数据分析</h1>
    </div>

    <div class="dashboard-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="card">
          <div class="card-icon">
            <iconify-icon icon="mdi:account-group"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-title">总用户数</div>
            <div class="card-value">{{ stats.totalUsers }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">
            <iconify-icon icon="mdi:message-text"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-title">消息总数</div>
            <div class="card-value">{{ stats.totalMessages }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">
            <iconify-icon icon="mdi:family-tree"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-title">族谱数量</div>
            <div class="card-value">{{ stats.totalGenealogies }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">
            <iconify-icon icon="mdi:account-plus"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-title">今日新增</div>
            <div class="card-value">{{ stats.todayNewUsers }}</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-card">
          <h3>用户增长趋势</h3>
          <div class="chart-placeholder">
            <iconify-icon icon="mdi:chart-line"></iconify-icon>
            <p>图表功能开发中...</p>
          </div>
        </div>

        <div class="chart-card">
          <h3>消息活跃度</h3>
          <div class="chart-placeholder">
            <iconify-icon icon="mdi:chart-bar"></iconify-icon>
            <p>图表功能开发中...</p>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="data-table">
        <h3>最近活动</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>操作</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in recentActivities" :key="activity.id">
                <td>{{ formatTime(activity.timestamp) }}</td>
                <td>{{ activity.userName }}</td>
                <td>{{ activity.action }}</td>
                <td>{{ activity.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const stats = ref({
  totalUsers: 1234,
  totalMessages: 56789,
  totalGenealogies: 89,
  todayNewUsers: 23
})

const recentActivities = ref([
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    userName: '张三',
    action: '注册',
    details: '完成实名认证'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    userName: '李四',
    action: '发送消息',
    details: '在群聊中发送了一条消息'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    userName: '王五',
    action: '创建族谱',
    details: '创建了王氏族谱'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    userName: '赵六',
    action: '加入族谱',
    details: '加入了赵氏族谱'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    userName: '钱七',
    action: '发红包',
    details: '在群聊中发送了红包'
  }
])

const goBack = () => {
  router.back()
}

const formatTime = (time: Date) => {
  return time.toLocaleString('zh-CN')
}

onMounted(() => {
  console.log('数据分析页面已加载')
  // 这里可以加载真实的统计数据
})
</script>

<style scoped>
.analytics-dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  margin-right: 15px;
  cursor: pointer;
  color: #333;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.dashboard-content {
  padding: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-icon {
  font-size: 32px;
  color: #07C160;
  margin-right: 15px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-card h3 {
  margin-bottom: 20px;
  color: #333;
}

.chart-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.chart-placeholder iconify-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.data-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-table h3 {
  margin-bottom: 20px;
  color: #333;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

td {
  color: #666;
}

tr:hover {
  background: #f8f9fa;
}
</style>

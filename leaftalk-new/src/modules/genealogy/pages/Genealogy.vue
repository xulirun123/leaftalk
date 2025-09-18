<template>
  <div class="genealogy-page">
    <!-- 主要内容 -->
    <div class="genealogy-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-prompt">
        <div class="prompt-card">
          <iconify-icon icon="heroicons:arrow-path" width="48" class="prompt-icon spinning"></iconify-icon>
          <h3>正在创建族谱</h3>
          <p>请稍候，正在为您自动创建族谱...</p>
        </div>
      </div>

      <!-- 未认证提示 -->
      <div v-else-if="!isVerified" class="verification-prompt">
        <div class="prompt-card">
          <iconify-icon icon="heroicons:identification" width="64" class="prompt-icon"></iconify-icon>
          <h3>需要实名认证</h3>
          <p>族谱功能需要完成实名认证后才能使用</p>
          <button class="verify-btn" @click="goToVerification">
            立即认证
          </button>
        </div>
      </div>

      <!-- 已认证用户的族谱列表 -->
      <div v-else class="genealogy-list">
        <div class="section-header">
          <h3>我的族谱</h3>
        </div>

        <div v-if="myGenealogies.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:document-text" width="48" class="empty-icon"></iconify-icon>
          <p>暂无族谱数据</p>
        </div>

        <div v-else class="genealogy-items">
          <div
            v-for="genealogy in myGenealogies"
            :key="genealogy.id"
            class="genealogy-item"
            @click="viewGenealogy(genealogy)"
          >
            <div class="genealogy-icon">
              <iconify-icon icon="heroicons:document-text" width="24" style="color: #07C160;"></iconify-icon>
            </div>
            <div class="genealogy-info">
              <div class="genealogy-name">{{ genealogy.name }}</div>
              <div class="genealogy-desc">{{ genealogy.memberCount }} 位成员 · {{ genealogy.role === 'patriarch' ? '族长' : '成员' }}</div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const myGenealogies = ref([])
const isVerified = ref(false)

// 检查用户是否已实名认证
const checkVerificationStatus = () => {
  // 检查用户是否已实名认证
  const user = appStore.user
  isVerified.value = user && user.verification_status === 'verified'
  console.log('🔍 用户认证状态:', isVerified.value, user)
}

// 自动创建族谱
const autoCreateGenealogy = async () => {
  if (!isVerified.value) return

  loading.value = true
  try {
    console.log('🌳 开始自动创建族谱...')

    // 模拟创建族谱
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 创建示例族谱
    const user = appStore.user
    const surname = user?.real_name?.charAt(0) || '叶'

    myGenealogies.value = [
      {
        id: 'genealogy_main',
        name: `${surname}氏族谱`,
        type: 'main',
        memberCount: 1,
        role: 'patriarch',
        createdAt: new Date().toISOString(),
        description: `${surname}氏家族族谱，记录家族历史与传承`
      }
    ]

    appStore.showToast(`成功创建${surname}氏族谱！`, 'success')
    console.log('✅ 族谱创建成功:', myGenealogies.value)

  } catch (error) {
    console.error('❌ 创建族谱失败:', error)
    appStore.showToast('创建族谱失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

const goToVerification = () => {
  appStore.showToast('实名认证功能开发中', 'info')
  // router.push('/verification')
}

const viewGenealogy = (genealogy: any) => {
  appStore.showToast(`查看${genealogy.name}`, 'info')
  console.log('📖 查看族谱:', genealogy)
}

// 生命周期
onMounted(async () => {
  console.log('🌳 族谱页面加载...')
  checkVerificationStatus()

  if (isVerified.value) {
    await autoCreateGenealogy()
  }
})
</script>

<style scoped>
.genealogy-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.genealogy-content {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.verification-prompt {
  width: 100%;
  max-width: 300px;
}

.prompt-card {
  background: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.prompt-icon {
  color: #07C160;
  margin-bottom: 20px;
}

.prompt-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.prompt-card p {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.verify-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.verify-btn:hover {
  background: #06a94f;
}

.verify-btn:active {
  background: #059441;
}

/* 加载状态 */
.loading-prompt {
  width: 100%;
  max-width: 300px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 族谱列表 */
.genealogy-list {
  padding: 20px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  margin-bottom: 12px;
  color: #ccc;
}

.genealogy-items {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.genealogy-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 42px;
}

.genealogy-item:last-child {
  border-bottom: none;
}

.genealogy-item:hover {
  background: #f8f8f8;
}

.genealogy-item:active {
  background: #f0f0f0;
}

.genealogy-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.genealogy-info {
  flex: 1;
}

.genealogy-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin-bottom: 2px;
}

.genealogy-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.2;
}

.arrow {
  color: #ccc;
}
</style>

<template>
  <div class="games-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">游戏中心</div>
      <button class="search-btn" @click="toggleSearch">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索游戏"
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <!-- 游戏内容 -->
    <div class="games-content">
      <!-- 叶语豆余额 -->
      <div class="beans-card" @click="openBeansDialog">
        <div class="beans-info">
          <div class="beans-icon">
            <iconify-icon icon="heroicons:star" width="24" style="color: #FFD700;"></iconify-icon>
          </div>
          <div class="beans-text">
            <div class="beans-label">叶语豆</div>
            <div class="beans-amount">{{ walletStore.formattedBeansBalance }}</div>
          </div>
        </div>
        <div class="beans-action">
          <span>充值</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 热门游戏 -->
      <div class="game-section">
        <div class="section-header">
          <h3 class="section-title">热门游戏</h3>
          <button class="more-btn" @click="viewAllGames('hot')">更多</button>
        </div>
        
        <div class="game-grid">
          <div 
            v-for="game in hotGames" 
            :key="game.id"
            class="game-item"
            @click="playGame(game)"
          >
            <div class="game-cover">
              <img :src="game.cover" :alt="game.name" />
              <div class="game-overlay">
                <iconify-icon icon="heroicons:play" width="24" style="color: white;"></iconify-icon>
              </div>
            </div>
            <div class="game-info">
              <div class="game-name">{{ game.name }}</div>
              <div class="game-players">{{ game.players }}人在玩</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 休闲游戏 -->
      <div class="game-section">
        <div class="section-header">
          <h3 class="section-title">休闲游戏</h3>
          <button class="more-btn" @click="viewAllGames('casual')">更多</button>
        </div>
        
        <div class="game-list">
          <div 
            v-for="game in casualGames" 
            :key="game.id"
            class="game-row"
            @click="playGame(game)"
          >
            <div class="game-icon">
              <img :src="game.icon" :alt="game.name" />
            </div>
            <div class="game-details">
              <div class="game-name">{{ game.name }}</div>
              <div class="game-desc">{{ game.description }}</div>
              <div class="game-stats">
                <span class="game-rating">⭐ {{ game.rating }}</span>
                <span class="game-size">{{ game.size }}</span>
              </div>
            </div>
            <button class="play-btn" @click.stop="playGame(game)">
              <iconify-icon icon="heroicons:play" width="16" style="color: white;"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 竞技游戏 -->
      <div class="game-section">
        <div class="section-header">
          <h3 class="section-title">竞技游戏</h3>
          <button class="more-btn" @click="viewAllGames('competitive')">更多</button>
        </div>
        
        <div class="game-list">
          <div 
            v-for="game in competitiveGames" 
            :key="game.id"
            class="game-row"
            @click="playGame(game)"
          >
            <div class="game-icon">
              <img :src="game.icon" :alt="game.name" />
            </div>
            <div class="game-details">
              <div class="game-name">{{ game.name }}</div>
              <div class="game-desc">{{ game.description }}</div>
              <div class="game-stats">
                <span class="game-rating">⭐ {{ game.rating }}</span>
                <span class="game-cost">{{ game.cost }}豆/局</span>
              </div>
            </div>
            <button class="play-btn competitive" @click.stop="playGame(game)">
              <iconify-icon icon="heroicons:trophy" width="16" style="color: white;"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏详情弹窗 -->
    <div v-if="showGameDialog" class="dialog-overlay" @click="hideGameDialog">
      <div class="dialog-content game-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedGame?.name }}</h3>
          <button class="close-btn" @click="hideGameDialog">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="game-preview">
          <img :src="selectedGame?.cover || selectedGame?.icon" :alt="selectedGame?.name" />
        </div>

        <div class="game-description">
          <p>{{ selectedGame?.description }}</p>
          <div class="game-meta">
            <div class="meta-item">
              <span class="meta-label">评分：</span>
              <span class="meta-value">⭐ {{ selectedGame?.rating }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">大小：</span>
              <span class="meta-value">{{ selectedGame?.size }}</span>
            </div>
            <div v-if="selectedGame?.cost" class="meta-item">
              <span class="meta-label">费用：</span>
              <span class="meta-value">{{ selectedGame?.cost }}叶语豆/局</span>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="cancel-btn" @click="hideGameDialog">取消</button>
          <button class="play-btn-large" @click="startGame" :disabled="!canPlayGame">
            {{ selectedGame?.cost ? `花费${selectedGame.cost}豆开始` : '开始游戏' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useWalletStore } from '../../../shared/stores/wallet'

const router = useRouter()
const appStore = useAppStore()
const walletStore = useWalletStore()

const showSearch = ref(false)
const searchQuery = ref('')
const showGameDialog = ref(false)
const selectedGame = ref(null)

// 游戏数据
const hotGames = ref([
  {
    id: 'h1',
    name: '消消乐',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=game1',
    players: 12580,
    rating: 4.8,
    size: '15MB',
    description: '经典三消游戏，轻松休闲'
  },
  {
    id: 'h2',
    name: '跳一跳',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=game2',
    players: 9876,
    rating: 4.6,
    size: '8MB',
    description: '考验反应力的跳跃游戏'
  },
  {
    id: 'h3',
    name: '贪吃蛇',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=game3',
    players: 8765,
    rating: 4.5,
    size: '5MB',
    description: '经典怀旧贪吃蛇游戏'
  },
  {
    id: 'h4',
    name: '俄罗斯方块',
    cover: 'https://api.dicebear.com/7.x/shapes/svg?seed=game4',
    players: 7654,
    rating: 4.7,
    size: '12MB',
    description: '永恒经典的方块游戏'
  }
])

const casualGames = ref([
  {
    id: 'c1',
    name: '2048',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=casual1',
    description: '数字合成益智游戏',
    rating: 4.4,
    size: '3MB'
  },
  {
    id: 'c2',
    name: '连连看',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=casual2',
    description: '经典配对消除游戏',
    rating: 4.3,
    size: '10MB'
  },
  {
    id: 'c3',
    name: '数独',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=casual3',
    description: '锻炼逻辑思维的数字游戏',
    rating: 4.2,
    size: '6MB'
  }
])

const competitiveGames = ref([
  {
    id: 'comp1',
    name: '斗地主',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=comp1',
    description: '经典扑克牌游戏',
    rating: 4.6,
    size: '25MB',
    cost: 10
  },
  {
    id: 'comp2',
    name: '麻将',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=comp2',
    description: '传统麻将游戏',
    rating: 4.5,
    size: '30MB',
    cost: 15
  },
  {
    id: 'comp3',
    name: '象棋',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=comp3',
    description: '中国象棋对战',
    rating: 4.4,
    size: '20MB',
    cost: 5
  }
])

// 计算属性
const canPlayGame = computed(() => {
  if (!selectedGame.value?.cost) return true
  return walletStore.checkBeansBalance(selectedGame.value.cost)
})

// 方法
const goBack = () => {
  router.back()
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchQuery.value = ''
  }
}

const handleSearch = () => {
  // 搜索逻辑
  console.log('搜索游戏:', searchQuery.value)
}

const openBeansDialog = () => {
  router.push('/services')
}

const viewAllGames = (category: string) => {
  router.push(`/games/category/${category}`)
}

const playGame = (game: any) => {
  selectedGame.value = game
  showGameDialog.value = true
}

const hideGameDialog = () => {
  showGameDialog.value = false
  selectedGame.value = null
}

const startGame = () => {
  if (!selectedGame.value) return

  // 如果是付费游戏，扣除叶语豆
  if (selectedGame.value.cost) {
    if (!walletStore.checkBeansBalance(selectedGame.value.cost)) {
      appStore.showToast('叶语豆不足，请先充值', 'error')
      return
    }

    const success = walletStore.spendBeans(selectedGame.value.cost, `玩游戏：${selectedGame.value.name}`)
    if (!success) {
      appStore.showToast('支付失败', 'error')
      return
    }
  }

  hideGameDialog()
  appStore.showToast(`正在启动${selectedGame.value.name}...`, 'info')
  
  // 模拟游戏启动
  setTimeout(() => {
    appStore.showToast('游戏功能开发中', 'info')
  }, 1000)
}

onMounted(() => {
  console.log('游戏中心已加载')
})
</script>

<style scoped>
.games-page {
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

.back-btn, .search-btn {
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

.search-container {
  background: white;
  padding: 12px 16px;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 99;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  background: #f8f8f8;
}

.games-content {
  padding: 80px 16px 20px;
}

.beans-card {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.beans-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.beans-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beans-text {
  color: white;
}

.beans-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.beans-amount {
  font-size: 18px;
  font-weight: 600;
}

.beans-action {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 14px;
}

.game-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.more-btn {
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.game-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.game-item:hover {
  transform: scale(1.02);
}

.game-cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 8px;
}

.game-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.game-item:hover .game-overlay {
  opacity: 1;
}

.game-info {
  padding: 8px 0;
}

.game-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.game-players {
  font-size: 12px;
  color: #666;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-row {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.game-row:hover {
  background: #f0f0f0;
}

.game-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
}

.game-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-details {
  flex: 1;
  min-width: 0;
}

.game-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.game-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.game-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.game-rating {
  color: #FFD700;
}

.game-cost {
  color: #07C160;
  font-weight: 500;
}

.play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #07C160;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.play-btn:hover {
  background: #06a552;
}

.play-btn.competitive {
  background: #FF6B6B;
}

.play-btn.competitive:hover {
  background: #ff5252;
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
  margin: 0 20px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: #666;
}

.game-preview {
  padding: 0 20px;
  margin-bottom: 16px;
}

.game-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.game-description {
  padding: 0 20px 20px;
}

.game-description p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}

.game-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-size: 14px;
  color: #666;
  min-width: 60px;
}

.meta-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 0 20px 20px;
}

.cancel-btn, .play-btn-large {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.play-btn-large {
  background: #07C160;
  color: white;
}

.play-btn-large:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

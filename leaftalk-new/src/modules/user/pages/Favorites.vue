<template>
  <div class="favorites-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('profile.favorites') }}</div>
      <button class="search-btn" @click="toggleSearch">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        :placeholder="$t('favorites.searchPlaceholder')"
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <!-- 收藏内容 -->
    <div class="favorites-content">
      <div v-if="filteredFavorites.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:star" width="64" style="color: #ccc;"></iconify-icon>
        <p>{{ $t('favorites.noFavorites') }}</p>
        <p class="empty-tip">{{ $t('favorites.howToFavorite') }}</p>
      </div>

      <div v-else class="favorites-list">
        <div 
          v-for="item in filteredFavorites" 
          :key="item.id"
          class="favorite-item"
          @click="openFavorite(item)"
        >
          <div class="item-icon">
            <iconify-icon 
              :icon="getItemIcon(item.type)" 
              width="24" 
              :style="{ color: getItemColor(item.type) }"
            ></iconify-icon>
          </div>
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-preview">{{ item.preview }}</div>
            <div class="item-time">{{ formatTime(item.createTime) }}</div>
          </div>
          <button class="item-more" @click.stop="showItemMenu(item)">
            <iconify-icon icon="heroicons:ellipsis-horizontal" width="16" style="color: #999;"></iconify-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 操作菜单 -->
    <div v-if="showMenu" class="menu-overlay" @click="hideMenu">
      <div class="menu-content" @click.stop>
        <div class="menu-item" @click="deleteFavorite">
          <iconify-icon icon="heroicons:trash" width="20" style="color: #ff4757;"></iconify-icon>
          <span>删除</span>
        </div>
        <div class="menu-item" @click="shareFavorite">
          <iconify-icon icon="heroicons:share" width="20" style="color: #333;"></iconify-icon>
          <span>分享</span>
        </div>
        <div class="menu-item" @click="hideMenu">
          <span>取消</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useFavoritesStore } from '../../stores/favorites'

const router = useRouter()
const appStore = useAppStore()
const favoritesStore = useFavoritesStore()

const showSearch = ref(false)
const searchQuery = ref('')
const showMenu = ref(false)
const selectedItem = ref(null)

// 过滤收藏内容
const filteredFavorites = computed(() => {
  if (!searchQuery.value) return favoritesStore.favorites

  return favoritesStore.searchFavorites(searchQuery.value)
})

// 获取项目图标
const getItemIcon = (type: string) => {
  const icons = {
    text: 'heroicons:chat-bubble-left',
    image: 'heroicons:photo',
    link: 'heroicons:link',
    file: 'heroicons:document',
    video: 'heroicons:video-camera'
  }
  return icons[type] || 'heroicons:star'
}

// 获取项目颜色
const getItemColor = (type: string) => {
  const colors = {
    text: '#07C160',
    image: '#FF6B6B',
    link: '#4ECDC4',
    file: '#FFD93D',
    video: '#6C5CE7'
  }
  return colors[type] || '#999'
}

// 格式化时间
const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  
  if (days === 0) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return time.toLocaleDateString()
  }
}

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
  // 搜索逻辑已在computed中处理
}

const openFavorite = (item: any) => {
  console.log('打开收藏项:', item)
  // 根据类型打开不同的查看器
  switch (item.type) {
    case 'text':
      appStore.showToast('查看文本消息', 'info')
      break
    case 'image':
      appStore.showToast('查看图片', 'info')
      break
    case 'link':
      appStore.showToast('打开链接', 'info')
      break
    case 'file':
      appStore.showToast('下载文件', 'info')
      break
  }
}

const showItemMenu = (item: any) => {
  selectedItem.value = item
  showMenu.value = true
}

const hideMenu = () => {
  showMenu.value = false
  selectedItem.value = null
}

const deleteFavorite = () => {
  if (selectedItem.value) {
    const removed = favoritesStore.removeFavorite(selectedItem.value.id)
    if (removed) {
      appStore.showToast('已删除收藏', 'success')
    }
  }
  hideMenu()
}

const shareFavorite = () => {
  if (selectedItem.value) {
    appStore.showToast('分享功能开发中', 'info')
  }
  hideMenu()
}

onMounted(() => {
  console.log('收藏页面已加载')
  // 初始化收藏store
  favoritesStore.init()
})
</script>

<style scoped>
.favorites-page {
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

.favorites-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
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

.favorites-list {
  background: white;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.favorite-item:hover {
  background: #f8f8f8;
}

.favorite-item:last-child {
  border-bottom: none;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-preview {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-more {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.menu-content {
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 20px;
  width: 100%;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
  justify-content: center;
  color: #666;
}

.menu-item span {
  margin-left: 12px;
  font-size: 16px;
}
</style>

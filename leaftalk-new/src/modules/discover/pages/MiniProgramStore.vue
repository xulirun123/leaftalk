<template>
  <div class="mini-program-store">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="小程序商店"
      :show-back="true"
      @back="goBack"
    />

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #999;"></iconify-icon>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="搜索小程序"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <div 
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </div>
    </div>

    <!-- 小程序列表 -->
    <div class="programs-container">
      <!-- 推荐小程序 -->
      <div v-if="!searchQuery && selectedCategory === 'all'" class="featured-section">
        <div class="section-title">{{ $t('miniPrograms.featured') }}</div>
        <div class="featured-list">
          <div 
            v-for="program in featuredPrograms"
            :key="program.id"
            class="featured-item"
            @click="viewProgram(program)"
          >
            <div class="program-banner">
              <div class="program-icon">{{ program.icon }}</div>
              <div class="program-info">
                <div class="program-name">{{ program.name }}</div>
                <div class="program-desc">{{ program.description }}</div>
                <div class="program-stats">
                  <span class="rating">
                    <iconify-icon icon="heroicons:star-solid" width="12" style="color: #faad14;" />
                    {{ program.rating }}
                  </span>
                  <span class="downloads">{{ formatDownloads(program.downloadCount) }}</span>
                </div>
              </div>
              <button 
                class="install-btn"
                :class="{ installed: program.isInstalled }"
                @click.stop="toggleInstall(program)"
                :disabled="isInstalling === program.id"
              >
                {{ getInstallButtonText(program) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 小程序网格 -->
      <div class="programs-grid">
        <div 
          v-for="program in filteredPrograms"
          :key="program.id"
          class="program-card"
          @click="viewProgram(program)"
        >
          <div class="program-icon-large">{{ program.icon }}</div>
          <div class="program-name">{{ program.name }}</div>
          <div class="program-category">{{ program.category }}</div>
          <div class="program-rating">
            <iconify-icon icon="heroicons:star-solid" width="12" style="color: #faad14;" />
            <span>{{ program.rating }}</span>
          </div>
          <button 
            class="install-btn-small"
            :class="{ installed: program.isInstalled }"
            @click.stop="toggleInstall(program)"
            :disabled="isInstalling === program.id"
          >
            {{ getInstallButtonText(program) }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredPrograms && filteredPrograms.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:magnifying-glass" width="48" style="color: #ccc;" />
        <p>{{ $t('miniPrograms.noResults') }}</p>
      </div>
    </div>

    <!-- 小程序详情弹窗 -->
    <div v-if="showProgramDetail" class="detail-overlay" @click="closeProgramDetail">
      <div class="detail-modal" @click.stop>
        <div class="detail-header">
          <div class="program-header-info">
            <div class="program-icon-detail">{{ selectedProgram?.icon }}</div>
            <div class="program-meta">
              <h3>{{ selectedProgram?.name }}</h3>
              <div class="program-developer">{{ selectedProgram?.developer }}</div>
              <div class="program-version">v{{ selectedProgram?.version }}</div>
            </div>
          </div>
          <button @click="closeProgramDetail" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>

        <div class="detail-content">
          <!-- 评分和下载量 -->
          <div class="program-stats-detail">
            <div class="stat-item">
              <div class="stat-value">{{ selectedProgram?.rating }}</div>
              <div class="stat-label">{{ $t('miniPrograms.rating') }}</div>
              <div class="stars">
                <iconify-icon 
                  v-for="i in 5"
                  :key="i"
                  icon="heroicons:star-solid" 
                  width="12" 
                  :style="{ color: i <= Math.floor(selectedProgram?.rating || 0) ? '#faad14' : '#e5e5e5' }"
                />
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatDownloads(selectedProgram?.downloadCount || 0) }}</div>
              <div class="stat-label">{{ $t('miniPrograms.downloads') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ selectedProgram?.size }}MB</div>
              <div class="stat-label">{{ $t('miniPrograms.size') }}</div>
            </div>
          </div>

          <!-- 描述 -->
          <div class="program-description">
            <h4>{{ $t('miniPrograms.description') }}</h4>
            <p>{{ selectedProgram?.description }}</p>
          </div>

          <!-- 截图 -->
          <div v-if="selectedProgram?.screenshots && selectedProgram.screenshots.length" class="program-screenshots">
            <h4>{{ $t('miniPrograms.screenshots') }}</h4>
            <div class="screenshots-list">
              <img 
                v-for="(screenshot, index) in selectedProgram.screenshots"
                :key="index"
                :src="screenshot"
                :alt="`Screenshot ${index + 1}`"
                class="screenshot-img"
              />
            </div>
          </div>

          <!-- 权限 -->
          <div v-if="selectedProgram?.permissions && selectedProgram.permissions.length" class="program-permissions">
            <h4>{{ $t('miniPrograms.permissions') }}</h4>
            <div class="permissions-list">
              <div 
                v-for="permission in selectedProgram.permissions"
                :key="permission"
                class="permission-item"
              >
                <iconify-icon icon="heroicons:shield-check" width="16" style="color: #07c160;" />
                <span>{{ getPermissionText(permission) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <button 
            class="detail-install-btn"
            :class="{ installed: selectedProgram?.isInstalled }"
            @click="toggleInstall(selectedProgram!)"
            :disabled="isInstalling === selectedProgram?.id"
          >
            {{ getInstallButtonText(selectedProgram!) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 安装进度 -->
    <div v-if="installProgress?.show" class="install-progress-overlay">
      <div class="progress-modal">
        <div class="progress-icon">
          <iconify-icon icon="heroicons:arrow-down-tray" width="32" style="color: #07c160;" />
        </div>
        <div class="progress-text">正在安装...</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${installProgress?.value?.value || 0}%` }"></div>
        </div>
        <div class="progress-percent">{{ Math.round(installProgress?.value?.value || 0) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
// import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../../shared/stores/appStore'
// import { miniProgramManager, type MiniProgramInfo } from '../../../shared/utils/miniProgram' // 文件不存在，暂时注释
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
// const { t } = useI18n()
const appStore = useAppStore()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('all')
const programs = ref<MiniProgramInfo[]>([])
const showProgramDetail = ref(false)
const selectedProgram = ref<MiniProgramInfo | null>(null)
const isInstalling = ref('')
const installProgress = ref({ show: false, value: 0 })

// 分类列表
const categories = ref([
  { id: 'all', name: '全部' },
  { id: '生活服务', name: '生活服务' },
  { id: '工具', name: '工具' },
  { id: '效率办公', name: '效率办公' },
  { id: '娱乐', name: '娱乐' },
  { id: '教育', name: '教育' }
])

// 计算属性
const featuredPrograms = computed(() => {
  return programs.value.filter(p => p.rating >= 4.5).slice(0, 3)
})

const filteredPrograms = computed(() => {
  if (!programs.value || !Array.isArray(programs.value)) {
    return []
  }

  let filtered = programs.value

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.developer.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 方法
const goBack = () => {
  router.back()
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const viewProgram = (program: MiniProgramInfo) => {
  selectedProgram.value = program
  showProgramDetail.value = true
}

const closeProgramDetail = () => {
  showProgramDetail.value = false
  selectedProgram.value = null
}

const toggleInstall = async (program: MiniProgramInfo) => {
  if (program.isInstalled) {
    // 卸载
    const success = miniProgramManager.uninstallProgram(program.id)
    if (success) {
      program.isInstalled = false
      appStore.showToast('卸载成功', 'success')
    }
  } else {
    // 安装
    isInstalling.value = program.id
    installProgress.value = { show: true, value: 0 }
    
    const success = await miniProgramManager.installProgram(program.id)

    if (installProgress.value) {
      installProgress.value.show = false
    }
    isInstalling.value = ''
    
    if (success) {
      program.isInstalled = true
      appStore.showToast('安装成功', 'success')
    } else {
      appStore.showToast('安装失败', 'error')
    }
  }
}

const getInstallButtonText = (program: MiniProgramInfo) => {
  if (isInstalling.value === program.id) {
    return '安装中...'
  }
  return program.isInstalled ? '卸载' : '安装'
}

const formatDownloads = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

const getPermissionText = (permission: string) => {
  const permissionMap: Record<string, string> = {
    location: '位置信息',
    network: '网络访问',
    storage: '存储权限',
    notification: '通知权限',
    camera: '摄像头',
    microphone: '麦克风'
  }
  return permissionMap[permission] || permission
}

// 事件监听
const handleDownloadProgress = (data: any) => {
  if (data.programId === isInstalling.value && installProgress.value) {
    installProgress.value.value = data.progress
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 从API加载小程序列表
    console.log('🔄 从API加载小程序列表...')
    const response = await fetch('/api/miniapps')
    const result = await response.json()

    if (result.success && result.data) {
      // 转换API数据格式
      programs.value = result.data.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        icon: app.icon,
        category: app.category,
        developer: '叶语官方',
        version: '1.0.0',
        size: '2.5MB',
        rating: 4.5,
        downloads: 1000,
        isInstalled: false,
        screenshots: [app.icon],
        permissions: ['网络访问', '存储权限']
      }))
      console.log('✅ 小程序数据加载成功:', programs.value.length, '个')
    } else {
      throw new Error('API返回数据格式错误')
    }
  } catch (error) {
    console.error('❌ 从API加载小程序失败:', error)

    // 使用本地数据作为后备
    try {
      const storePrograms = await miniProgramManager.getStorePrograms()
      programs.value = Array.isArray(storePrograms) ? storePrograms : []
      console.log('📱 使用本地小程序数据:', programs.value.length, '个')
    } catch (fallbackError) {
      console.error('❌ 本地数据也加载失败:', fallbackError)
      programs.value = []
    }
  }

  // 监听下载进度
  miniProgramManager.on('download_progress', handleDownloadProgress)
})

onUnmounted(() => {
  miniProgramManager.off('download_progress', handleDownloadProgress)
})
</script>

<style scoped>
.mini-program-store {
  min-height: 100vh;
  background: #f8f8f8;
}

.search-section {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 16px;
}

.category-nav {
  display: flex;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  overflow-x: auto;
  gap: 16px;
}

.category-item {
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.category-item.active {
  background: #07c160;
  color: white;
}

.category-item:hover:not(.active) {
  background: #f0f0f0;
}

.programs-container {
  padding: 16px;
}

.featured-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.featured-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.featured-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.featured-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.program-banner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.program-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.program-info {
  flex: 1;
}

.program-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.program-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.program-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.install-btn {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.install-btn.installed {
  background: #f0f0f0;
  color: #666;
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.program-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.program-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.program-icon-large {
  font-size: 40px;
  margin-bottom: 12px;
}

.program-card .program-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.program-category {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.program-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.install-btn-small {
  width: 100%;
  padding: 6px 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.install-btn-small.installed {
  background: #f0f0f0;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

/* 详情弹窗样式 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.program-header-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.program-icon-detail {
  font-size: 48px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
}

.program-meta h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.program-developer {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.program-version {
  font-size: 12px;
  color: #999;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.program-stats-detail {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.program-description,
.program-screenshots,
.program-permissions {
  margin-bottom: 24px;
}

.program-description h4,
.program-screenshots h4,
.program-permissions h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.program-description p {
  line-height: 1.5;
  color: #666;
}

.screenshots-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.screenshot-img {
  width: 120px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.detail-actions {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.detail-install-btn {
  width: 100%;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-install-btn.installed {
  background: #f0f0f0;
  color: #666;
}

/* 安装进度样式 */
.install-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.progress-modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  min-width: 200px;
}

.progress-icon {
  margin-bottom: 16px;
}

.progress-text {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #07c160;
  transition: width 0.3s;
}

.progress-percent {
  font-size: 14px;
  color: #666;
}
</style>

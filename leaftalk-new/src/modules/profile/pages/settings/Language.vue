<template>
  <div class="language-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('settings.language') }}</div>
    </div>

    <!-- 语言列表 -->
    <div class="settings-content">
      <div class="settings-section">
        <div
          v-for="language in $supportedLanguages"
          :key="language.code"
          class="language-item"
          @click="$setLanguage(language.code); selectLanguage(language.code)"
        >
          <div class="language-info">
            <div class="language-name">{{ language.name }}</div>
            <div class="language-native">{{ language.nativeName }}</div>
          </div>
          <div class="language-check" v-if="currentLanguage === language.code">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 说明文字 -->
      <div class="language-note">
        <p>更改语言设置后，应用将重新启动以应用新的语言设置。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../../../stores/general'

const router = useRouter()
const generalStore = useGeneralStore()

// 响应式的当前语言
const currentLanguage = ref(localStorage.getItem('yeyu_language') || 'zh-CN')

// 监听语言变化
const updateCurrentLanguage = () => {
  currentLanguage.value = localStorage.getItem('yeyu_language') || 'zh-CN'
}

const goBack = () => {
  router.back()
}

const selectLanguage = (languageCode: string) => {
  // 立即更新本地状态
  currentLanguage.value = languageCode

  // 使用i18n系统的语言切换
  if (typeof window !== 'undefined' && window.$setLanguage) {
    window.$setLanguage(languageCode as any)
  }

  // 同步更新设置store（保持数据一致性）
  generalStore.updateSetting('language', languageCode as any)
}

onMounted(() => {
  generalStore.init()
  updateCurrentLanguage()
})
</script>

<style scoped>
.language-settings {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.settings-content {
  margin-top: 60px;
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.language-item:last-child {
  border-bottom: none;
}

.language-item:hover {
  background: #f8f8f8;
}

.language-info {
  flex: 1;
}

.language-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.language-native {
  font-size: 14px;
  color: #666;
}

.language-check {
  display: flex;
  align-items: center;
}

.language-note {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.language-note p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>

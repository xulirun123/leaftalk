<template>
  <div class="general-page">
    <!-- 设置项列表 -->
    <div class="settings-list">
      <!-- 语言 -->
      <div class="setting-item" @click="handleLanguageClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="语言" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <span class="value-text">{{ currentLanguageName }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 字体大小 -->
      <div class="setting-item" @click="handleFontSizeClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="字体大小" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <span class="value-text">
            <SmartTranslator text="标准" :auto-translate="true" />
          </span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 聊天 -->
      <div class="setting-item" @click="handleChatClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="聊天" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 发现页管理 -->
      <div class="setting-item" @click="handleDiscoverClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="发现页管理" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 辅助功能 -->
      <div class="setting-item" @click="handleAccessibilityClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="辅助功能" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 版本 -->
      <div class="setting-item" @click="handleVersionClick">
        <span class="setting-label yy-function-item-text">
          <SmartTranslator text="版本" :auto-translate="true" />
        </span>
        <div class="setting-value">
          <span class="value-text">{{ appVersion }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../../shared/stores/appStore'
import SmartTranslator from '../../../shared/components/translation/SmartTranslator.vue'

const router = useRouter()
const appStore = useAppStore()
const { locale } = useI18n()

// 应用版本
const appVersion = ref('1.0.0')

// 语言映射
const languageNames = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'ms': 'Bahasa Malaysia',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español'
}

// 当前语言显示名称
const currentLanguageName = computed(() => {
  return languageNames[locale.value as keyof typeof languageNames] || '简体中文'
})

// 点击处理函数
const handleLanguageClick = async () => {
  try {
    console.log('点击语言设置')
    console.log('尝试跳转到:', '/settings/language-selector')

    // 先检查路由是否存在
    const route = router.resolve('/settings/language-selector')
    console.log('路由解析结果:', route)

    if (route.name === 'LanguageSelector') {
      console.log('✅ 路由存在，正在跳转...')
      await router.push('/settings/language-selector')
      console.log('✅ 跳转成功')
    } else {
      console.error('❌ 路由不存在!')
      appStore.showToast('路由配置错误，请检查开发者控制台', 'error')
    }
  } catch (error) {
    console.error('❌ 跳转到语言选择页面失败:', error)
    appStore.showToast('页面跳转失败', 'error')
  }
}

const handleFontSizeClick = () => {
  console.log('点击字体大小设置')
  // TODO: 跳转到字体大小设置页面
  appStore.showToast('字体大小设置功能开发中', 'info')
}

const handleChatClick = () => {
  console.log('点击聊天设置')
  // TODO: 跳转到聊天设置页面
  appStore.showToast('聊天设置功能开发中', 'info')
}

const handleDiscoverClick = () => {
  console.log('点击发现页管理')
  // TODO: 跳转到发现页管理页面
  appStore.showToast('发现页管理功能开发中', 'info')
}

const handleAccessibilityClick = () => {
  console.log('点击辅助功能')
  // TODO: 跳转到辅助功能页面
  appStore.showToast('辅助功能设置开发中', 'info')
}

const handleVersionClick = () => {
  console.log('点击版本信息')
  // TODO: 显示版本详情或检查更新
  appStore.showToast(`当前版本：${appVersion.value}`, 'info')
}

// 页面初始化
onMounted(() => {
  console.log('🎯 通用设置页面初始化')
})
</script>

<style scoped>
.general-page {
  background: #f5f5f5;
}

/* 设置项列表 */
.settings-list {
  background: white;
}

/* 设置项 */
.setting-item {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-item:last-child {
  border-bottom: none;
}

/* 设置项标签 */
.setting-label {
  font-size: var(--yy-function-item-font-size);
  color: var(--yy-function-item-text-color);
  font-weight: normal;
}

/* 设置项值 */
.setting-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 13px;
  color: #999;
}

/* 箭头图标 */
.arrow-icon {
  color: #c7c7cc;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .setting-item {
    padding: 0 12px;
  }

  .setting-label,
  .value-text {
    font-size: 12px;
  }
}
</style>

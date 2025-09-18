<template>
  <div class="language-selector">
    <!-- 语种选择列表 -->
    <div class="language-list">
      <!-- 动态语言列表 -->
      <div
        v-for="language in languages"
        :key="language.code"
        class="language-item"
        :class="{ 'selected': selectedLanguage === language.code }"
        @click="selectLanguage(language.code)"
      >
        <span class="language-name">{{ language.name }}</span>
        <iconify-icon
          v-if="selectedLanguage === language.code"
          icon="heroicons:check"
          width="20"
          class="check-icon"
        ></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import { useAppStore } from '../../../shared/stores/appStore'
import { useGlobalLanguage } from '../../../shared/composables/useGlobalLanguage'
import { globalTranslationManager } from '../../../shared/services/autoTranslationService'

// 使用项目中定义的语言代码类型
type LanguageCode = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'ms' | 'fr' | 'de' | 'es'

const appStore = useAppStore()

// 使用全局语言管理
const { globalLanguage, changeLanguage, t } = useGlobalLanguage()

// 调试信息
console.log('🔍 LanguageSelector 调试信息:')
console.log('  - 当前语言:', globalLanguage.value)
console.log('  - t 函数类型:', typeof t)
console.log('  - 测试翻译 settings.language:', t('settings.language'))
console.log('  - 测试翻译 languages.zhCN:', t('languages.zhCN'))

// 使用全局语言状态
const selectedLanguage = computed({
  get: () => globalLanguage.value,
  set: (value: LanguageCode) => {
    // 使用全局语言切换函数
    changeLanguage(value)
  }
})

// 支持的语言列表 - 使用 i18n 翻译
const supportedLanguagesList = [
  { code: 'zh-CN' as LanguageCode, key: 'languages.zhCN' },
  { code: 'zh-TW' as LanguageCode, key: 'languages.zhTW' },
  { code: 'en' as LanguageCode, key: 'languages.en' },
  { code: 'ja' as LanguageCode, key: 'languages.ja' },
  { code: 'ko' as LanguageCode, key: 'languages.ko' },
  { code: 'ms' as LanguageCode, key: 'languages.ms' },
  { code: 'fr' as LanguageCode, key: 'languages.fr' },
  { code: 'de' as LanguageCode, key: 'languages.de' },
  { code: 'es' as LanguageCode, key: 'languages.es' }
]

// 响应式语言选项 - 根据当前语言动态翻译
const languages = computed(() => {
  return supportedLanguagesList.map((lang: { code: LanguageCode; key: string }) => ({
    code: lang.code,
    name: t(lang.key) || getLanguageNativeName(lang.code)
  }))
})

// 获取语言的原生名称（备用方案）
const getLanguageNativeName = (code: LanguageCode): string => {
  const nativeNames = {
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
  return nativeNames[code] || code
}

// 选择语言
const selectLanguage = async (languageCode: string) => {
  console.log('🌐 选择语言:', languageCode)

  // 验证语言代码
  const validLanguages: LanguageCode[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'ms', 'fr', 'de', 'es']
  if (!validLanguages.includes(languageCode as LanguageCode)) {
    console.error('❌ 无效的语言代码:', languageCode)
    return
  }

  const typedLanguageCode = languageCode as LanguageCode
  const language = languages.value.find((lang: { code: LanguageCode; name: string }) => lang.code === typedLanguageCode)

  if (language) {
    try {
      console.log('🔄 LanguageSelector 开始切换语言到:', typedLanguageCode)
      console.log('🔍 切换前 globalLanguage.value:', globalLanguage.value)

      // 1. 使用全局语言切换函数
      const success = await changeLanguage(typedLanguageCode)

      if (!success) {
        console.error('❌ 全局语言切换失败')
        appStore.showToast('语言切换失败', 'error')
        return
      }

      console.log('✅ LanguageSelector 语言已切换到:', typedLanguageCode)
      console.log('🌐 切换后 globalLanguage.value:', globalLanguage.value)

      // 2. 自动处理翻译（基于用户选择的语言）
      if (typedLanguageCode !== 'zh-CN') {
        console.log('🌍 自动启用翻译到:', typedLanguageCode)
        globalTranslationManager.enableAutoTranslation(typedLanguageCode)
      } else {
        // 如果切换回中文，禁用自动翻译
        console.log('🌍 切换回中文，禁用自动翻译')
        globalTranslationManager.disableAutoTranslation()
      }

      // 等待 DOM 更新
      await nextTick()

      // 显示成功提示（使用当前语言）
      const successMessage = t('settings.languageChanged') || `已切换到${language.name}`
      appStore.showToast(successMessage, 'success')

      console.log('🔄 整个应用界面已切换到对应语言，包括实时翻译')
      console.log('✅ 语言选择完成，用户可以手动返回上一页')

    } catch (error) {
      console.error('❌ LanguageSelector 语言切换失败:', error)
      appStore.showToast('语言切换失败', 'error')
    }
  }
}

// 页面初始化
onMounted(() => {
  // 从本地存储获取当前语言设置
  const savedLanguage = localStorage.getItem('yeyu_language')
  const validLanguages: LanguageCode[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'ms', 'fr', 'de', 'es']

  if (savedLanguage && validLanguages.includes(savedLanguage as LanguageCode)) {
    selectedLanguage.value = savedLanguage as LanguageCode
  }

  console.log('🌐 语种选择页面初始化，当前语言:', selectedLanguage.value)
})
</script>

<style scoped>
.language-selector {
  background: #f5f5f5;
}

/* 语种选择列表 */
.language-list {
  background: white;
}

/* 语种选择项 */
.language-item {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.language-item:hover {
  background: #f8f8f8;
}

.language-item:last-child {
  border-bottom: none;
}

.language-item.selected {
  background: #f0f9ff;
}

/* 语种名称 */
.language-name {
  font-size: 13px;
  color: #333;
  font-weight: normal;
}

.language-item.selected .language-name {
  color: #07C160;
  font-weight: 500;
}

/* 选中图标 */
.check-icon {
  color: #07C160;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .language-item {
    padding: 0 12px;
  }
  
  .language-name {
    font-size: 12px;
  }
}
</style>

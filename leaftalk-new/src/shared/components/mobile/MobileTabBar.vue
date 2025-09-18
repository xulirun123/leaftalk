<template>
  <div class="mobile-tab-bar">
    <div class="tab-container">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <UnifiedIcon
          :category="tab.category"
          :name="tab.name"
          :size="20"
          :color="activeTab === tab.key ? '#07C160' : '#999999'"
        />

        <span class="tab-label" :class="{ 'active-label': activeTab === tab.key }">{{ t(tab.labelKey) || tab.label }}</span>
        <div v-if="tab.badge && tab.badge > 0" class="tab-badge">{{ tab.badge }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UnifiedIcon from '../common/UnifiedIcon.vue'
import { ICON_MAP } from '../../config/iconConfig'
import { useGlobalLanguage } from '../../composables/useGlobalLanguage'

// 使用全局语言管理
const { t } = useGlobalLanguage()

interface Tab {
  key: string
  label: string
  labelKey?: string  // 添加翻译键
  category: keyof typeof ICON_MAP
  name: string
  path: string
  badge?: number
}

interface Props {
  activeTab?: string
  tabs?: Tab[]
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'chats',
  tabs: () => [
    {
      key: 'chats',
      label: '叶语',
      labelKey: 'nav.chat',
      category: 'nav',
      name: 'chat',
      path: '/'
    },
    {
      key: 'contacts',
      label: '通讯录',
      labelKey: 'nav.contacts',
      category: 'nav',
      name: 'contacts',
      path: '/contacts'
    },
    {
      key: 'discover',
      label: '发现',
      labelKey: 'nav.discover',
      category: 'nav',
      name: 'discover',
      path: '/discover'
    },
    {
      key: 'genealogy',
      label: '族谱',
      labelKey: 'nav.genealogy',
      category: 'nav',
      name: 'genealogy',
      path: '/genealogy'
    },
    {
      key: 'profile',
      label: '我',
      labelKey: 'nav.me',
      category: 'nav',
      name: 'profile',
      path: '/profile'
    }
  ]
})

const emit = defineEmits<{
  tabChange: [key: string]
}>()

const switchTab = (tabKey: string) => {
  console.log('📱 MobileTabBar switchTab 被调用:', {
    tabKey,
    activeTab: props.activeTab
  })

  emit('tabChange', tabKey)
  console.log('📱 MobileTabBar tabChange 事件已发出:', tabKey)
}
</script>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2c2c2c;
  border-top: 1px solid #404040;
  z-index: 1000;
  height: 75px;
  display: flex;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  padding: 8px 4px;
  color: #999999; /* 默认灰色，确保可见 */
}

.tab-item.active {
  color: #07C160;
  background: transparent;
}

.tab-label {
  font-size: 12px;
  margin-top: 4px;
  color: #999999; /* 默认灰色 */
  font-weight: 400;
  line-height: 1.2;
}

.tab-label.active-label,
.tab-item.active .tab-label {
  color: #07C160 !important;
  font-weight: 500;
}

.tab-item.active iconify-icon {
  color: #07C160 !important;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 20%;
  background: #ff4757;
  color: white;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
}
</style>

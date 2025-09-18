<template>
  <div class="emoji-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('settings.emojiSettings') }}</div>
    </div>

    <!-- 表情设置内容 -->
    <div class="settings-content">
      <!-- 最近使用的表情 -->
      <div class="settings-section">
        <div class="section-title">最近使用</div>
        <div class="emoji-grid">
          <div 
            v-for="emoji in recentEmojis" 
            :key="emoji"
            class="emoji-item"
            @click="removeRecentEmoji(emoji)"
          >
            <span class="emoji">{{ emoji }}</span>
            <div class="remove-btn">
              <iconify-icon icon="heroicons:x-mark" width="12" style="color: #999;"></iconify-icon>
            </div>
          </div>
        </div>
        <div class="emoji-note">
          <p>点击表情可以从最近使用中移除</p>
        </div>
      </div>

      <!-- 表情包管理 -->
      <div class="settings-section">
        <div class="section-title">表情包管理</div>
        <div class="setting-item" @click="manageCustomEmojis">
          <div class="setting-info">
            <iconify-icon icon="heroicons:face-smile" width="20" style="color: #07c160;"></iconify-icon>
            <span>自定义表情包</span>
          </div>
          <div class="setting-value">{{ customEmojis.length }}个</div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="addEmojiPack">
          <div class="setting-info">
            <iconify-icon icon="heroicons:plus" width="20" style="color: #07c160;"></iconify-icon>
            <span>添加表情包</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 表情设置 -->
      <div class="settings-section">
        <div class="section-title">表情设置</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动建议表情</span>
            <span class="setting-desc">根据输入内容自动建议相关表情</span>
          </div>
          <div class="setting-toggle" :class="{ active: autoSuggestEmojis }" @click="toggleAutoSuggest">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>大表情发送</span>
            <span class="setting-desc">单独发送表情时显示为大表情</span>
          </div>
          <div class="setting-toggle" :class="{ active: largeSingleEmoji }" @click="toggleLargeEmoji">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 清理选项 -->
      <div class="settings-section">
        <div class="section-title">清理选项</div>
        <div class="setting-item" @click="clearRecentEmojis">
          <div class="setting-info">
            <iconify-icon icon="heroicons:trash" width="20" style="color: #fa5151;"></iconify-icon>
            <span>清空最近使用</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="resetEmojiSettings">
          <div class="setting-info">
            <iconify-icon icon="heroicons:arrow-path" width="20" style="color: #ff9500;"></iconify-icon>
            <span>重置表情设置</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../stores/settingsStore'

const router = useRouter()
const generalStore = useGeneralStore()

// 表情设置
const autoSuggestEmojis = ref(true)
const largeSingleEmoji = ref(true)

// 最近使用的表情
const recentEmojis = computed(() => {
  return generalStore.settings.emojiSettings?.recentEmojis || [
    '😀', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', 
    '🎉', '🔥', '💯', '😭', '😱', '🙄', '😴', '🤗'
  ]
})

// 自定义表情
const customEmojis = computed(() => {
  return generalStore.settings.emojiSettings?.customEmojis || []
})

const goBack = () => {
  router.back()
}

// 移除最近使用的表情
const removeRecentEmoji = (emoji: string) => {
  const current = generalStore.settings.emojiSettings || { recentEmojis: [], customEmojis: [] }
  const newRecent = current.recentEmojis.filter(e => e !== emoji)
  
  generalStore.updateSetting('emojiSettings', {
    ...current,
    recentEmojis: newRecent
  })
}

// 管理自定义表情包
const manageCustomEmojis = () => {
  console.log('管理自定义表情包')
  // 这里可以跳转到自定义表情包管理页面
}

// 添加表情包
const addEmojiPack = () => {
  console.log('添加表情包')
  // 这里可以打开表情包商店或文件选择器
}

// 切换自动建议表情
const toggleAutoSuggest = () => {
  autoSuggestEmojis.value = !autoSuggestEmojis.value
  // 保存设置
  console.log('自动建议表情:', autoSuggestEmojis.value)
}

// 切换大表情发送
const toggleLargeEmoji = () => {
  largeSingleEmoji.value = !largeSingleEmoji.value
  // 保存设置
  console.log('大表情发送:', largeSingleEmoji.value)
}

// 清空最近使用
const clearRecentEmojis = () => {
  if (confirm('确定要清空最近使用的表情吗？')) {
    const current = generalStore.settings.emojiSettings || { recentEmojis: [], customEmojis: [] }
    generalStore.updateSetting('emojiSettings', {
      ...current,
      recentEmojis: []
    })
  }
}

// 重置表情设置
const resetEmojiSettings = () => {
  if (confirm('确定要重置所有表情设置吗？')) {
    generalStore.updateSetting('emojiSettings', {
      recentEmojis: [],
      customEmojis: []
    })
    autoSuggestEmojis.value = true
    largeSingleEmoji.value = true
  }
}

onMounted(() => {
  // 初始化设置
})
</script>

<style scoped>
.emoji-settings {
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
  height: 48px;
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

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 8px 16px 16px;
}

.emoji-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background: #f0f0f0;
}

.emoji-item .emoji {
  font-size: 24px;
}

.emoji-item .remove-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #fa5151;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover .remove-btn {
  display: flex;
}

.emoji-note {
  padding: 8px 16px 16px;
}

.emoji-note p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  align-items: flex-start;
}

.setting-info span:first-child {
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.setting-value {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}
</style>

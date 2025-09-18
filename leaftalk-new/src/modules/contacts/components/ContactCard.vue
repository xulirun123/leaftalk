<template>
  <div class="contact-card" @click="$emit('click', contact)">
    <div class="contact-avatar">
      <img 
        :src="contact.avatar || defaultAvatar" 
        :alt="contact.name"
        class="avatar-image"
        @error="handleImageError"
      />
      <div v-if="contact.isOnline" class="online-indicator"></div>
    </div>
    
    <div class="contact-info">
      <div class="contact-name">{{ contact.name || contact.nickname }}</div>
      <div class="contact-status">{{ contact.status || '暂无状态' }}</div>
    </div>
    
    <div class="contact-actions">
      <button 
        v-if="showChatButton"
        @click.stop="$emit('chat', contact)"
        class="action-button chat-button"
      >
        💬
      </button>
      <button 
        v-if="showCallButton"
        @click.stop="$emit('call', contact)"
        class="action-button call-button"
      >
        📞
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Contact {
  id: string
  name: string
  nickname?: string
  avatar?: string
  status?: string
  isOnline?: boolean
}

interface Props {
  contact: Contact
  showChatButton?: boolean
  showCallButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showChatButton: true,
  showCallButton: true
})

const emit = defineEmits<{
  click: [contact: Contact]
  chat: [contact: Contact]
  call: [contact: Contact]
}>()

const defaultAvatar = '/images/default-avatar.png'

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultAvatar
}
</script>

<style scoped>
.contact-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-card:hover {
  background-color: #f5f5f5;
}

.contact-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #07C160;
  border: 2px solid white;
  border-radius: 50%;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #191919;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-status {
  font-size: 14px;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #e0e0e0;
}

.chat-button:hover {
  background-color: #07C160;
  color: white;
}

.call-button:hover {
  background-color: #576B95;
  color: white;
}
</style>

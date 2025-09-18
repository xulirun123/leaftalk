<template>
  <div class="empty-state">
    <div class="empty-icon">
      <iconify-icon :icon="iconName" width="64" height="64"></iconify-icon>
    </div>
    <div class="empty-title">{{ title }}</div>
    <div class="empty-description">{{ description }}</div>
    <div class="empty-actions" v-if="showActions">
      <button 
        v-if="primaryAction" 
        class="btn btn-primary"
        @click="$emit('primary-action')"
      >
        {{ primaryAction }}
      </button>
      <button 
        v-if="secondaryAction" 
        class="btn btn-secondary"
        @click="$emit('secondary-action')"
      >
        {{ secondaryAction }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'no-data', 'error', 'network', 'search', 'contacts', 'moments', 'genealogy'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  primaryAction: {
    type: String,
    default: ''
  },
  secondaryAction: {
    type: String,
    default: ''
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['primary-action', 'secondary-action'])

const iconName = computed(() => {
  const iconMap = {
    'default': 'heroicons:document-text',
    'no-data': 'heroicons:inbox',
    'error': 'heroicons:exclamation-triangle',
    'network': 'heroicons:wifi',
    'search': 'heroicons:magnifying-glass',
    'contacts': 'heroicons:users',
    'moments': 'heroicons:photo',
    'genealogy': 'heroicons:user-group'
  }
  return iconMap[props.type] || iconMap.default
})

// 预设的空状态配置
const presets = {
  'contacts-empty': {
    title: '暂无联系人',
    description: '您还没有添加任何联系人\n开始添加好友，建立联系吧',
    primaryAction: '添加好友',
    type: 'contacts'
  },
  'moments-empty': {
    title: '暂无朋友圈',
    description: '还没有朋友圈动态\n发布第一条动态，分享生活点滴',
    primaryAction: '发布动态',
    type: 'moments'
  },
  'genealogy-empty': {
    title: '暂无族谱',
    description: '您还没有加入任何族谱\n创建或加入族谱，连接家族纽带',
    primaryAction: '创建族谱',
    secondaryAction: '加入族谱',
    type: 'genealogy'
  },
  'chat-empty': {
    title: '暂无聊天',
    description: '还没有聊天记录\n开始与好友聊天吧',
    primaryAction: '开始聊天',
    type: 'default'
  },
  'search-empty': {
    title: '无搜索结果',
    description: '没有找到相关内容\n尝试使用其他关键词搜索',
    primaryAction: '重新搜索',
    type: 'search'
  },
  'network-error': {
    title: '网络连接失败',
    description: '无法连接到服务器\n请检查网络连接后重试',
    primaryAction: '重试',
    type: 'network'
  },
  'service-unavailable': {
    title: '服务暂时不可用',
    description: '服务器正在维护中\n请稍后再试',
    primaryAction: '刷新',
    type: 'error'
  }
}

// 如果传入了预设类型，使用预设配置
const preset = computed(() => {
  return presets[props.type] || null
})

const finalTitle = computed(() => {
  return props.title || preset.value?.title || '暂无数据'
})

const finalDescription = computed(() => {
  return props.description || preset.value?.description || '当前没有可显示的内容'
})

const finalPrimaryAction = computed(() => {
  return props.primaryAction || preset.value?.primaryAction || ''
})

const finalSecondaryAction = computed(() => {
  return props.secondaryAction || preset.value?.secondaryAction || ''
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
  color: #999;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.empty-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 32px;
  white-space: pre-line;
  max-width: 280px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-primary {
  background: #07C160;
  color: white;
}

.btn-primary:hover {
  background: #06AD56;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn:active {
  transform: translateY(1px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .empty-state {
    padding: 40px 16px;
    min-height: 250px;
  }
  
  .empty-title {
    font-size: 16px;
  }
  
  .empty-description {
    font-size: 13px;
    max-width: 240px;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 13px;
    min-width: 80px;
  }
}
</style>

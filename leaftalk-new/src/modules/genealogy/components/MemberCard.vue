<template>
  <div 
    class="member-card"
    :class="[
      member.gender,
      layout,
      {
        patriarch: member.isPatriarch,
        deceased: !member.isAlive,
        'show-details': showDetails
      }
    ]"
    :style="cardStyle"
    @click="$emit('member-click', member)"
  >
    <!-- 世代标记 -->
    <div v-if="customization.decorations.showGenerationLabels" class="generation-badge">
      {{ getGenerationLabel(member.generation) }}
    </div>
    
    <!-- 族长标识 -->
    <div v-if="customization.decorations.showPatriarchCrown && member.isPatriarch" class="patriarch-crown">
      <iconify-icon icon="heroicons:crown" width="16"></iconify-icon>
    </div>
    
    <!-- 头像 -->
    <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="avatarStyle">
      <img :src="member.avatar" :alt="member.name" />
      
      <!-- 逝者标记 -->
      <div v-if="!member.isAlive" class="deceased-marker">
        逝
      </div>
    </div>
    
    <!-- 成员信息 -->
    <div class="member-info">
      <!-- 姓名 -->
      <div v-if="customization.avatars.showNames" class="member-name" :style="nameStyle">
        {{ member.name }}
      </div>
      
      <!-- 称谓 -->
      <div v-if="customization.avatars.showTitles && member.title" class="member-title">
        {{ member.title }}
      </div>
      
      <!-- 日期 -->
      <div v-if="customization.avatars.showDates" class="member-dates" :style="dateStyle">
        {{ formatDates(member) }}
      </div>
      
      <!-- 详细信息（可选） -->
      <div v-if="showDetails" class="member-details">
        <div v-if="member.location" class="detail-item">
          <iconify-icon icon="heroicons:map-pin" width="12"></iconify-icon>
          <span>{{ member.location }}</span>
        </div>
        
        <div v-if="member.occupation" class="detail-item">
          <iconify-icon icon="heroicons:briefcase" width="12"></iconify-icon>
          <span>{{ member.occupation }}</span>
        </div>
      </div>
    </div>
    
    <!-- 关系指示器 -->
    <div v-if="showRelationships" class="relationship-indicators">
      <div v-if="member.spouseIds && member.spouseIds.length > 0" class="relationship-indicator spouse">
        <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
        <span>{{ member.spouseIds.length }}</span>
      </div>
      
      <div v-if="member.childrenIds && member.childrenIds.length > 0" class="relationship-indicator children">
        <iconify-icon icon="heroicons:users" width="12"></iconify-icon>
        <span>{{ member.childrenIds.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'european'
  },
  customization: {
    type: Object,
    default: () => ({
      avatars: {
        size: 'medium',
        showAvatars: true,
        showNames: true,
        showDates: true,
        showTitles: false
      },
      decorations: {
        showGenerationLabels: true,
        showPatriarchCrown: true
      }
    })
  },
  showDetails: {
    type: Boolean,
    default: false
  },
  showRelationships: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['member-click'])

// 计算属性
const cardStyle = computed(() => {
  const style = {}
  
  // 根据布局调整卡片大小
  switch (props.layout) {
    case 'pagoda':
      if (props.member.generation > 2) {
        style.transform = 'scale(0.9)'
      }
      break
    case 'fan':
    case 'circular':
      if (props.member.generation > 1) {
        style.transform = 'scale(0.8)'
      }
      break
  }
  
  return style
})

const avatarStyle = computed(() => {
  const sizes = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80
  }
  
  const size = sizes[props.customization.avatars.size] || 48
  
  return {
    width: size + 'px',
    height: size + 'px'
  }
})

const nameStyle = computed(() => {
  const fontSizes = {
    small: '10px',
    medium: '12px',
    large: '14px',
    xlarge: '16px'
  }
  
  return {
    fontSize: fontSizes[props.customization.avatars.size] || '12px'
  }
})

const dateStyle = computed(() => {
  const fontSizes = {
    small: '8px',
    medium: '10px',
    large: '11px',
    xlarge: '12px'
  }
  
  return {
    fontSize: fontSizes[props.customization.avatars.size] || '10px'
  }
})

// 方法
const getGenerationLabel = (generation) => {
  const labels = ['一世', '二世', '三世', '四世', '五世', '六世', '七世', '八世']
  return labels[generation - 1] || `${generation}世`
}

const formatDates = (member) => {
  const birth = member.birthDate ? new Date(member.birthDate).getFullYear() : '?'
  const death = member.deathDate ? new Date(member.deathDate).getFullYear() : (member.isAlive ? '' : '?')
  
  if (member.isAlive) {
    return `${birth}-`
  } else {
    return `${birth}-${death}`
  }
}
</script>

<style scoped>
.member-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  max-width: 120px;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #07c160;
}

.member-card.male {
  border-color: #4A90E2;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
}

.member-card.female {
  border-color: #E24A90;
  background: linear-gradient(135deg, #ffffff 0%, #fff8fb 100%);
}

.member-card.patriarch {
  border-color: #FFD700;
  background: linear-gradient(135deg, #ffffff 0%, #fffbf0 100%);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.member-card.deceased {
  opacity: 0.8;
  background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
}

/* 布局特定样式 */
.member-card.pagoda {
  min-width: 60px;
  max-width: 100px;
  padding: 8px;
}

.member-card.fan,
.member-card.circular {
  min-width: 50px;
  max-width: 80px;
  padding: 6px;
}

.member-card.tree {
  border-radius: 50%;
  min-width: 70px;
  max-width: 70px;
  height: 70px;
  padding: 8px;
}

/* 世代标记 */
.generation-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #07c160;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  z-index: 2;
}

/* 族长标识 */
.patriarch-crown {
  position: absolute;
  top: -6px;
  left: -6px;
  color: #FFD700;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
  z-index: 2;
}

/* 头像 */
.member-avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.deceased-marker {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px 0 0 0;
  padding: 2px 4px;
  font-size: 8px;
  font-weight: bold;
}

/* 成员信息 */
.member-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  width: 100%;
}

.member-name {
  font-weight: 600;
  color: #333;
  line-height: 1.2;
  word-break: break-all;
}

.member-title {
  font-size: 9px;
  color: #666;
  font-style: italic;
}

.member-dates {
  color: #999;
  line-height: 1;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #666;
}

/* 关系指示器 */
.relationship-indicators {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.relationship-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2px 4px;
  font-size: 8px;
  color: #666;
}

.relationship-indicator.spouse {
  color: #E24A90;
  border-color: #E24A90;
}

.relationship-indicator.children {
  color: #4A90E2;
  border-color: #4A90E2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-card {
    min-width: 60px;
    max-width: 100px;
    padding: 8px;
  }
  
  .member-card.fan,
  .member-card.circular {
    min-width: 40px;
    max-width: 60px;
    padding: 4px;
  }
  
  .generation-badge {
    width: 16px;
    height: 16px;
    font-size: 7px;
  }
}
</style>

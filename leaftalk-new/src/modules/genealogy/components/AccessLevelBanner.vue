<template>
  <div v-if="showBanner" class="access-level-banner" :class="bannerClass">
    <div class="banner-content">
      <iconify-icon :icon="bannerIcon" width="16" :color="iconColor"></iconify-icon>
      <span class="banner-text">{{ bannerText }}</span>
      <button v-if="showCloseButton" @click="closeBanner" class="close-btn">
        <iconify-icon icon="heroicons:x-mark" width="14"></iconify-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  accessLevel: string
  familyType: string
  isOtherBranchMember: boolean
  autoHide?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoHide: true,
  duration: 5000
})

const showBanner = ref(true)

const bannerClass = computed(() => {
  switch (props.accessLevel) {
    case 'full':
      return 'banner-success'
    case 'admin':
      return 'banner-info'
    case 'tree_only':
      return 'banner-warning'
    default:
      return 'banner-error'
  }
})

const bannerIcon = computed(() => {
  switch (props.accessLevel) {
    case 'full':
      return 'heroicons:check-circle'
    case 'admin':
      return 'heroicons:shield-check'
    case 'tree_only':
      return 'heroicons:eye'
    default:
      return 'heroicons:exclamation-triangle'
  }
})

const iconColor = computed(() => {
  switch (props.accessLevel) {
    case 'full':
      return '#10b981'
    case 'admin':
      return '#3b82f6'
    case 'tree_only':
      return '#f59e0b'
    default:
      return '#ef4444'
  }
})

const bannerText = computed(() => {
  if (props.accessLevel === 'full') {
    return props.familyType === 'main' ? '您是总族谱成员，拥有完整访问权限' : '您是本分族谱成员，拥有完整访问权限'
  } else if (props.accessLevel === 'admin') {
    return '您是总族谱管理员，在此分族谱中拥有管理权限'
  } else if (props.accessLevel === 'tree_only') {
    return '您是其他分族谱成员，只能查看此分族谱的家族树结构'
  } else {
    return '您无权访问此族谱'
  }
})

const showCloseButton = computed(() => {
  return props.accessLevel === 'tree_only' || props.accessLevel === 'admin'
})

const closeBanner = () => {
  showBanner.value = false
}

onMounted(() => {
  if (props.autoHide && props.accessLevel !== 'none') {
    setTimeout(() => {
      showBanner.value = false
    }, props.duration)
  }
})
</script>

<style scoped>
.access-level-banner {
  margin: 16px 20px;
  border-radius: 8px;
  padding: 12px 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.banner-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.banner-warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
}

.banner-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.banner-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.banner-success .banner-text {
  color: #166534;
}

.banner-info .banner-text {
  color: #1e40af;
}

.banner-warning .banner-text {
  color: #92400e;
}

.banner-error .banner-text {
  color: #dc2626;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.banner-success .close-btn {
  color: #166534;
}

.banner-info .close-btn {
  color: #1e40af;
}

.banner-warning .close-btn {
  color: #92400e;
}

.banner-error .close-btn {
  color: #dc2626;
}
</style>

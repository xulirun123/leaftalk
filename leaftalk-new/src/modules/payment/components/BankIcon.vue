<template>
  <div class="bank-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- 工商银行 ICBC -->
    <svg v-if="bank === 'icbc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#C8102E"/>
      <text x="50" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">工商</text>
    </svg>

    <!-- 中国银行 BOC -->
    <svg v-else-if="bank === 'boc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#B8292F"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="white" stroke-width="3"/>
      <rect x="35" y="35" width="30" height="30" fill="none" stroke="white" stroke-width="3"/>
      <text x="50" y="95" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#B8292F" text-anchor="middle">中国银行</text>
    </svg>

    <!-- 建设银行 CCB -->
    <svg v-else-if="bank === 'ccb'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ccbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0066B3;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#004B87;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- 外圆 -->
      <circle cx="50" cy="50" r="48" fill="url(#ccbGradient)"/>
      <!-- 内方 -->
      <rect x="30" y="30" width="40" height="40" fill="none" stroke="white" stroke-width="4" rx="2"/>
      <!-- 两个C的重叠效果 -->
      <path d="M 65 35 Q 75 35 75 45 Q 75 55 65 55" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <path d="M 70 40 Q 80 40 80 50 Q 80 60 70 60" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
    </svg>

    <!-- 农业银行 ABC -->
    <svg v-else-if="bank === 'abc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="abcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00854A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#006838;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#abcGradient)"/>
      <!-- 麦穗图案 -->
      <path d="M 50 25 L 45 35 L 50 40 L 55 35 Z" fill="#FFD700"/>
      <path d="M 50 40 L 45 50 L 50 55 L 55 50 Z" fill="#FFD700"/>
      <path d="M 50 55 L 45 65 L 50 70 L 55 65 Z" fill="#FFD700"/>
      <ellipse cx="40" cy="45" rx="8" ry="12" fill="#FFD700" opacity="0.7"/>
      <ellipse cx="60" cy="45" rx="8" ry="12" fill="#FFD700" opacity="0.7"/>
    </svg>

    <!-- 默认银行图标 -->
    <svg v-else viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" :fill="color"/>
      <rect x="25" y="40" width="50" height="30" fill="white" rx="2"/>
      <rect x="25" y="50" width="50" height="3" :fill="color"/>
      <circle cx="70" cy="60" r="4" fill="white"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  bank: 'icbc' | 'boc' | 'ccb' | 'abc' | string
  size?: number
  color?: string
}

withDefaults(defineProps<Props>(), {
  size: 24,
  color: '#666'
})
</script>

<style scoped lang="scss">
.bank-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

svg {
  width: 100%;
  height: 100%;
}
</style>


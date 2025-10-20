<template>
  <div class="bank-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- 工商银行 ICBC - 两个工字组成 -->
    <svg v-if="bank === 'icbc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 外圆 -->
      <circle cx="50" cy="50" r="48" fill="none" stroke="#C8102E" stroke-width="3"/>
      <!-- 内圆 -->
      <circle cx="50" cy="50" r="38" fill="none" stroke="#C8102E" stroke-width="2"/>

      <!-- 左边的"工"字 -->
      <g transform="translate(30, 50)">
        <!-- 上横 -->
        <rect x="0" y="-15" width="18" height="3" fill="#C8102E"/>
        <!-- 中竖 -->
        <rect x="7.5" y="-12" width="3" height="24" fill="#C8102E"/>
        <!-- 下横 -->
        <rect x="0" y="9" width="18" height="3" fill="#C8102E"/>
      </g>

      <!-- 右边的"工"字 -->
      <g transform="translate(52, 50)">
        <!-- 上横 -->
        <rect x="0" y="-15" width="18" height="3" fill="#C8102E"/>
        <!-- 中竖 -->
        <rect x="7.5" y="-12" width="3" height="24" fill="#C8102E"/>
        <!-- 下横 -->
        <rect x="0" y="9" width="18" height="3" fill="#C8102E"/>
      </g>
    </svg>

    <!-- 中国银行 BOC - 古钱币造型 -->
    <svg v-else-if="bank === 'boc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 外圆 -->
      <circle cx="50" cy="50" r="48" fill="none" stroke="#B8292F" stroke-width="3"/>
      <!-- 内圆 -->
      <circle cx="50" cy="50" r="32" fill="none" stroke="#B8292F" stroke-width="2.5"/>

      <!-- 内方孔 -->
      <rect x="38" y="38" width="24" height="24" fill="none" stroke="#B8292F" stroke-width="2.5"/>

      <!-- 四个角的装饰 -->
      <circle cx="38" cy="38" r="2" fill="#B8292F"/>
      <circle cx="62" cy="38" r="2" fill="#B8292F"/>
      <circle cx="38" cy="62" r="2" fill="#B8292F"/>
      <circle cx="62" cy="62" r="2" fill="#B8292F"/>
    </svg>

    <!-- 建设银行 CCB - 古钱币+两个C -->
    <svg v-else-if="bank === 'ccb'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 外圆 -->
      <circle cx="50" cy="50" r="48" fill="none" stroke="#0066B3" stroke-width="3"/>

      <!-- 内方 -->
      <rect x="32" y="32" width="36" height="36" fill="none" stroke="#0066B3" stroke-width="2.5"/>

      <!-- 第一个C（左下） -->
      <path d="M 42 58 Q 35 58 35 50 Q 35 42 42 42"
            fill="none" stroke="#0066B3" stroke-width="3" stroke-linecap="round"/>

      <!-- 第二个C（右上，重叠） -->
      <path d="M 58 42 Q 65 42 65 50 Q 65 58 58 58"
            fill="none" stroke="#0066B3" stroke-width="3" stroke-linecap="round"/>

      <!-- 立体效果的阴影C -->
      <path d="M 60 40 Q 68 40 68 50 Q 68 60 60 60"
            fill="none" stroke="#0066B3" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    </svg>

    <!-- 农业银行 ABC - 麦穗图案 -->
    <svg v-else-if="bank === 'abc'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 外圆 -->
      <circle cx="50" cy="50" r="48" fill="none" stroke="#00854A" stroke-width="3"/>

      <!-- 中间的麦穗主干 -->
      <line x1="50" y1="25" x2="50" y2="75" stroke="#00854A" stroke-width="2.5"/>

      <!-- 左侧麦穗 -->
      <ellipse cx="38" cy="35" rx="6" ry="10" fill="#00854A" opacity="0.8"/>
      <ellipse cx="36" cy="45" rx="7" ry="11" fill="#00854A" opacity="0.8"/>
      <ellipse cx="38" cy="55" rx="6" ry="10" fill="#00854A" opacity="0.8"/>
      <ellipse cx="40" cy="65" rx="5" ry="8" fill="#00854A" opacity="0.8"/>

      <!-- 右侧麦穗 -->
      <ellipse cx="62" cy="35" rx="6" ry="10" fill="#00854A" opacity="0.8"/>
      <ellipse cx="64" cy="45" rx="7" ry="11" fill="#00854A" opacity="0.8"/>
      <ellipse cx="62" cy="55" rx="6" ry="10" fill="#00854A" opacity="0.8"/>
      <ellipse cx="60" cy="65" rx="5" ry="8" fill="#00854A" opacity="0.8"/>

      <!-- 麦穗顶部 -->
      <path d="M 50 25 L 45 30 L 50 28 L 55 30 Z" fill="#00854A"/>
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


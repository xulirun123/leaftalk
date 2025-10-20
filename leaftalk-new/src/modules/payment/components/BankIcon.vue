<template>
  <div class="bank-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      :src="bankLogoUrl"
      :alt="bank"
      class="bank-logo"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  bank: 'icbc' | 'boc' | 'ccb' | 'abc' | string
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: '#666'
})

const imageError = ref(false)

// 银行图标LOGO（使用本地图片路径）
// 请将真实的银行LOGO图片放在 public/images/banks/ 目录下
// 文件名：icbc.png, boc.png, ccb.png, abc.png
const bankLogos: Record<string, string> = {
  // 工商银行
  icbc: '/images/banks/icbc.png',

  // 中国银行
  boc: '/images/banks/boc.png',

  // 建设银行
  ccb: '/images/banks/ccb.png',

  // 农业银行
  abc: '/images/banks/abc.png'
}

const bankLogoUrl = computed(() => {
  if (imageError.value) {
    // 如果图片加载失败，返回占位图标
    return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzY2NiIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiR7cHJvcHMuYmFuay50b1VwcGVyQ2FzZSgpfTwvdGV4dD48L3N2Zz4=`
  }
  return bankLogos[props.bank] || bankLogos.icbc
})

const handleImageError = () => {
  console.error('Bank icon failed to load:', props.bank)
  imageError.value = true
}
</script>

<style scoped lang="scss">
.bank-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px;
}

.bank-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>


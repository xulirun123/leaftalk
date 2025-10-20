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

// 银行图标LOGO（使用本地SVG文件）
const bankLogos: Record<string, string> = {
  // 工商银行 - 双圆双工字
  icbc: '/images/banks/icbc.svg',

  // 中国银行 - 古钱币
  boc: '/images/banks/boc.svg',

  // 建设银行 - 蓝色C
  ccb: '/images/banks/ccb.svg',

  // 农业银行 - 麦穗
  abc: '/images/banks/abc.svg'
}

const bankLogoUrl = computed(() => {
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


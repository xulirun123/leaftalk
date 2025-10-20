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

// 银行图标LOGO（使用真实的银行LOGO PNG文件）
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


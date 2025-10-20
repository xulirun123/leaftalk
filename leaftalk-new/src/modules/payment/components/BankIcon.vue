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

// 银行图标LOGO（仅图标，不含文字）
const bankLogos: Record<string, string> = {
  // 工商银行 - 使用base64编码的SVG图标
  icbc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzgxMDJFIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzgxMDJFIiBzdHJva2Utd2lkdGg9IjIiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMCwgNTApIj48cmVjdCB4PSIwIiB5PSItMTUiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiBmaWxsPSIjQzgxMDJFIi8+PHJlY3QgeD0iNy41IiB5PSItMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjI0IiBmaWxsPSIjQzgxMDJFIi8+PHJlY3QgeD0iMCIgeT0iOSIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMiIGZpbGw9IiNDODEwMkUiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIsIDUwKSI+PHJlY3QgeD0iMCIgeT0iLTE1IiB3aWR0aD0iMTgiIGhlaWdodD0iMyIgZmlsbD0iI0M4MTAyRSIvPjxyZWN0IHg9IjcuNSIgeT0iLTEyIiB3aWR0aD0iMyIgaGVpZ2h0PSIyNCIgZmlsbD0iI0M4MTAyRSIvPjxyZWN0IHg9IjAiIHk9IjkiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiBmaWxsPSIjQzgxMDJFIi8+PC9nPjwvc3ZnPg==',

  // 中国银行 - 古钱币图标
  boc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjgyOTJGIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjgyOTJGIiBzdHJva2Utd2lkdGg9IjIuNSIvPjxyZWN0IHg9IjM4IiB5PSIzOCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNCODI5MkYiIHN0cm9rZS13aWR0aD0iMi41Ii8+PGNpcmNsZSBjeD0iMzgiIGN5PSIzOCIgcj0iMiIgZmlsbD0iI0I4MjkyRiIvPjxjaXJjbGUgY3g9IjYyIiBjeT0iMzgiIHI9IjIiIGZpbGw9IiNCODI5MkYiLz48Y2lyY2xlIGN4PSIzOCIgY3k9IjYyIiByPSIyIiBmaWxsPSIjQjgyOTJGIi8+PGNpcmNsZSBjeD0iNjIiIGN5PSI2MiIgcj0iMiIgZmlsbD0iI0I4MjkyRiIvPjwvc3ZnPg==',

  // 建设银行 - 蓝色C图标
  ccb: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iIzAwNjZCMyIvPjxwYXRoIGQ9Ik0gNzAgMzAgQSAyNSAyNSAwIDAgMSA3MCA3MCBMIDYwIDcwIEEgMTUgMTUgMCAwIDAgNjAgMzAgWiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNIDY1IDM1IEEgMjAgMjAgMCAwIDEgNjUgNjUgTCA1OCA2NSBBIDEzIDEzIDAgMCAwIDU4IDM1IFoiIGZpbGw9IiMwMDY2QjMiLz48cmVjdCB4PSIyNSIgeT0iNDIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiIHJ4PSIxIi8+PHJlY3QgeD0iMjgiIHk9IjQ1IiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMwMDY2QjMiIHJ4PSIwLjUiLz48L3N2Zz4=',

  // 农业银行 - 麦穗图标
  abc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA4NTRBIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNTAiIHkxPSIyNSIgeDI9IjUwIiB5Mj0iNzUiIHN0cm9rZT0iIzAwODU0QSIgc3Ryb2tlLXdpZHRoPSIyLjUiLz48ZWxsaXBzZSBjeD0iMzgiIGN5PSIzNSIgcng9IjYiIHJ5PSIxMCIgZmlsbD0iIzAwODU0QSIgb3BhY2l0eT0iMC44Ii8+PGVsbGlwc2UgY3g9IjM2IiBjeT0iNDUiIHJ4PSI3IiByeT0iMTEiIGZpbGw9IiMwMDg1NEEiIG9wYWNpdHk9IjAuOCIvPjxlbGxpcHNlIGN4PSIzOCIgY3k9IjU1IiByeD0iNiIgcnk9IjEwIiBmaWxsPSIjMDA4NTRBIiBvcGFjaXR5PSIwLjgiLz48ZWxsaXBzZSBjeD0iNDAiIGN5PSI2NSIgcng9IjUiIHJ5PSI4IiBmaWxsPSIjMDA4NTRBIiBvcGFjaXR5PSIwLjgiLz48ZWxsaXBzZSBjeD0iNjIiIGN5PSIzNSIgcng9IjYiIHJ5PSIxMCIgZmlsbD0iIzAwODU0QSIgb3BhY2l0eT0iMC44Ii8+PGVsbGlwc2UgY3g9IjY0IiBjeT0iNDUiIHJ4PSI3IiByeT0iMTEiIGZpbGw9IiMwMDg1NEEiIG9wYWNpdHk9IjAuOCIvPjxlbGxpcHNlIGN4PSI2MiIgY3k9IjU1IiByeD0iNiIgcnk9IjEwIiBmaWxsPSIjMDA4NTRBIiBvcGFjaXR5PSIwLjgiLz48ZWxsaXBzZSBjeD0iNjAiIGN5PSI2NSIgcng9IjUiIHJ5PSI4IiBmaWxsPSIjMDA4NTRBIiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNIDUwIDI1IEwgNDUgMzAgTCA1MCAyOCBMIDU1IDMwIFoiIGZpbGw9IiMwMDg1NEEiLz48L3N2Zz4='
}

const bankLogoUrl = computed(() => {
  return bankLogos[props.bank] || bankLogos.icbc
})

const handleImageError = () => {
  console.error('Bank icon failed to load:', props.bank)
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


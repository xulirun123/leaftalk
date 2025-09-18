<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    @scroll="handleScroll"
    :style="{ height: containerHeight + 'px' }"
  >
    <!-- 虚拟滚动区域 -->
    <div 
      class="virtual-scroll-content"
      :style="{ 
        height: totalHeight + 'px',
        paddingTop: offsetY + 'px'
      }"
    >
      <!-- 渲染可见项目 -->
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, startIndex + index)"
        class="virtual-scroll-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot 
          :item="item" 
          :index="startIndex + index"
          :isVisible="true"
        >
          {{ item }}
        </slot>
      </div>
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="loading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 无更多数据提示 -->
    <div v-if="!hasMore && items.length > 0" class="no-more-data">
      没有更多数据了
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
  buffer?: number
  threshold?: number
  loading?: boolean
  hasMore?: boolean
  keyField?: string
}

interface Emits {
  (e: 'loadMore'): void
  (e: 'scroll', scrollTop: number): void
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5,
  threshold: 100,
  loading: false,
  hasMore: true,
  keyField: 'id'
})

const emit = defineEmits<Emits>()

// 响应式引用
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const isScrolling = ref(false)
const scrollTimer = ref<number>()

// 计算属性
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2
)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value
  return Math.min(props.items.length, index)
})

const visibleItems = computed(() => 
  props.items.slice(startIndex.value, endIndex.value)
)

const offsetY = computed(() => startIndex.value * props.itemHeight)

// 方法
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  emit('scroll', scrollTop.value)
  
  // 检查是否需要加载更多
  if (props.hasMore && !props.loading) {
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    if (scrollBottom <= props.threshold) {
      emit('loadMore')
    }
  }
  
  // 设置滚动状态
  isScrolling.value = true
  clearTimeout(scrollTimer.value)
  scrollTimer.value = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)
}

const getItemKey = (item: any, index: number) => {
  if (props.keyField && item[props.keyField]) {
    return item[props.keyField]
  }
  return index
}

const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior
  })
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(0, behavior)
}

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  containerRef.value.scrollTo({
    top: totalHeight.value,
    behavior
  })
}

// 监听项目变化，重置滚动位置
watch(() => props.items.length, (newLength, oldLength) => {
  // 如果是新增数据（加载更多），保持当前滚动位置
  // 如果是重新加载数据，滚动到顶部
  if (newLength < oldLength || newLength === 0) {
    nextTick(() => {
      scrollToTop('auto')
    })
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getScrollTop: () => scrollTop.value,
  getVisibleRange: () => ({ start: startIndex.value, end: endIndex.value })
})

// 生命周期
onMounted(() => {
  // 初始化滚动位置
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
})

onUnmounted(() => {
  clearTimeout(scrollTimer.value)
})
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-scroll-item {
  width: 100%;
  box-sizing: border-box;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
}

/* 隐藏滚动条但保持滚动功能 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.virtual-scroll-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 优化滚动性能 */
.virtual-scroll-container {
  will-change: scroll-position;
  transform: translateZ(0);
}

.virtual-scroll-item {
  will-change: transform;
  transform: translateZ(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-indicator {
    padding: 16px;
    font-size: 13px;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    margin-right: 6px;
  }
  
  .no-more-data {
    padding: 16px;
    font-size: 13px;
  }
}
</style>

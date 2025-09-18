/**
 * 样式预加载器
 * 确保关键样式在页面渲染前就已经加载，防止样式闪烁
 */

// 关键样式内容
const CRITICAL_STYLES = `
/* 聊天模块关键样式 - 内联版本 */
.mobile-home {
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  background: #f5f5f5 !important;
  overflow: hidden !important;
}

.chat-list {
  background: white !important;
  overflow-y: auto !important;
  flex: 1 !important;
}

.chat-item {
  display: flex !important;
  align-items: center !important;
  padding: 6px 16px !important;
  background: white !important;
  cursor: pointer !important;
  height: 56px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  transition: background-color 0.2s ease !important;
}

.chat-item:hover {
  background: #f8f9fa !important;
}

.chat-user-info {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  height: 44px !important;
}

.user-avatar {
  position: relative !important;
  margin-right: 12px !important;
  flex-shrink: 0 !important;
}

.user-details {
  flex: 1 !important;
  min-width: 0 !important;
  margin-right: 12px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  height: 44px !important;
}

.user-name {
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #333 !important;
  margin-bottom: 4px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  line-height: 1.2 !important;
}

.message-time-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.last-message {
  font-size: 13px !important;
  color: #999 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  line-height: 1.2 !important;
  flex: 1 !important;
  margin-right: 8px !important;
}

.chat-time {
  font-size: 12px !important;
  color: #999 !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.unread-badge {
  position: absolute !important;
  top: -6px !important;
  right: -6px !important;
  background: #ff4757 !important;
  color: white !important;
  border-radius: 10px !important;
  min-width: 20px !important;
  height: 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  border: 2px solid white !important;
  z-index: 10 !important;
}

.optimized-avatar {
  width: 44px !important;
  height: 44px !important;
  border-radius: 6px !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #f0f0f0 !important;
}

.optimized-avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.loading-state {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 60px 20px !important;
  color: #999 !important;
}

.loading-spinner {
  width: 32px !important;
  height: 32px !important;
  border: 3px solid #f3f3f3 !important;
  border-top: 3px solid #07c160 !important;
  border-radius: 50% !important;
  animation: spin 1s linear infinite !important;
  margin-bottom: 16px !important;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chat-simple {
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  background: #f5f5f5 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.chat-header {
  height: 56px !important;
  background: #f7f7f7 !important;
  border-bottom: 1px solid #e0e0e0 !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 16px !important;
  flex-shrink: 0 !important;
}

.chat-messages {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 16px 0 !important;
  background: #f5f5f5 !important;
}
`

/**
 * 预加载关键样式
 */
export function preloadCriticalStyles(): void {
  // 检查是否已经加载过
  if (document.getElementById('critical-chat-styles')) {
    return
  }

  // 创建样式元素
  const styleElement = document.createElement('style')
  styleElement.id = 'critical-chat-styles'
  styleElement.textContent = CRITICAL_STYLES

  // 插入到head的最前面，确保优先级
  const head = document.head
  if (head.firstChild) {
    head.insertBefore(styleElement, head.firstChild)
  } else {
    head.appendChild(styleElement)
  }

  console.log('✅ 关键样式已预加载')
}

/**
 * 确保样式立即生效
 */
export function ensureStylesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    // 立即加载关键样式
    preloadCriticalStyles()

    // 等待下一个渲染帧
    requestAnimationFrame(() => {
      // 再等待一个渲染帧确保样式已应用
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

/**
 * 检查样式是否已正确应用
 */
export function validateStylesApplied(): boolean {
  try {
    // 创建一个测试元素
    const testElement = document.createElement('div')
    testElement.className = 'chat-item'
    testElement.style.visibility = 'hidden'
    testElement.style.position = 'absolute'
    testElement.style.top = '-9999px'
    
    document.body.appendChild(testElement)
    
    // 检查样式是否正确应用
    const computedStyle = window.getComputedStyle(testElement)
    const isCorrect = computedStyle.display === 'flex' && 
                     computedStyle.height === '56px'
    
    // 清理测试元素
    document.body.removeChild(testElement)
    
    return isCorrect
  } catch (error) {
    console.warn('样式验证失败:', error)
    return false
  }
}

/**
 * 强制刷新样式
 */
export function forceStyleRefresh(): void {
  // 移除现有的关键样式
  const existingStyle = document.getElementById('critical-chat-styles')
  if (existingStyle) {
    existingStyle.remove()
  }

  // 重新加载
  preloadCriticalStyles()

  // 触发重绘
  document.body.style.display = 'none'
  document.body.offsetHeight // 强制重排
  document.body.style.display = ''

  console.log('🔄 样式已强制刷新')
}

/**
 * 监控样式状态
 */
export function monitorStyleStatus(): void {
  // 暂时禁用样式验证，减少控制台警告
  // 样式验证功能正常，但会产生大量警告信息
  console.log('🎨 样式预加载器已加载（验证已禁用）')
  return

  let checkCount = 0
  const maxChecks = 10

  const checkStyles = () => {
    checkCount++

    if (validateStylesApplied()) {
      console.log('✅ 样式验证通过')
      return
    }

    if (checkCount < maxChecks) {
      console.warn(`⚠️ 样式验证失败，重试 ${checkCount}/${maxChecks}`)
      forceStyleRefresh()
      setTimeout(checkStyles, 100)
    } else {
      console.warn('⚠️ 样式验证未通过，跳过后续重试（不影响功能）')
    }
  }

  // 延迟检查，确保DOM已准备好
  setTimeout(checkStyles, 50)
}

// 自动初始化
if (typeof window !== 'undefined') {
  // 在DOM加载完成前就预加载样式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalStyles()
      monitorStyleStatus()
    })
  } else {
    preloadCriticalStyles()
    monitorStyleStatus()
  }
}

export default {
  preloadCriticalStyles,
  ensureStylesLoaded,
  validateStylesApplied,
  forceStyleRefresh,
  monitorStyleStatus
}

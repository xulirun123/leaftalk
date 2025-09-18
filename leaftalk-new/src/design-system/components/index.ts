/**
 * 设计系统组件导出
 */

// 基础组件
export { default as Button } from './Button.vue'
export { default as LoadingSpinner } from './LoadingSpinner.vue'

// 头像和用户相关
export { default as AvatarPreloader } from './AvatarPreloader.vue'
export { default as OptimizedAvatar } from './OptimizedAvatar.vue'
export { default as UnifiedAvatar } from './UnifiedAvatar.vue'
export { default as UnifiedUserInfo } from './UnifiedUserInfo.vue'

// 对话框和模态框
export { default as ConfirmDialog } from './ConfirmDialog.vue'
export { default as PolicyModal } from './PolicyModal.vue'

// 状态组件
export { default as EmptyState } from './EmptyState.vue'
export { default as ErrorBoundary } from './ErrorBoundary.vue'

// 工具组件
export { default as FallbackIcon } from './FallbackIcon.vue'
export { default as ToggleSwitch } from './ToggleSwitch.vue'

// 不再导出图标相关类型，使用UnifiedIcon系统

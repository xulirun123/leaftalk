// 全局弹窗管理器
import { createApp, ref, h } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'

interface DialogOptions {
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  closeOnOverlay?: boolean
}

interface DialogInstance {
  visible: boolean
  title?: string
  content: string
  confirmText: string
  cancelText: string
  showCancel: boolean
  closeOnOverlay: boolean
  resolve?: (value: boolean) => void
}

// 全局弹窗状态
const dialogState = ref<DialogInstance>({
  visible: false,
  content: '',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  closeOnOverlay: true
})

// 弹窗容器
let dialogContainer: HTMLElement | null = null
let dialogApp: any = null

// 初始化弹窗容器
function initDialogContainer() {
  if (dialogContainer) return

  dialogContainer = document.createElement('div')
  dialogContainer.id = 'global-dialog-container'
  document.body.appendChild(dialogContainer)

  // 创建Vue应用实例
  dialogApp = createApp({
    setup() {
      const handleConfirm = () => {
        if (dialogState.value.resolve) {
          dialogState.value.resolve(true)
        }
        dialogState.value.visible = false
      }

      const handleCancel = () => {
        if (dialogState.value.resolve) {
          dialogState.value.resolve(false)
        }
        dialogState.value.visible = false
      }

      return {
        dialogState,
        handleConfirm,
        handleCancel
      }
    },
    render() {
      return h(ConfirmDialog, {
        visible: this.dialogState.visible,
        title: this.dialogState.title,
        content: this.dialogState.content,
        confirmText: this.dialogState.confirmText,
        cancelText: this.dialogState.cancelText,
        showCancel: this.dialogState.showCancel,
        closeOnOverlay: this.dialogState.closeOnOverlay,
        onConfirm: this.handleConfirm,
        onCancel: this.handleCancel
      })
    }
  })

  dialogApp.mount(dialogContainer)
}

// 显示确认弹窗
export function showConfirm(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // 确保弹窗容器已初始化
    initDialogContainer()

    // 更新弹窗状态
    dialogState.value = {
      visible: true,
      title: options.title || '提示',
      content: options.content || '确定要执行此操作吗？',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      showCancel: options.showCancel !== false,
      closeOnOverlay: options.closeOnOverlay !== false,
      resolve
    }
  })
}

// 显示提示弹窗（只有确定按钮）
export function showAlert(content: string, title?: string): Promise<boolean> {
  return showConfirm({
    title,
    content,
    showCancel: false,
    confirmText: '确定'
  })
}

// 替换原生confirm
export function confirmReplace(message: string): Promise<boolean> {
  return showConfirm({
    content: message,
    confirmText: '确定',
    cancelText: '取消'
  })
}

// 替换原生alert
export function alertReplace(message: string): Promise<boolean> {
  return showAlert(message)
}

// 销毁弹窗容器（用于应用卸载时清理）
export function destroyDialogContainer() {
  if (dialogApp) {
    dialogApp.unmount()
    dialogApp = null
  }
  if (dialogContainer) {
    document.body.removeChild(dialogContainer)
    dialogContainer = null
  }
}

// 全局安装函数，用于替换原生弹窗
export function installGlobalDialog() {
  // 替换全局的 confirm 和 alert
  if (typeof window !== 'undefined') {
    // 保存原始函数
    const originalConfirm = window.confirm
    const originalAlert = window.alert

    // 替换为自定义弹窗（注意：这会改变confirm的行为，从同步变为异步）
    window.confirm = (message: string) => {
      console.warn('使用了原生confirm，建议使用自定义弹窗。注意：这是异步操作！')
      // 对于全局替换，我们需要返回Promise，但这会破坏原有的同步行为
      // 建议直接使用 showConfirm 而不是依赖全局替换
      confirmReplace(message).then(result => {
        console.log('弹窗结果:', result)
      })
      return true // 临时返回true，避免阻塞
    }

    window.alert = (message: string) => {
      console.warn('使用了原生alert，建议使用自定义弹窗')
      alertReplace(message)
    }

    // 提供恢复原始函数的方法
    return () => {
      window.confirm = originalConfirm
      window.alert = originalAlert
    }
  }
}

// 导出默认对象
export default {
  showConfirm,
  showAlert,
  confirmReplace,
  alertReplace,
  destroyDialogContainer,
  installGlobalDialog
}

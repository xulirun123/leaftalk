/**
 * 对话框工具
 * 提供全局对话框管理功能
 */

import dialog from './dialog'

/**
 * 安装全局对话框
 */
export function installGlobalDialog(): void {
  // 将对话框方法挂载到全局
  if (typeof window !== 'undefined') {
    try {
      // 直接使用本地函数，避免dialog对象问题
      (window as any).$confirm = showConfirm
      (window as any).$alert = showAlert
      console.log('✅ 全局对话框已安装')
    } catch (error) {
      console.error('❌ 安装全局对话框失败:', error)
    }
  }
}

/**
 * 显示确认对话框
 */
export async function showConfirm(
  content: string,
  title: string = '确认',
  options: any = {}
): Promise<boolean> {
  try {
    return await dialog.showConfirm(content, title, options)
  } catch (error) {
    console.error('显示确认对话框失败:', error)
    return false
  }
}

/**
 * 显示警告对话框
 */
export async function showAlert(
  content: string,
  title: string = '提示',
  options: any = {}
): Promise<void> {
  try {
    await dialog.showAlert(content, title, options)
  } catch (error) {
    console.error('显示警告对话框失败:', error)
  }
}

// 导出dialog实例
export { default as dialog } from './dialog'

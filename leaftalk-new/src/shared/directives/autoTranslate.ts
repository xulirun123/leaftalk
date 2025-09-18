/**
 * 自动翻译指令
 * 使用方法：v-auto-translate 或 v-auto-translate="'目标语言'"
 */

import { Directive, DirectiveBinding } from 'vue'
import { autoTranslationService } from '../services/autoTranslationService'

interface AutoTranslateElement extends HTMLElement {
  _autoTranslateData?: {
    originalText: string
    isTranslating: boolean
    observer?: MutationObserver
  }
}

// 翻译缓存
const translationCache = new Map<string, string>()

// 需要跳过的元素选择器
const skipSelectors = [
  'script',
  'style',
  'noscript',
  'code',
  'pre',
  '.no-translate',
  '[data-no-translate]',
  '[contenteditable]',
  'input',
  'textarea',
  'select'
]

// 检查元素是否应该跳过翻译
function shouldSkipElement(element: Element): boolean {
  return skipSelectors.some(selector => {
    if (selector.startsWith('.') || selector.startsWith('[')) {
      return element.matches(selector)
    }
    return element.tagName.toLowerCase() === selector
  })
}

// 获取元素的文本内容（排除子元素）
function getDirectTextContent(element: Element): string {
  let text = ''
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
    }
  }
  return text.trim()
}

// 翻译文本
async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || text.length < 2) return text
  
  const cacheKey = `${text}-${targetLanguage}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  try {
    const result = await autoTranslationService.translateText(text, targetLanguage)
    const translatedText = result.translatedText
    
    // 缓存翻译结果
    translationCache.set(cacheKey, translatedText)
    
    return translatedText
  } catch (error) {
    console.warn('自动翻译失败:', error)
    return text
  }
}

// 翻译元素内容
async function translateElement(element: AutoTranslateElement, targetLanguage: string) {
  if (shouldSkipElement(element)) return
  
  const data = element._autoTranslateData
  if (!data || data.isTranslating) return
  
  data.isTranslating = true
  
  try {
    // 翻译直接文本内容
    const directText = getDirectTextContent(element)
    if (directText) {
      const translatedText = await translateText(directText, targetLanguage)
      if (translatedText !== directText) {
        // 替换文本节点
        for (const node of element.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            node.textContent = translatedText
            break
          }
        }
      }
    }
    
    // 翻译属性
    const attributesToTranslate = ['title', 'alt', 'placeholder']
    for (const attr of attributesToTranslate) {
      const value = element.getAttribute(attr)
      if (value && value.trim()) {
        const translatedValue = await translateText(value, targetLanguage)
        if (translatedValue !== value) {
          element.setAttribute(attr, translatedValue)
        }
      }
    }
    
  } finally {
    data.isTranslating = false
  }
}

// 翻译元素及其子元素
async function translateElementTree(element: AutoTranslateElement, targetLanguage: string) {
  // 翻译当前元素
  await translateElement(element, targetLanguage)
  
  // 翻译子元素
  const children = Array.from(element.children) as AutoTranslateElement[]
  for (const child of children) {
    if (!shouldSkipElement(child)) {
      await translateElementTree(child, targetLanguage)
    }
  }
}

// 自动翻译指令
export const autoTranslateDirective: Directive<AutoTranslateElement> = {
  mounted(el: AutoTranslateElement, binding: DirectiveBinding) {
    // 保存原始文本
    const originalText = el.textContent || ''
    
    el._autoTranslateData = {
      originalText,
      isTranslating: false
    }
    
    // 获取目标语言
    const targetLanguage = binding.value || 
      document.documentElement.lang || 
      navigator.language || 
      'en'
    
    // 开始翻译
    translateElementTree(el, targetLanguage)
    
    // 监听内容变化
    const observer = new MutationObserver((mutations) => {
      let shouldRetranslate = false
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldRetranslate = true
          break
        }
      }
      
      if (shouldRetranslate) {
        setTimeout(() => {
          translateElementTree(el, targetLanguage)
        }, 100)
      }
    })
    
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    })
    
    el._autoTranslateData.observer = observer
  },
  
  updated(el: AutoTranslateElement, binding: DirectiveBinding) {
    const targetLanguage = binding.value || 
      document.documentElement.lang || 
      navigator.language || 
      'en'
    
    // 重新翻译
    setTimeout(() => {
      translateElementTree(el, targetLanguage)
    }, 50)
  },
  
  unmounted(el: AutoTranslateElement) {
    // 清理观察器
    if (el._autoTranslateData?.observer) {
      el._autoTranslateData.observer.disconnect()
    }
    
    // 清理数据
    delete el._autoTranslateData
  }
}

// 全局自动翻译函数
export async function autoTranslatePage(targetLanguage?: string) {
  const lang = targetLanguage || 
    document.documentElement.lang || 
    navigator.language || 
    'en'
  
  // 获取所有需要翻译的元素
  const elements = document.querySelectorAll('*:not(script):not(style):not(noscript)')
  
  for (const element of elements) {
    if (!shouldSkipElement(element)) {
      const textContent = getDirectTextContent(element)
      if (textContent && textContent.length > 1) {
        try {
          const translatedText = await translateText(textContent, lang)
          if (translatedText !== textContent) {
            // 替换文本内容
            for (const node of element.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                node.textContent = translatedText
                break
              }
            }
          }
        } catch (error) {
          console.warn('翻译元素失败:', element, error)
        }
      }
    }
  }
}

// 智能翻译混入
export const autoTranslateMixin = {
  mounted() {
    // 页面加载完成后自动翻译
    this.$nextTick(() => {
      const targetLanguage = this.$i18n?.locale || 
        document.documentElement.lang || 
        navigator.language || 
        'en'
      
      if (targetLanguage !== 'zh-CN') {
        autoTranslatePage(targetLanguage)
      }
    })
  },
  
  methods: {
    async autoTranslateCurrentPage(targetLanguage?: string) {
      await autoTranslatePage(targetLanguage)
    }
  }
}

export default autoTranslateDirective

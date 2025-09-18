/**
 * 语言包管理中心
 *
 * 这里可以导入和管理所有的语言包
 * 新增语言包时，只需要在这里导入并注册即可
 */

// 支持的语言类型
export type LanguageCode = 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR'

// 动态导入语言包，避免循环依赖
const loadLanguagePack = async (lang: LanguageCode) => {
  try {
    switch (lang) {
      case 'zh-CN':
        return (await import('./zh-CN')).default
      case 'en-US':
        return (await import('./en-US')).default
      case 'zh-TW':
        return (await import('./zh-TW')).default
      case 'ja-JP':
        return (await import('./ja-JP')).default
      case 'ko-KR':
        return (await import('./ko-KR')).default
      default:
        return (await import('./zh-CN')).default
    }
  } catch (error) {
    console.error(`Failed to load language pack: ${lang}`, error)
    return (await import('./zh-CN')).default
  }
}

// 语言包缓存
const languagePackCache = new Map<LanguageCode, Record<string, any>>()

/**
 * 获取语言包
 */
export async function getLanguagePack(lang: LanguageCode) {
  // 检查缓存
  if (languagePackCache.has(lang)) {
    return languagePackCache.get(lang)!
  }

  // 动态加载语言包
  const pack = await loadLanguagePack(lang)
  languagePackCache.set(lang, pack)
  return pack
}

/**
 * 注册新的语言包
 */
export function registerLanguagePack(lang: LanguageCode, pack: Record<string, any>) {
  const existingPack = languagePackCache.get(lang)
  if (existingPack) {
    // 深度合并
    deepMerge(existingPack, pack)
  } else {
    languagePackCache.set(lang, pack)
  }
}

/**
 * 深度合并对象
 */
function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
}

/**
 * 预加载所有语言包
 */
export async function preloadAllLanguagePacks() {
  const languages: LanguageCode[] = ['zh-CN', 'en-US', 'zh-TW', 'ja-JP', 'ko-KR']
  await Promise.all(languages.map(lang => getLanguagePack(lang)))
}

// 导出语言包获取函数作为默认导出
export default getLanguagePack

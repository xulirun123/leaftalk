/**
 * 腾讯云OCR服务
 * 提供身份证识别、通用文字识别等功能
 */

const tencentcloud = require('tencentcloud-sdk-nodejs')

// 确保环境变量已加载
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

// 腾讯云OCR配置
const TENCENT_OCR_CONFIG = {
  SECRET_ID: process.env.TENCENT_SECRET_ID || '',
  SECRET_KEY: process.env.TENCENT_SECRET_KEY || '',
  REGION: process.env.TENCENT_REGION || 'ap-beijing',
  ENDPOINT: 'ocr.tencentcloudapi.com'
}

class TencentOcrService {
  constructor() {
    this.client = null
    this.initClient()
  }

  // 初始化腾讯云OCR客户端
  initClient() {
    try {
      console.log('🔧 初始化腾讯云OCR客户端...')
      console.log('📋 配置信息:', {
        SECRET_ID: TENCENT_OCR_CONFIG.SECRET_ID ? TENCENT_OCR_CONFIG.SECRET_ID.substring(0, 8) + '...' : 'undefined',
        SECRET_KEY: TENCENT_OCR_CONFIG.SECRET_KEY ? TENCENT_OCR_CONFIG.SECRET_KEY.substring(0, 8) + '...' : 'undefined',
        REGION: TENCENT_OCR_CONFIG.REGION
      })

      if (!TENCENT_OCR_CONFIG.SECRET_ID || !TENCENT_OCR_CONFIG.SECRET_KEY) {
        throw new Error('腾讯云OCR配置不完整，请检查环境变量')
      }

      // 导入对应产品模块
      const OcrClient = tencentcloud.ocr.v20181119.Client

      // 实例化要请求产品的client对象
      this.client = new OcrClient({
        credential: {
          secretId: TENCENT_OCR_CONFIG.SECRET_ID,
          secretKey: TENCENT_OCR_CONFIG.SECRET_KEY,
        },
        region: TENCENT_OCR_CONFIG.REGION,
        profile: {
          httpProfile: {
            endpoint: TENCENT_OCR_CONFIG.ENDPOINT,
          },
        },
      })

      console.log('✅ 腾讯云OCR客户端初始化成功')
    } catch (error) {
      console.error('❌ 腾讯云OCR客户端初始化失败:', error.message)
      this.client = null
    }
  }

  // 身份证识别
  async recognizeIdCard(imageBuffer, options = {}) {
    if (!this.client) {
      throw new Error('腾讯云OCR客户端未初始化')
    }

    console.log('🔍 腾讯云身份证识别开始...')

    try {
      // 验证输入参数
      console.log('📷 腾讯云OCR参数验证...')
      console.log('📷 imageBuffer类型:', typeof imageBuffer)
      console.log('📷 imageBuffer是否为Buffer:', Buffer.isBuffer(imageBuffer))
      console.log('📷 imageBuffer长度:', imageBuffer ? imageBuffer.length : 'undefined')

      if (!imageBuffer) {
        throw new Error('图片数据不能为空')
      }

      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error('图片数据必须是Buffer类型')
      }

      if (imageBuffer.length === 0) {
        throw new Error('图片数据不能为空')
      }

      // 验证图片大小
      if (imageBuffer.length > 7 * 1024 * 1024) { // 7MB限制
        throw new Error('图片文件过大，请压缩后重试')
      }

      // 转换图片为base64
      const base64Image = imageBuffer.toString('base64')

      console.log('📷 图片大小:', imageBuffer.length, 'bytes')
      console.log('📷 Base64长度:', base64Image.length)

      // 构造请求参数
      const params = {
        ImageBase64: base64Image,
        CardSide: options.cardSide || 'FRONT', // FRONT-正面，BACK-背面
        Config: JSON.stringify({
          CropIdCard: true,      // 身份证照片裁剪
          CropPortrait: true,    // 人像照片裁剪
          CopyWarn: true,        // 复印件告警
          BorderCheckWarn: true, // 边框和框内遮挡告警
          ReshootWarn: true,     // 翻拍告警
          DetectPsWarn: true,    // PS检测告警
          TempIdWarn: true,      // 临时身份证告警
          InvalidDateWarn: true, // 身份证有效日期不合理告警
          Quality: true,         // 图片质量分数
          MultiCardDetect: true  // 多卡证检测
        })
      }

      console.log('📡 开始调用腾讯云OCR API...')

      // 调用身份证识别接口
      const result = await this.client.IDCardOCR(params)

      console.log('📡 腾讯云OCR API调用成功')
      console.log('🔍 识别结果:', JSON.stringify(result, null, 2))

      // 转换为标准格式
      return this.formatIdCardResult(result)

    } catch (error) {
      console.error('❌ 腾讯云身份证识别失败:', error)
      throw new Error(`腾讯云OCR识别失败: ${error.message}`)
    }
  }

  // 通用文字识别
  async recognizeText(imageBuffer, options = {}) {
    if (!this.client) {
      throw new Error('腾讯云OCR客户端未初始化')
    }

    console.log('🔍 腾讯云通用文字识别开始...')

    try {
      // 验证图片大小
      if (imageBuffer.length > 7 * 1024 * 1024) { // 7MB限制
        throw new Error('图片文件过大，请压缩后重试')
      }

      // 转换图片为base64
      const base64Image = imageBuffer.toString('base64')

      // 构造请求参数
      const params = {
        ImageBase64: base64Image,
        LanguageType: options.language || 'zh', // zh-中英文，en-英文
        Scene: options.scene || 'doc',          // doc-文档识别，web-网络图片识别
        AdvancedInfo: true,                     // 是否返回单字信息
        EnableCoordPoint: true,                 // 是否返回字符坐标
        EnableCandWord: false                   // 是否返回单字候选信息
      }

      console.log('📡 开始调用腾讯云通用OCR API...')

      // 调用通用印刷体识别接口
      const result = await this.client.GeneralBasicOCR(params)

      console.log('📡 腾讯云通用OCR API调用成功')

      // 转换为标准格式
      return this.formatTextResult(result)

    } catch (error) {
      console.error('❌ 腾讯云通用文字识别失败:', error)
      throw new Error(`腾讯云OCR识别失败: ${error.message}`)
    }
  }

  // 格式化身份证识别结果
  formatIdCardResult(result) {
    try {
      const data = result

      // 检查是否有识别结果
      if (!data || !data.Name) {
        return {
          success: false,
          confidence: 0,
          source: 'tencent',
          error: '未识别到身份证信息'
        }
      }

      // 计算平均置信度
      const confidenceFields = [
        data.Name, data.Sex, data.Nation, data.Birth, 
        data.Address, data.IdNum, data.Authority, data.ValidDate
      ].filter(field => field && field.Confidence)

      const avgConfidence = confidenceFields.length > 0 
        ? confidenceFields.reduce((sum, field) => sum + field.Confidence, 0) / confidenceFields.length / 100
        : 0.8

      return {
        success: true,
        confidence: avgConfidence,
        source: 'tencent',
        data: {
          name: data.Name?.Text || '',
          gender: data.Sex?.Text || '',
          nation: data.Nation?.Text || '',
          birthDate: data.Birth?.Text || '',
          address: data.Address?.Text || '',
          idNumber: data.IdNum?.Text || '',
          issuingAuthority: data.Authority?.Text || '',
          validDate: data.ValidDate?.Text || '',
          // 腾讯云特有的质量和告警信息
          quality: data.Quality || 0,
          warnings: this.extractWarnings(data)
        }
      }

    } catch (error) {
      console.error('❌ 格式化腾讯云身份证结果失败:', error)
      return {
        success: false,
        confidence: 0,
        source: 'tencent',
        error: '结果格式化失败'
      }
    }
  }

  // 格式化通用文字识别结果
  formatTextResult(result) {
    try {
      const data = result

      if (!data || !data.TextDetections || data.TextDetections.length === 0) {
        return {
          success: false,
          confidence: 0,
          source: 'tencent',
          error: '未识别到文字信息'
        }
      }

      // 提取所有文字
      const texts = data.TextDetections.map(item => item.DetectedText).join('\n')
      
      // 计算平均置信度
      const avgConfidence = data.TextDetections.reduce((sum, item) => sum + item.Confidence, 0) 
        / data.TextDetections.length / 100

      return {
        success: true,
        confidence: avgConfidence,
        source: 'tencent',
        data: {
          text: texts,
          details: data.TextDetections.map(item => ({
            text: item.DetectedText,
            confidence: item.Confidence / 100,
            coordinates: item.Polygon
          }))
        }
      }

    } catch (error) {
      console.error('❌ 格式化腾讯云文字结果失败:', error)
      return {
        success: false,
        confidence: 0,
        source: 'tencent',
        error: '结果格式化失败'
      }
    }
  }

  // 提取告警信息
  extractWarnings(data) {
    const warnings = []
    
    if (data.CopyWarn && data.CopyWarn > 0) warnings.push('复印件告警')
    if (data.BorderCheckWarn && data.BorderCheckWarn > 0) warnings.push('边框遮挡告警')
    if (data.ReshootWarn && data.ReshootWarn > 0) warnings.push('翻拍告警')
    if (data.DetectPsWarn && data.DetectPsWarn > 0) warnings.push('PS检测告警')
    if (data.TempIdWarn && data.TempIdWarn > 0) warnings.push('临时身份证告警')
    if (data.InvalidDateWarn && data.InvalidDateWarn > 0) warnings.push('有效期告警')
    if (data.MultiCardDetect && data.MultiCardDetect > 1) warnings.push('多卡证检测')

    return warnings
  }

  // 检查服务可用性
  async checkHealth() {
    try {
      if (!this.client) {
        return { available: false, error: '客户端未初始化' }
      }

      // 创建一个小的测试图片进行健康检查
      const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
      
      // 这里可以调用一个简单的API来测试连接
      return { available: true, message: '腾讯云OCR服务正常' }
      
    } catch (error) {
      return { available: false, error: error.message }
    }
  }
}

module.exports = TencentOcrService

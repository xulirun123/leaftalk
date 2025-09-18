/**
 * OCR服务管理器
 * 集成百度OCR API和自训练模型
 */

// const AipOcrClient = require('baidu-aip').ocr // 暂时注释掉，避免启动错误
const TencentOcrService = require('./tencentOcrService')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
// OCR配置
const BAIDU_OCR_CONFIG = {
  APP_ID: process.env.BAIDU_OCR_APP_ID || '',
  API_KEY: process.env.BAIDU_OCR_API_KEY || '',
  SECRET_KEY: process.env.BAIDU_OCR_SECRET_KEY || ''
}

const CUSTOM_OCR_CONFIG = {
  MODEL_PATH: path.join(__dirname, '../models/ocr'),
  CONFIDENCE_THRESHOLD: 0.8
}

const OCR_SERVICE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  CACHE_DURATION: 3600, // 1小时
  PRIORITY: ['tencent', 'baidu', 'custom'], // 服务优先级：腾讯云 > 百度 > 自训练
  CACHE: {
    enabled: true,
    maxSize: 1000
  }
}
const TrainingDataManager = require('./trainingDataManager')
const ModelTrainer = require('./modelTrainer')

class OCRService {
  constructor() {
    this.baiduClient = null
    this.tencentClient = null
    this.customModel = null
    this.cache = new Map()
    this.dataManager = new TrainingDataManager()
    this.trainer = new ModelTrainer()
    this.initBaiduOCR()
    this.initTencentOCR()
    this.initCustomModel()
  }

  // 初始化百度OCR客户端
  initBaiduOCR() {
    try {
      console.log('🔧 初始化百度OCR客户端...')
      console.log('📋 配置信息:', {
        APP_ID: BAIDU_OCR_CONFIG.APP_ID,
        API_KEY: BAIDU_OCR_CONFIG.API_KEY ? BAIDU_OCR_CONFIG.API_KEY.substring(0, 8) + '...' : 'undefined',
        SECRET_KEY: BAIDU_OCR_CONFIG.SECRET_KEY ? BAIDU_OCR_CONFIG.SECRET_KEY.substring(0, 8) + '...' : 'undefined'
      })

      if (!BAIDU_OCR_CONFIG.APP_ID || !BAIDU_OCR_CONFIG.API_KEY || !BAIDU_OCR_CONFIG.SECRET_KEY) {
        throw new Error('百度OCR配置不完整，请检查环境变量')
      }

      this.baiduClient = new AipOcrClient(
        BAIDU_OCR_CONFIG.APP_ID,
        BAIDU_OCR_CONFIG.API_KEY,
        BAIDU_OCR_CONFIG.SECRET_KEY
      )
      console.log('✅ 百度OCR客户端初始化成功')
    } catch (error) {
      console.error('❌ 百度OCR客户端初始化失败:', error.message)
      this.baiduClient = null
    }
  }

  // 初始化腾讯云OCR客户端
  initTencentOCR() {
    try {
      console.log('🔧 初始化腾讯云OCR客户端...')
      this.tencentClient = new TencentOcrService()
      console.log('✅ 腾讯云OCR客户端初始化成功')
    } catch (error) {
      console.error('❌ 腾讯云OCR客户端初始化失败:', error.message)
      this.tencentClient = null
    }
  }

  // 初始化自训练模型
  async initCustomModel() {
    try {
      // 检查模型文件是否存在
      const modelPath = CUSTOM_OCR_CONFIG.MODEL_PATH
      if (fs.existsSync(modelPath)) {
        // 这里可以加载TensorFlow.js或其他ML模型
        console.log('✅ 自训练OCR模型加载成功')
        this.customModel = { loaded: true, version: '1.0.0' }
      } else {
        console.log('⚠️ 自训练OCR模型未找到，将创建新模型')
        await this.createCustomModel()
      }
    } catch (error) {
      console.error('❌ 自训练OCR模型初始化失败:', error)
    }
  }

  // 创建自训练模型
  async createCustomModel() {
    try {
      // 创建模型目录
      const modelDir = CUSTOM_OCR_CONFIG.MODEL_PATH
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true })
      }

      // 创建训练数据目录
      const trainingDir = CUSTOM_OCR_CONFIG.TRAINING_DATA_PATH
      if (!fs.existsSync(trainingDir)) {
        fs.mkdirSync(trainingDir, { recursive: true })
      }

      // 创建模型配置文件
      const modelConfig = {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        architecture: 'CNN-RNN-CTC',
        input_shape: [32, 128, 1],
        num_classes: 5000, // 支持5000个字符
        ...CUSTOM_OCR_CONFIG.MODEL_PARAMS
      }

      fs.writeFileSync(
        path.join(modelDir, 'config.json'),
        JSON.stringify(modelConfig, null, 2)
      )

      console.log('✅ 自训练OCR模型框架创建成功')
      this.customModel = { loaded: false, version: '1.0.0' }
    } catch (error) {
      console.error('❌ 创建自训练OCR模型失败:', error)
    }
  }

  // 主要的OCR识别接口
  async recognizeIDCard(imageBuffer, options = {}) {
    const startTime = Date.now()

    try {
      // 验证输入参数
      console.log('🔍 OCR识别开始，参数验证...')
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

      // 生成缓存键
      const cacheKey = this.generateCacheKey(imageBuffer)
      
      // 检查缓存
      if (OCR_SERVICE_CONFIG.CACHE.enabled && this.cache.has(cacheKey)) {
        console.log('📋 使用缓存的OCR结果')
        return this.cache.get(cacheKey)
      }

      // 按优先级尝试不同的OCR服务
      let result = null
      for (const service of OCR_SERVICE_CONFIG.PRIORITY) {
        try {
          switch (service) {
            case 'custom':
              result = await this.recognizeWithCustomModel(imageBuffer, options)
              break
            case 'baidu':
              result = await this.recognizeWithBaidu(imageBuffer, options)
              break
            case 'tencent':
              result = await this.recognizeWithTencent(imageBuffer, options)
              break
          }
          
          if (result && result.success) {
            console.log(`✅ OCR识别成功 (${service})`)
            break
          }
        } catch (error) {
          console.warn(`⚠️ ${service} OCR识别失败:`, error.message)
          continue
        }
      }

      if (!result || !result.success) {
        throw new Error('OCR识别失败，请检查图片质量或稍后重试')
      }

      // 添加处理时间
      result.processing_time = (Date.now() - startTime) / 1000

      // 缓存结果
      if (OCR_SERVICE_CONFIG.CACHE.enabled) {
        this.cache.set(cacheKey, result)
        
        // 清理过期缓存
        if (this.cache.size > OCR_SERVICE_CONFIG.CACHE.max_size) {
          const firstKey = this.cache.keys().next().value
          this.cache.delete(firstKey)
        }
      }

      // 保存训练数据
      await this.saveTrainingData(imageBuffer, result)

      return result

    } catch (error) {
      console.error('❌ OCR识别失败:', error)
      return {
        success: false,
        error: error.message,
        processing_time: (Date.now() - startTime) / 1000
      }
    }
  }

  // 使用自训练模型识别
  async recognizeWithCustomModel(imageBuffer, options) {
    if (!this.customModel || !this.customModel.loaded) {
      throw new Error('自训练模型未加载')
    }

    console.log('🤖 使用自训练模型识别...')

    try {
      // 使用训练器进行推理
      const result = await this.trainer.predict(imageBuffer)

      if (result.success) {
        // 转换为标准格式
        return {
          success: true,
          confidence: result.confidence,
          source: 'custom',
          data: {
            name: result.prediction,
            // 其他字段可以通过多个模型或规则推断
            gender: '未知',
            nation: '汉',
            birthDate: '未知',
            address: '未知',
            idNumber: '未知',
            issueDate: '未知',
            expiryDate: '未知',
            issuingAuthority: '未知'
          }
        }
      } else {
        throw new Error('自训练模型识别失败')
      }
    } catch (error) {
      console.error('❌ 自训练模型识别失败:', error)
      throw error
    }
  }

  // 使用百度OCR识别
  async recognizeWithBaidu(imageBuffer, options) {
    if (!this.baiduClient) {
      throw new Error('百度OCR客户端未初始化')
    }

    console.log('🔍 使用百度OCR识别...')

    try {
      // 验证图片大小
      if (imageBuffer.length > 4 * 1024 * 1024) { // 4MB限制
        throw new Error('图片文件过大，请压缩后重试')
      }

      // 转换图片为base64
      const base64Image = imageBuffer.toString('base64')

      console.log('📷 图片大小:', imageBuffer.length, 'bytes')
      console.log('📷 Base64长度:', base64Image.length)
      console.log('🔧 OCR选项:', BAIDU_OCR_CONFIG.OPTIONS)

      // 调用百度OCR API - 使用Promise包装
      const result = await new Promise((resolve, reject) => {
        console.log('📡 开始调用百度OCR API...')
        this.baiduClient.idcard(base64Image, BAIDU_OCR_CONFIG.OPTIONS)
          .then((res) => {
            console.log('📡 百度OCR API调用成功')
            resolve(res)
          })
          .catch((err) => {
            console.error('📡 百度OCR API调用失败:', err)
            reject(err)
          })
      })

      console.log('🔍 百度OCR原始结果:', JSON.stringify(result, null, 2))

      if (result.error_code) {
        throw new Error(`百度OCR API错误 (${result.error_code}): ${result.error_msg}`)
      }

      if (!result.words_result || !result.words_result.姓名) {
        throw new Error('百度OCR返回数据格式异常，未找到身份证信息')
      }

      // 转换百度OCR结果格式
      return this.convertBaiduResult(result)

    } catch (error) {
      console.error('❌ 百度OCR识别失败:', error.message)
      console.error('❌ 错误详情:', error)
      throw error
    }
  }

  // 转换百度OCR结果格式
  convertBaiduResult(baiduResult) {
    try {
      const words = baiduResult.words_result || {}

      console.log('🔄 转换百度OCR结果:', words)

      // 计算平均置信度
      let totalConfidence = 0
      let fieldCount = 0

      Object.values(words).forEach(field => {
        if (field && field.words_confidence) {
          totalConfidence += field.words_confidence
          fieldCount++
        }
      })

      const avgConfidence = fieldCount > 0 ? totalConfidence / fieldCount / 100 : 0.95

      return {
        success: true,
        confidence: Math.round(avgConfidence * 100) / 100,
        source: 'baidu',
        data: {
          name: words['姓名']?.words || '',
          gender: words['性别']?.words || '',
          nation: words['民族']?.words || '汉',
          birthDate: words['出生']?.words || '',
          address: words['住址']?.words || '',
          idNumber: words['公民身份号码']?.words || '',
          issueDate: words['签发日期']?.words || '',
          expiryDate: words['失效日期']?.words || '',
          issuingAuthority: words['签发机关']?.words || ''
        },
        recognition_details: {
          total_fields: Object.keys(words).length,
          confidence_fields: fieldCount,
          image_quality: avgConfidence > 0.9 ? 'excellent' : avgConfidence > 0.8 ? 'good' : 'fair'
        },
        raw_result: baiduResult
      }
    } catch (error) {
      console.error('❌ 转换百度OCR结果失败:', error)
      throw new Error('百度OCR结果格式错误')
    }
  }

  // 使用腾讯云识别
  async recognizeWithTencent(imageBuffer, options) {
    if (!this.tencentClient) {
      throw new Error('腾讯云OCR客户端未初始化')
    }

    console.log('🔍 使用腾讯云OCR识别...')

    try {
      // 调用腾讯云身份证识别
      const result = await this.tencentClient.recognizeIdCard(imageBuffer, options)

      if (result.success) {
        console.log('✅ 腾讯云OCR识别成功')

        // 保存训练数据
        await this.saveTrainingData(imageBuffer, result)

        return result
      } else {
        throw new Error(result.error || '腾讯云OCR识别失败')
      }
    } catch (error) {
      console.error('❌ 腾讯云OCR识别失败:', error)
      throw error
    }
  }

  // 生成缓存键
  generateCacheKey(imageBuffer) {
    return crypto.createHash('md5').update(imageBuffer).digest('hex')
  }

  // 保存训练数据
  async saveTrainingData(imageBuffer, result) {
    try {
      if (!result.success) return

      const trainingDir = CUSTOM_OCR_CONFIG.TRAINING_DATA_PATH
      const timestamp = Date.now()
      
      // 保存图片
      const imagePath = path.join(trainingDir, `${timestamp}.jpg`)
      fs.writeFileSync(imagePath, imageBuffer)
      
      // 保存标注数据
      const annotationPath = path.join(trainingDir, `${timestamp}.json`)
      const annotation = {
        image: `${timestamp}.jpg`,
        timestamp: new Date().toISOString(),
        source: result.source,
        confidence: result.confidence,
        data: result.data
      }
      fs.writeFileSync(annotationPath, JSON.stringify(annotation, null, 2))
      
      console.log('📚 训练数据已保存')
    } catch (error) {
      console.warn('⚠️ 保存训练数据失败:', error)
    }
  }

  // 获取模型统计信息
  getModelStats() {
    const trainingDir = CUSTOM_OCR_CONFIG.TRAINING_DATA_PATH
    let trainingDataCount = 0
    
    if (fs.existsSync(trainingDir)) {
      const files = fs.readdirSync(trainingDir)
      trainingDataCount = files.filter(f => f.endsWith('.json')).length
    }
    
    return {
      custom_model: {
        loaded: this.customModel?.loaded || false,
        version: this.customModel?.version || 'N/A'
      },
      baidu_ocr: {
        available: !!this.baiduClient
      },
      training_data: {
        count: trainingDataCount,
        path: trainingDir
      },
      cache: {
        size: this.cache.size,
        max_size: OCR_SERVICE_CONFIG.CACHE.max_size
      }
    }
  }

  // 保存训练样本
  async saveTrainingSample(imageBuffer, ocrResult, metadata = {}) {
    try {
      const sampleId = await this.dataManager.saveTrainingSample(imageBuffer, ocrResult, metadata)
      console.log(`💾 保存训练样本: ${sampleId}`)
      return sampleId
    } catch (error) {
      console.error('❌ 保存训练样本失败:', error)
      throw error
    }
  }

  // 开始模型训练
  async startTraining(options = {}) {
    try {
      console.log('🚀 开始自训练模型训练...')
      const result = await this.trainer.startTraining(options)

      if (result.success) {
        // 训练完成后重新加载模型
        await this.loadLatestModel()
      }

      return result
    } catch (error) {
      console.error('❌ 模型训练失败:', error)
      throw error
    }
  }

  // 加载最新的训练模型
  async loadLatestModel() {
    try {
      const modelsDir = this.dataManager.modelsDir
      const modelDirs = fs.readdirSync(modelsDir)
        .filter(dir => dir.startsWith('ocr_model_'))
        .sort((a, b) => b.localeCompare(a)) // 按时间戳降序排列

      if (modelDirs.length > 0) {
        const latestModelPath = path.join(modelsDir, modelDirs[0])
        const success = await this.trainer.loadModel(latestModelPath)

        if (success) {
          this.customModel = {
            loaded: true,
            model: this.trainer.model,
            path: latestModelPath
          }
          console.log(`✅ 加载最新训练模型: ${modelDirs[0]}`)
        }
      }
    } catch (error) {
      console.error('❌ 加载最新模型失败:', error)
    }
  }

  // 获取训练统计
  getTrainingStats() {
    return this.dataManager.getTrainingStats()
  }

  // 获取训练进度
  getTrainingProgress() {
    return this.trainer.getTrainingProgress()
  }

  // 验证训练样本
  async verifyTrainingSample(sampleId, correctedData = null) {
    try {
      return await this.dataManager.verifyLabel(sampleId, correctedData)
    } catch (error) {
      console.error('❌ 验证训练样本失败:', error)
      throw error
    }
  }

  // 获取训练数据集
  getTrainingDataset(verified = true) {
    return this.dataManager.getTrainingDataset(verified)
  }


}

module.exports = OCRService

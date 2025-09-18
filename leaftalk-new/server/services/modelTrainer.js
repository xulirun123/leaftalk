/**
 * OCR模型训练器
 * 使用高级统计学习和模式匹配进行字符识别
 * 包含特征提取、模式学习、相似度计算等功能
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const TrainingDataManager = require('./trainingDataManager')

class ModelTrainer {
  constructor() {
    this.dataManager = new TrainingDataManager()
    this.model = null
    this.isTraining = false
    this.trainingProgress = {
      epoch: 0,
      totalEpochs: 0,
      accuracy: 0,
      status: 'idle'
    }
    this.characterPatterns = new Map() // 字符模式库
    this.loadCharacterPatterns()
  }

  // 加载字符模式库
  loadCharacterPatterns() {
    try {
      const patternsPath = path.join(this.dataManager.modelsDir, 'character_patterns.json')
      if (fs.existsSync(patternsPath)) {
        const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'))
        this.characterPatterns = new Map(Object.entries(patterns))
        console.log(`✅ 加载字符模式库: ${this.characterPatterns.size} 个字符`)
      } else {
        console.log('📝 初始化空字符模式库')
      }
    } catch (error) {
      console.error('❌ 加载字符模式库失败:', error)
    }
  }

  // 保存字符模式库
  saveCharacterPatterns() {
    try {
      const patternsPath = path.join(this.dataManager.modelsDir, 'character_patterns.json')
      const patterns = Object.fromEntries(this.characterPatterns)
      fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2))
      console.log('💾 保存字符模式库完成')
    } catch (error) {
      console.error('❌ 保存字符模式库失败:', error)
    }
  }

  // 提取图像特征
  async extractImageFeatures(imageBuffer) {
    try {
      // 转换为灰度图并获取像素数据
      const { data, info } = await sharp(imageBuffer)
        .resize(64, 64) // 缩放到固定尺寸
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true })

      // 计算基本特征
      const features = {
        width: info.width,
        height: info.height,
        pixels: Array.from(data),
        histogram: this.calculateHistogram(data),
        edges: this.detectEdges(data, info.width, info.height),
        density: this.calculateDensity(data)
      }

      return features
    } catch (error) {
      console.error('❌ 提取图像特征失败:', error)
      throw error
    }
  }

  // 计算直方图
  calculateHistogram(pixels) {
    const histogram = new Array(256).fill(0)
    for (const pixel of pixels) {
      histogram[pixel]++
    }
    return histogram
  }

  // 简单边缘检测
  detectEdges(pixels, width, height) {
    const edges = []
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        const gx = pixels[idx + 1] - pixels[idx - 1]
        const gy = pixels[idx + width] - pixels[idx - width]
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        edges.push(magnitude)
      }
    }
    return edges
  }

  // 计算像素密度
  calculateDensity(pixels) {
    const nonZero = pixels.filter(p => p > 50).length
    return nonZero / pixels.length
  }

  // 预处理训练数据
  async preprocessTrainingData(dataset) {
    console.log('🔄 预处理训练数据...')

    const trainingData = []

    for (const sample of dataset) {
      try {
        // 加载图片并提取特征
        const imageBuffer = fs.readFileSync(sample.imagePath)
        const features = await this.extractImageFeatures(imageBuffer)

        // 获取标签
        const name = sample.ocrResult.data?.name || ''
        const firstChar = name.charAt(0)

        if (firstChar) {
          trainingData.push({
            features,
            label: firstChar,
            confidence: sample.ocrResult.confidence || 0.5
          })
        }

      } catch (error) {
        console.warn(`⚠️ 跳过损坏的样本: ${sample.sampleId}`, error.message)
      }
    }

    console.log(`✅ 预处理完成: ${trainingData.length} 个样本`)
    return trainingData
  }

  // 获取模型统计信息
  getModelStats() {
    return {
      patternsCount: this.characterPatterns.size,
      characters: Array.from(this.characterPatterns.keys()),
      trainingProgress: this.trainingProgress,
      isLoaded: this.characterPatterns.size > 0,
      lastTrainingTime: this.trainingProgress.lastTrainingTime || null
    }
  }

  // 增量学习 - 添加新样本到现有模型
  async incrementalLearning(imageBuffer, correctLabel, confidence = 1.0) {
    try {
      console.log(`📚 增量学习: 添加字符 "${correctLabel}"`)

      // 提取特征
      const features = await this.extractImageFeatures(imageBuffer)

      // 获取现有模式
      const existingPattern = this.characterPatterns.get(correctLabel)

      if (existingPattern) {
        // 更新现有模式 (加权平均)
        const weight = 1.0 / (existingPattern.samples + 1)
        const newPattern = {
          histogram: existingPattern.histogram.map((val, i) =>
            val * (1 - weight) + features.histogram[i] * weight
          ),
          density: existingPattern.density * (1 - weight) + features.density * weight,
          edgeCount: existingPattern.edgeCount * (1 - weight) + features.edges.length * weight,
          aspectRatio: existingPattern.aspectRatio * (1 - weight) + (features.width / features.height) * weight,
          samples: existingPattern.samples + 1
        }
        this.characterPatterns.set(correctLabel, newPattern)
        console.log(`✅ 更新字符模式: ${correctLabel} (样本数: ${newPattern.samples})`)
      } else {
        // 创建新模式
        const newPattern = {
          histogram: features.histogram,
          density: features.density,
          edgeCount: features.edges.length,
          aspectRatio: features.width / features.height,
          samples: 1
        }
        this.characterPatterns.set(correctLabel, newPattern)
        console.log(`🆕 创建新字符模式: ${correctLabel}`)
      }

      // 保存更新的模式
      this.saveCharacterPatterns()

      return true
    } catch (error) {
      console.error('❌ 增量学习失败:', error)
      throw error
    }
  }

  // 开始训练
  async startTraining(options = {}) {
    if (this.isTraining) {
      throw new Error('模型正在训练中')
    }

    try {
      this.isTraining = true
      this.trainingProgress.status = 'preparing'

      console.log('🚀 开始OCR模型训练...')

      // 获取训练数据
      const dataset = this.dataManager.getTrainingDataset(true)
      if (dataset.length < 10) {
        throw new Error(`训练数据不足，需要至少10个验证样本，当前只有${dataset.length}个`)
      }

      // 预处理数据
      const trainingData = await this.preprocessTrainingData(dataset)

      // 训练参数
      const epochs = options.epochs || 10
      this.trainingProgress.totalEpochs = epochs
      this.trainingProgress.status = 'training'

      // 开始训练循环
      for (let epoch = 0; epoch < epochs; epoch++) {
        this.trainingProgress.epoch = epoch + 1

        console.log(`📊 训练轮次 ${epoch + 1}/${epochs}`)

        // 训练字符模式
        await this.trainCharacterPatterns(trainingData)

        // 计算准确率
        const accuracy = await this.evaluateModel(trainingData)
        this.trainingProgress.accuracy = accuracy

        console.log(`✅ 轮次 ${epoch + 1} 完成，准确率: ${(accuracy * 100).toFixed(2)}%`)

        // 如果准确率足够高，提前结束
        if (accuracy > 0.95) {
          console.log('🎯 达到目标准确率，提前结束训练')
          break
        }
      }

      // 保存模型
      const modelPath = path.join(this.dataManager.modelsDir, `pattern_model_${Date.now()}`)
      this.saveModel(modelPath)

      this.trainingProgress.status = 'completed'
      console.log('✅ 模型训练完成并保存')

      return {
        success: true,
        modelPath,
        finalAccuracy: this.trainingProgress.accuracy,
        patternsCount: this.characterPatterns.size,
        trainingDataCount: trainingData.length
      }

    } catch (error) {
      this.trainingProgress.status = 'error'
      console.error('❌ 模型训练失败:', error)
      throw error
    } finally {
      this.isTraining = false
    }
  }

  // 训练字符模式
  async trainCharacterPatterns(trainingData) {
    const characterGroups = new Map()

    // 按字符分组
    for (const sample of trainingData) {
      const char = sample.label
      if (!characterGroups.has(char)) {
        characterGroups.set(char, [])
      }
      characterGroups.get(char).push(sample.features)
    }

    // 为每个字符计算平均模式
    for (const [char, featuresList] of characterGroups) {
      const pattern = this.calculateAveragePattern(featuresList)
      this.characterPatterns.set(char, pattern)
    }

    console.log(`📚 更新字符模式: ${this.characterPatterns.size} 个字符`)
  }

  // 计算平均模式
  calculateAveragePattern(featuresList) {
    if (featuresList.length === 0) return null

    const avgPattern = {
      histogram: new Array(256).fill(0),
      density: 0,
      edgeCount: 0,
      aspectRatio: 0,
      samples: featuresList.length
    }

    // 计算平均值
    for (const features of featuresList) {
      // 直方图平均
      for (let i = 0; i < 256; i++) {
        avgPattern.histogram[i] += features.histogram[i] / featuresList.length
      }

      // 其他特征平均
      avgPattern.density += features.density / featuresList.length
      avgPattern.edgeCount += features.edges.length / featuresList.length
      avgPattern.aspectRatio += (features.width / features.height) / featuresList.length
    }

    return avgPattern
  }

  // 评估模型准确率
  async evaluateModel(trainingData) {
    let correct = 0
    const total = trainingData.length

    for (const sample of trainingData) {
      const prediction = this.predictCharacter(sample.features)
      if (prediction.character === sample.label) {
        correct++
      }
    }

    return correct / total
  }

  // 预测字符
  predictCharacter(features) {
    let bestMatch = null
    let bestScore = -1

    for (const [char, pattern] of this.characterPatterns) {
      const score = this.calculateSimilarity(features, pattern)
      if (score > bestScore) {
        bestScore = score
        bestMatch = char
      }
    }

    return {
      character: bestMatch,
      confidence: bestScore,
      alternatives: this.getTopAlternatives(features, 3)
    }
  }

  // 计算相似度
  calculateSimilarity(features, pattern) {
    if (!pattern) return 0

    // 直方图相似度 (使用余弦相似度)
    const histSimilarity = this.cosineSimilarity(features.histogram, pattern.histogram)

    // 密度相似度
    const densityDiff = Math.abs(features.density - pattern.density)
    const densitySimilarity = Math.exp(-densityDiff * 5) // 指数衰减

    // 边缘数量相似度
    const edgeDiff = Math.abs(features.edges.length - pattern.edgeCount)
    const edgeSimilarity = Math.exp(-edgeDiff / 100)

    // 宽高比相似度
    const aspectRatio = features.width / features.height
    const aspectDiff = Math.abs(aspectRatio - pattern.aspectRatio)
    const aspectSimilarity = Math.exp(-aspectDiff * 2)

    // 加权平均
    const totalSimilarity = (
      histSimilarity * 0.4 +
      densitySimilarity * 0.3 +
      edgeSimilarity * 0.2 +
      aspectSimilarity * 0.1
    )

    return totalSimilarity
  }

  // 余弦相似度
  cosineSimilarity(a, b) {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // 获取前N个候选
  getTopAlternatives(features, topN = 3) {
    const scores = []

    for (const [char, pattern] of this.characterPatterns) {
      const score = this.calculateSimilarity(features, pattern)
      scores.push({ character: char, confidence: score })
    }

    return scores
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topN)
  }

  // 保存模型
  saveModel(modelPath) {
    try {
      if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath, { recursive: true })
      }

      const modelData = {
        version: '1.0',
        timestamp: Date.now(),
        characterPatterns: Object.fromEntries(this.characterPatterns),
        metadata: {
          trainingProgress: this.trainingProgress,
          patternsCount: this.characterPatterns.size
        }
      }

      const modelFile = path.join(modelPath, 'model.json')
      fs.writeFileSync(modelFile, JSON.stringify(modelData, null, 2))

      console.log(`💾 模型保存到: ${modelFile}`)
    } catch (error) {
      console.error('❌ 保存模型失败:', error)
      throw error
    }
  }

  // 加载已训练的模型
  async loadModel(modelPath) {
    try {
      const modelFile = path.join(modelPath, 'model.json')
      if (!fs.existsSync(modelFile)) {
        throw new Error(`模型文件不存在: ${modelFile}`)
      }

      const modelData = JSON.parse(fs.readFileSync(modelFile, 'utf8'))

      // 恢复字符模式
      this.characterPatterns = new Map(Object.entries(modelData.characterPatterns))

      // 恢复训练进度
      if (modelData.metadata) {
        this.trainingProgress = { ...this.trainingProgress, ...modelData.metadata.trainingProgress }
      }

      console.log(`✅ 加载训练模型成功: ${this.characterPatterns.size} 个字符模式`)
      return true
    } catch (error) {
      console.error('❌ 加载模型失败:', error)
      return false
    }
  }

  // 使用模型进行推理
  async predict(imageBuffer) {
    if (this.characterPatterns.size === 0) {
      throw new Error('模型未训练或加载')
    }

    try {
      console.log('🔍 使用自训练模型进行预测...')

      // 提取图像特征
      const features = await this.extractImageFeatures(imageBuffer)

      // 预测字符
      const prediction = this.predictCharacter(features)

      if (!prediction.character) {
        throw new Error('无法识别字符')
      }

      console.log(`🎯 预测结果: ${prediction.character} (置信度: ${(prediction.confidence * 100).toFixed(2)}%)`)

      return {
        success: true,
        confidence: prediction.confidence,
        prediction: prediction.character,
        alternatives: prediction.alternatives,
        source: 'custom'
      }

    } catch (error) {
      console.error('❌ 模型推理失败:', error)
      throw error
    }
  }

  // 批量预测（用于身份证多字段识别）
  async predictMultiple(imageBuffer, regions = []) {
    try {
      const results = []

      if (regions.length === 0) {
        // 如果没有指定区域，对整个图像进行预测
        const result = await this.predict(imageBuffer)
        results.push({
          field: 'unknown',
          ...result
        })
      } else {
        // 对每个区域进行预测
        for (const region of regions) {
          try {
            // 裁剪图像区域
            const croppedBuffer = await sharp(imageBuffer)
              .extract({
                left: region.x,
                top: region.y,
                width: region.width,
                height: region.height
              })
              .toBuffer()

            const result = await this.predict(croppedBuffer)
            results.push({
              field: region.field || 'unknown',
              region,
              ...result
            })
          } catch (error) {
            console.warn(`⚠️ 区域预测失败: ${region.field}`, error.message)
            results.push({
              field: region.field || 'unknown',
              region,
              success: false,
              error: error.message
            })
          }
        }
      }

      return {
        success: true,
        results,
        totalRegions: regions.length || 1
      }

    } catch (error) {
      console.error('❌ 批量预测失败:', error)
      throw error
    }
  }

  // 模型性能评估
  async evaluateModelPerformance(testDataset) {
    if (testDataset.length === 0) {
      throw new Error('测试数据集为空')
    }

    console.log(`🧪 开始模型性能评估，测试样本数: ${testDataset.length}`)

    const results = {
      totalSamples: testDataset.length,
      correctPredictions: 0,
      accuracy: 0,
      characterAccuracy: new Map(),
      confusionMatrix: new Map(),
      averageConfidence: 0
    }

    let totalConfidence = 0

    for (const sample of testDataset) {
      try {
        const imageBuffer = fs.readFileSync(sample.imagePath)
        const prediction = await this.predict(imageBuffer)

        const actualChar = sample.ocrResult.data?.name?.charAt(0) || ''
        const predictedChar = prediction.prediction

        // 统计准确率
        if (predictedChar === actualChar) {
          results.correctPredictions++
        }

        // 按字符统计准确率
        if (!results.characterAccuracy.has(actualChar)) {
          results.characterAccuracy.set(actualChar, { correct: 0, total: 0 })
        }
        const charStats = results.characterAccuracy.get(actualChar)
        charStats.total++
        if (predictedChar === actualChar) {
          charStats.correct++
        }

        // 混淆矩阵
        const confusionKey = `${actualChar}->${predictedChar}`
        results.confusionMatrix.set(confusionKey, (results.confusionMatrix.get(confusionKey) || 0) + 1)

        totalConfidence += prediction.confidence

      } catch (error) {
        console.warn(`⚠️ 评估样本失败: ${sample.sampleId}`, error.message)
      }
    }

    results.accuracy = results.correctPredictions / results.totalSamples
    results.averageConfidence = totalConfidence / results.totalSamples

    console.log(`📊 评估完成 - 准确率: ${(results.accuracy * 100).toFixed(2)}%`)

    return results
  }

  // 清理和优化模型
  optimizeModel() {
    console.log('🔧 开始模型优化...')

    let removedPatterns = 0
    const minSamples = 2 // 最少样本数阈值

    // 移除样本数过少的模式
    for (const [char, pattern] of this.characterPatterns) {
      if (pattern.samples < minSamples) {
        this.characterPatterns.delete(char)
        removedPatterns++
      }
    }

    console.log(`✅ 模型优化完成，移除了 ${removedPatterns} 个低质量模式`)

    // 保存优化后的模型
    this.saveCharacterPatterns()

    return {
      removedPatterns,
      remainingPatterns: this.characterPatterns.size
    }
  }

  // 获取训练进度
  getTrainingProgress() {
    return { ...this.trainingProgress }
  }

  // 停止训练
  stopTraining() {
    if (this.isTraining) {
      this.trainingProgress.status = 'stopped'
      this.isTraining = false
      console.log('⏹️ 训练已停止')
    }
  }
}

module.exports = ModelTrainer

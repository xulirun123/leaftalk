/**
 * 训练数据管理器
 * 负责收集、标注、验证和管理OCR训练数据
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sharp = require('sharp')

class TrainingDataManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../training-data')
    this.imagesDir = path.join(this.dataDir, 'images')
    this.labelsDir = path.join(this.dataDir, 'labels')
    this.processedDir = path.join(this.dataDir, 'processed')
    this.modelsDir = path.join(this.dataDir, 'models')
    
    this.initDirectories()
  }

  // 初始化目录结构
  initDirectories() {
    const dirs = [this.dataDir, this.imagesDir, this.labelsDir, this.processedDir, this.modelsDir]
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`📁 创建目录: ${dir}`)
      }
    })
  }

  // 保存训练样本
  async saveTrainingSample(imageBuffer, ocrResult, metadata = {}) {
    try {
      const timestamp = Date.now()
      const hash = crypto.createHash('md5').update(imageBuffer).digest('hex')
      const sampleId = `${timestamp}_${hash.substring(0, 8)}`

      // 保存原始图片
      const imagePath = path.join(this.imagesDir, `${sampleId}.jpg`)
      await sharp(imageBuffer)
        .jpeg({ quality: 95 })
        .toFile(imagePath)

      // 保存标注数据
      const labelData = {
        sampleId,
        timestamp,
        metadata,
        ocrResult,
        imagePath: imagePath,
        imageSize: imageBuffer.length,
        verified: false,
        confidence: ocrResult.confidence || 0
      }

      const labelPath = path.join(this.labelsDir, `${sampleId}.json`)
      fs.writeFileSync(labelPath, JSON.stringify(labelData, null, 2))

      console.log(`💾 保存训练样本: ${sampleId}`)
      return sampleId

    } catch (error) {
      console.error('❌ 保存训练样本失败:', error)
      throw error
    }
  }

  // 获取训练数据统计
  getTrainingStats() {
    try {
      const imageFiles = fs.readdirSync(this.imagesDir).filter(f => f.endsWith('.jpg'))
      const labelFiles = fs.readdirSync(this.labelsDir).filter(f => f.endsWith('.json'))
      
      let verifiedCount = 0
      let totalConfidence = 0
      
      labelFiles.forEach(file => {
        const labelPath = path.join(this.labelsDir, file)
        const labelData = JSON.parse(fs.readFileSync(labelPath, 'utf8'))
        if (labelData.verified) verifiedCount++
        totalConfidence += labelData.confidence || 0
      })

      return {
        totalSamples: imageFiles.length,
        labeledSamples: labelFiles.length,
        verifiedSamples: verifiedCount,
        averageConfidence: labelFiles.length > 0 ? totalConfidence / labelFiles.length : 0,
        readyForTraining: verifiedCount >= 100 // 至少需要100个验证样本
      }
    } catch (error) {
      console.error('❌ 获取训练统计失败:', error)
      return { totalSamples: 0, labeledSamples: 0, verifiedSamples: 0, averageConfidence: 0, readyForTraining: false }
    }
  }

  // 验证标注数据
  async verifyLabel(sampleId, correctedData = null) {
    try {
      const labelPath = path.join(this.labelsDir, `${sampleId}.json`)
      if (!fs.existsSync(labelPath)) {
        throw new Error(`标注文件不存在: ${sampleId}`)
      }

      const labelData = JSON.parse(fs.readFileSync(labelPath, 'utf8'))
      
      // 如果提供了修正数据，更新标注
      if (correctedData) {
        labelData.ocrResult = { ...labelData.ocrResult, ...correctedData }
        labelData.corrected = true
      }
      
      labelData.verified = true
      labelData.verifiedAt = Date.now()
      
      fs.writeFileSync(labelPath, JSON.stringify(labelData, null, 2))
      console.log(`✅ 验证标注: ${sampleId}`)
      
      return labelData
    } catch (error) {
      console.error('❌ 验证标注失败:', error)
      throw error
    }
  }

  // 获取训练数据集
  getTrainingDataset(verified = true) {
    try {
      const labelFiles = fs.readdirSync(this.labelsDir).filter(f => f.endsWith('.json'))
      const dataset = []

      labelFiles.forEach(file => {
        const labelPath = path.join(this.labelsDir, file)
        const labelData = JSON.parse(fs.readFileSync(labelPath, 'utf8'))
        
        if (!verified || labelData.verified) {
          dataset.push(labelData)
        }
      })

      return dataset.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('❌ 获取训练数据集失败:', error)
      return []
    }
  }

  // 数据预处理
  async preprocessImage(imagePath) {
    try {
      const processedPath = path.join(this.processedDir, path.basename(imagePath))
      
      await sharp(imagePath)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .normalize()
        .sharpen()
        .jpeg({ quality: 90 })
        .toFile(processedPath)
      
      return processedPath
    } catch (error) {
      console.error('❌ 图片预处理失败:', error)
      throw error
    }
  }

  // 清理旧数据
  cleanupOldData(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
      let cleanedCount = 0

      const labelFiles = fs.readdirSync(this.labelsDir).filter(f => f.endsWith('.json'))
      
      labelFiles.forEach(file => {
        const labelPath = path.join(this.labelsDir, file)
        const labelData = JSON.parse(fs.readFileSync(labelPath, 'utf8'))
        
        if (labelData.timestamp < cutoffTime && !labelData.verified) {
          // 删除未验证的旧数据
          fs.unlinkSync(labelPath)
          
          const imagePath = labelData.imagePath
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
          }
          
          cleanedCount++
        }
      })

      console.log(`🧹 清理了 ${cleanedCount} 个旧训练样本`)
      return cleanedCount
    } catch (error) {
      console.error('❌ 清理数据失败:', error)
      return 0
    }
  }
}

module.exports = TrainingDataManager

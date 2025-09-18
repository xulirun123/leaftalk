/**
 * OCR训练管理控制器
 * 提供完整的训练管理功能
 */

const OCRService = require('../services/ocrService')
const fs = require('fs')
const path = require('path')

class TrainingController {
  constructor() {
    this.ocrService = new OCRService()
  }

  // 获取训练仪表板数据
  async getDashboard() {
    try {
      const [trainingStats, modelStats, trainingProgress] = await Promise.all([
        this.ocrService.getTrainingStats(),
        this.ocrService.trainer.getModelStats(),
        this.ocrService.getTrainingProgress()
      ])

      const dataset = this.ocrService.getTrainingDataset(false)
      const verifiedDataset = this.ocrService.getTrainingDataset(true)

      return {
        success: true,
        data: {
          trainingStats,
          modelStats,
          trainingProgress,
          datasetInfo: {
            total: dataset.length,
            verified: verifiedDataset.length,
            unverified: dataset.length - verifiedDataset.length,
            recentSamples: dataset.slice(0, 10)
          },
          systemInfo: {
            timestamp: Date.now(),
            version: '1.0.0'
          }
        }
      }
    } catch (error) {
      console.error('❌ 获取训练仪表板失败:', error)
      return {
        success: false,
        message: '获取训练仪表板失败',
        error: error.message
      }
    }
  }

  // 开始自动训练流程
  async startAutoTraining(options = {}) {
    try {
      console.log('🚀 开始自动训练流程...')

      // 检查训练条件
      const stats = this.ocrService.getTrainingStats()
      if (!stats.readyForTraining) {
        throw new Error(`训练条件不满足: 需要至少100个验证样本，当前只有${stats.verifiedSamples}个`)
      }

      // 设置训练参数
      const trainingOptions = {
        epochs: options.epochs || 20,
        batchSize: options.batchSize || 8,
        validationSplit: options.validationSplit || 0.2,
        earlyStoppingPatience: options.earlyStoppingPatience || 5
      }

      console.log('📋 训练参数:', trainingOptions)

      // 开始训练
      const result = await this.ocrService.startTraining(trainingOptions)

      if (result.success) {
        console.log('✅ 自动训练完成')
        
        // 训练完成后自动评估
        const evaluation = await this.evaluateModel()
        
        // 如果准确率不够，建议优化
        if (evaluation.data.accuracy < 0.8) {
          console.log('⚠️ 模型准确率较低，建议收集更多训练数据')
        }

        return {
          success: true,
          data: {
            training: result,
            evaluation: evaluation.data,
            recommendations: this.generateRecommendations(evaluation.data)
          }
        }
      } else {
        throw new Error('训练失败')
      }

    } catch (error) {
      console.error('❌ 自动训练失败:', error)
      return {
        success: false,
        message: '自动训练失败',
        error: error.message
      }
    }
  }

  // 评估模型性能
  async evaluateModel() {
    try {
      console.log('🧪 开始模型评估...')
      
      const testDataset = this.ocrService.getTrainingDataset(true)
      if (testDataset.length === 0) {
        throw new Error('没有可用的测试数据')
      }

      const evaluation = await this.ocrService.trainer.evaluateModelPerformance(testDataset)
      
      console.log(`📊 评估完成 - 准确率: ${(evaluation.accuracy * 100).toFixed(2)}%`)
      
      return {
        success: true,
        data: evaluation
      }
    } catch (error) {
      console.error('❌ 模型评估失败:', error)
      return {
        success: false,
        message: '模型评估失败',
        error: error.message
      }
    }
  }

  // 数据质量分析
  async analyzeDataQuality() {
    try {
      console.log('🔍 开始数据质量分析...')
      
      const dataset = this.ocrService.getTrainingDataset(false)
      const analysis = {
        totalSamples: dataset.length,
        verifiedSamples: 0,
        lowConfidenceSamples: 0,
        duplicateSamples: 0,
        characterDistribution: new Map(),
        confidenceDistribution: {
          high: 0,    // > 0.8
          medium: 0,  // 0.5 - 0.8
          low: 0      // < 0.5
        },
        qualityIssues: []
      }

      const seenHashes = new Set()
      
      for (const sample of dataset) {
        // 验证状态统计
        if (sample.verified) {
          analysis.verifiedSamples++
        }

        // 置信度统计
        const confidence = sample.ocrResult.confidence || 0
        if (confidence < 0.5) {
          analysis.lowConfidenceSamples++
          analysis.confidenceDistribution.low++
        } else if (confidence < 0.8) {
          analysis.confidenceDistribution.medium++
        } else {
          analysis.confidenceDistribution.high++
        }

        // 字符分布统计
        const name = sample.ocrResult.data?.name || ''
        const firstChar = name.charAt(0)
        if (firstChar) {
          analysis.characterDistribution.set(
            firstChar, 
            (analysis.characterDistribution.get(firstChar) || 0) + 1
          )
        }

        // 重复样本检测
        const sampleHash = this.generateSampleHash(sample)
        if (seenHashes.has(sampleHash)) {
          analysis.duplicateSamples++
        } else {
          seenHashes.add(sampleHash)
        }
      }

      // 生成质量问题报告
      if (analysis.lowConfidenceSamples > analysis.totalSamples * 0.3) {
        analysis.qualityIssues.push('低置信度样本过多，建议人工审核')
      }

      if (analysis.duplicateSamples > 0) {
        analysis.qualityIssues.push(`发现${analysis.duplicateSamples}个重复样本，建议清理`)
      }

      const charCount = analysis.characterDistribution.size
      if (charCount < 10) {
        analysis.qualityIssues.push('字符种类过少，建议增加更多样化的训练数据')
      }

      console.log(`✅ 数据质量分析完成: ${analysis.totalSamples}个样本，${charCount}种字符`)
      
      return {
        success: true,
        data: {
          ...analysis,
          characterDistribution: Object.fromEntries(analysis.characterDistribution)
        }
      }
    } catch (error) {
      console.error('❌ 数据质量分析失败:', error)
      return {
        success: false,
        message: '数据质量分析失败',
        error: error.message
      }
    }
  }

  // 批量验证样本
  async batchVerifySamples(sampleIds, corrections = {}) {
    try {
      console.log(`📝 开始批量验证 ${sampleIds.length} 个样本...`)
      
      const results = []
      
      for (const sampleId of sampleIds) {
        try {
          const correctedData = corrections[sampleId] || null
          const result = await this.ocrService.verifyTrainingSample(sampleId, correctedData)
          results.push({
            sampleId,
            success: true,
            result
          })
        } catch (error) {
          results.push({
            sampleId,
            success: false,
            error: error.message
          })
        }
      }

      const successCount = results.filter(r => r.success).length
      console.log(`✅ 批量验证完成: ${successCount}/${sampleIds.length} 成功`)

      return {
        success: true,
        data: {
          total: sampleIds.length,
          successful: successCount,
          failed: sampleIds.length - successCount,
          results
        }
      }
    } catch (error) {
      console.error('❌ 批量验证失败:', error)
      return {
        success: false,
        message: '批量验证失败',
        error: error.message
      }
    }
  }

  // 清理训练数据
  async cleanupTrainingData(options = {}) {
    try {
      console.log('🧹 开始清理训练数据...')
      
      const {
        removeDuplicates = true,
        removeLowConfidence = true,
        confidenceThreshold = 0.3,
        removeOldUnverified = true,
        daysOld = 30
      } = options

      let removedCount = 0
      
      // 清理重复数据
      if (removeDuplicates) {
        const duplicateCount = await this.removeDuplicateSamples()
        removedCount += duplicateCount
        console.log(`🗑️ 移除重复样本: ${duplicateCount}个`)
      }

      // 清理低置信度数据
      if (removeLowConfidence) {
        const lowConfidenceCount = await this.removeLowConfidenceSamples(confidenceThreshold)
        removedCount += lowConfidenceCount
        console.log(`🗑️ 移除低置信度样本: ${lowConfidenceCount}个`)
      }

      // 清理旧的未验证数据
      if (removeOldUnverified) {
        const oldCount = this.ocrService.dataManager.cleanupOldData(daysOld)
        removedCount += oldCount
        console.log(`🗑️ 移除旧未验证样本: ${oldCount}个`)
      }

      console.log(`✅ 数据清理完成，总共移除 ${removedCount} 个样本`)

      return {
        success: true,
        data: {
          removedCount,
          operations: {
            duplicates: removeDuplicates,
            lowConfidence: removeLowConfidence,
            oldUnverified: removeOldUnverified
          }
        }
      }
    } catch (error) {
      console.error('❌ 数据清理失败:', error)
      return {
        success: false,
        message: '数据清理失败',
        error: error.message
      }
    }
  }

  // 生成训练报告
  async generateTrainingReport() {
    try {
      console.log('📊 生成训练报告...')
      
      const [dashboard, evaluation, dataQuality] = await Promise.all([
        this.getDashboard(),
        this.evaluateModel(),
        this.analyzeDataQuality()
      ])

      const report = {
        timestamp: Date.now(),
        summary: {
          modelAccuracy: evaluation.data?.accuracy || 0,
          totalSamples: dashboard.data.datasetInfo.total,
          verifiedSamples: dashboard.data.datasetInfo.verified,
          characterPatterns: dashboard.data.modelStats.patternsCount
        },
        dataQuality: dataQuality.data,
        modelPerformance: evaluation.data,
        recommendations: this.generateRecommendations(evaluation.data, dataQuality.data),
        nextSteps: this.generateNextSteps(dashboard.data, evaluation.data)
      }

      // 保存报告到文件
      const reportPath = path.join(
        this.ocrService.dataManager.dataDir, 
        `training_report_${Date.now()}.json`
      )
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

      console.log(`✅ 训练报告已生成: ${reportPath}`)

      return {
        success: true,
        data: report
      }
    } catch (error) {
      console.error('❌ 生成训练报告失败:', error)
      return {
        success: false,
        message: '生成训练报告失败',
        error: error.message
      }
    }
  }

  // 辅助方法
  generateSampleHash(sample) {
    const crypto = require('crypto')
    const data = `${sample.ocrResult.data?.name || ''}_${sample.imageSize || 0}`
    return crypto.createHash('md5').update(data).digest('hex')
  }

  async removeDuplicateSamples() {
    // TODO: 实现重复样本移除逻辑
    return 0
  }

  async removeLowConfidenceSamples(threshold) {
    // TODO: 实现低置信度样本移除逻辑
    return 0
  }

  generateRecommendations(evaluationData, dataQualityData = null) {
    const recommendations = []
    
    if (evaluationData?.accuracy < 0.7) {
      recommendations.push('模型准确率较低，建议增加更多高质量训练数据')
    }
    
    if (dataQualityData?.qualityIssues) {
      recommendations.push(...dataQualityData.qualityIssues)
    }
    
    return recommendations
  }

  generateNextSteps(dashboardData, evaluationData) {
    const steps = []
    
    if (dashboardData.datasetInfo.unverified > 0) {
      steps.push(`验证剩余的 ${dashboardData.datasetInfo.unverified} 个未验证样本`)
    }
    
    if (evaluationData?.accuracy < 0.9) {
      steps.push('收集更多训练数据以提高模型准确率')
    }
    
    steps.push('定期重新训练模型以保持性能')
    
    return steps
  }
}

module.exports = TrainingController

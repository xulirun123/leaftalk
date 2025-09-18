/**
 * OCR功能测试脚本
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

async function testOCR() {
  try {
    console.log('🔍 开始测试OCR功能...')
    
    // 创建一个测试图片（1x1像素的PNG）
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    console.log('📷 测试图片大小:', testImageBuffer.length, 'bytes')
    
    // 创建FormData
    const formData = new FormData()
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    })
    
    console.log('📡 发送OCR请求...')
    
    // 发送请求
    const response = await fetch('http://localhost:8893/api/ocr/idcard', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })
    
    console.log('📡 响应状态:', response.status)
    console.log('📡 响应头:', response.headers.raw())
    
    const result = await response.text()
    console.log('📡 响应内容:', result)
    
    if (response.ok) {
      try {
        const jsonResult = JSON.parse(result)
        console.log('✅ OCR测试成功:', jsonResult)
      } catch (parseError) {
        console.log('⚠️ 响应不是JSON格式:', result)
      }
    } else {
      console.log('❌ OCR测试失败:', result)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
if (require.main === module) {
  testOCR()
}

module.exports = { testOCR }

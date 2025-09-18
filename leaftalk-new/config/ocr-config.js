/**
 * OCR配置文件
 * 包含百度OCR API配置和自训练模型配置
 */

// 百度OCR API配置
const BAIDU_OCR_CONFIG = {
  // 百度OCR配置 - 从环境变量读取真实密钥
  APP_ID: process.env.BAIDU_APP_ID || '6987076',
  API_KEY: process.env.BAIDU_API_KEY || 'T14tBYwtqyBoe5VqyWWEl9yN',
  SECRET_KEY: process.env.BAIDU_SECRET_KEY || 'RiaQYBglB2cPsJqgaSAD3XsBz3X6JpiJ',
  
  // API端点
  ENDPOINTS: {
    ID_CARD: 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard',
    GENERAL: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
    ACCURATE: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic'
  },
  
  // 识别参数
  OPTIONS: {
    id_card_side: 'front', // front-正面，back-背面
    detect_direction: true, // 检测图像朝向
    detect_risk: false, // 检测风险
    detect_quality: true, // 检测质量
    detect_photo: true, // 检测头像
    detect_card: true // 检测边框
  }
}

// 自训练模型配置
const CUSTOM_OCR_CONFIG = {
  // 模型存储路径
  MODEL_PATH: './models/custom-ocr',
  
  // 训练数据路径
  TRAINING_DATA_PATH: './training-data',
  
  // 模型参数
  MODEL_PARAMS: {
    learning_rate: 0.001,
    batch_size: 32,
    epochs: 100,
    validation_split: 0.2
  },
  
  // 数据增强参数
  DATA_AUGMENTATION: {
    rotation_range: 10,
    width_shift_range: 0.1,
    height_shift_range: 0.1,
    brightness_range: [0.8, 1.2],
    noise_factor: 0.1
  },
  
  // 识别置信度阈值
  CONFIDENCE_THRESHOLD: 0.85,
  
  // 支持的图片格式
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'bmp'],
  
  // 最大图片尺寸
  MAX_IMAGE_SIZE: 4096
}

// OCR服务配置
const OCR_SERVICE_CONFIG = {
  // 使用的OCR服务优先级
  PRIORITY: [
    'baidu',  // 百度OCR优先（稳定准确）
    'custom', // 自训练模型备用
    'fallback' // 智能降级方案（仅在前两者都失败时使用）
  ],
  
  // 服务超时时间
  TIMEOUT: {
    custom: 5000,  // 5秒
    baidu: 10000,  // 10秒
    mock: 1000     // 1秒
  },
  
  // 重试配置
  RETRY: {
    max_attempts: 3,
    delay: 1000 // 1秒延迟
  },
  
  // 缓存配置
  CACHE: {
    enabled: true,
    ttl: 3600, // 1小时
    max_size: 1000 // 最大缓存条目
  }
}

// 训练数据标注配置
const ANNOTATION_CONFIG = {
  // 标注字段
  FIELDS: [
    { name: 'name', label: '姓名', required: true },
    { name: 'gender', label: '性别', required: true },
    { name: 'nation', label: '民族', required: false },
    { name: 'birth', label: '出生日期', required: true },
    { name: 'address', label: '住址', required: true },
    { name: 'id_number', label: '身份证号', required: true },
    { name: 'issue_date', label: '签发日期', required: false },
    { name: 'expiry_date', label: '有效期限', required: false },
    { name: 'issuing_authority', label: '签发机关', required: false }
  ],
  
  // 标注工具配置
  ANNOTATION_TOOL: {
    canvas_size: { width: 800, height: 600 },
    box_color: '#ff0000',
    text_color: '#ffffff',
    font_size: 14
  }
}

// 模型评估配置
const EVALUATION_CONFIG = {
  // 评估指标
  METRICS: [
    'accuracy',      // 准确率
    'precision',     // 精确率
    'recall',        // 召回率
    'f1_score',      // F1分数
    'char_accuracy', // 字符准确率
    'word_accuracy'  // 词准确率
  ],
  
  // 测试数据集比例
  TEST_SPLIT: 0.1,
  
  // 评估报告输出路径
  REPORT_PATH: './evaluation-reports'
}

module.exports = {
  BAIDU_OCR_CONFIG,
  CUSTOM_OCR_CONFIG,
  OCR_SERVICE_CONFIG,
  ANNOTATION_CONFIG,
  EVALUATION_CONFIG
}

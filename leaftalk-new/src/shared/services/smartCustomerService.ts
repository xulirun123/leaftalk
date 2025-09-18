/**
 * 智能客服服务
 * 提供AI驱动的客户服务功能
 */

export interface CustomerServiceResponse {
  answer: string
  confidence: number
  suggestions: string[]
  needHumanTransfer: boolean
  category: string
}

export interface UserContext {
  userId?: string
  conversationHistory?: any[]
  userProfile?: any
}

class SmartCustomerServiceClass {
  private knowledgeBase: Map<string, any> = new Map()
  private initialized = false

  async initialize() {
    if (this.initialized) return

    // 初始化知识库
    await this.loadKnowledgeBase()
    this.initialized = true
    console.log('✅ 智能客服服务初始化完成')
  }

  private async loadKnowledgeBase() {
    // 加载常见问题和答案
    const commonQA = [
      {
        keywords: ['添加好友', '加好友', '如何添加'],
        answer: '添加好友很简单：\n1. 点击通讯录页面的"+"按钮\n2. 输入对方的叶语号或手机号\n3. 点击搜索并发送好友申请\n4. 等待对方同意即可',
        category: 'basic',
        confidence: 0.9
      },
      {
        keywords: ['发送红包', '红包', '怎么发红包'],
        answer: '发送红包步骤：\n1. 在聊天界面点击"+"按钮\n2. 选择"红包"功能\n3. 输入金额和祝福语\n4. 确认发送即可\n注意：需要先绑定支付方式',
        category: 'payment',
        confidence: 0.9
      },
      {
        keywords: ['创建群聊', '建群', '群聊'],
        answer: '创建群聊方法：\n1. 在聊天列表点击右上角"+"\n2. 选择"发起群聊"\n3. 选择要邀请的好友\n4. 设置群名称和群头像\n5. 点击创建完成',
        category: 'group',
        confidence: 0.9
      },
      {
        keywords: ['忘记密码', '密码', '登录不了'],
        answer: '忘记密码解决方案：\n1. 在登录页面点击"忘记密码"\n2. 输入注册时的手机号\n3. 获取验证码\n4. 设置新密码\n如果手机号也忘记了，请联系人工客服',
        category: 'account',
        confidence: 0.8
      },
      {
        keywords: ['隐私设置', '隐私权限', '谁能看到'],
        answer: '隐私设置路径：\n1. 进入"我"页面\n2. 点击"设置"\n3. 选择"隐私设置"\n4. 可以设置：朋友圈权限、添加方式、消息接收等\n建议定期检查隐私设置',
        category: 'privacy',
        confidence: 0.8
      },
      {
        keywords: ['文件上传', '发送失败', '上传失败'],
        answer: '文件上传失败解决方法：\n1. 检查网络连接是否正常\n2. 确认文件大小不超过100MB\n3. 检查文件格式是否支持\n4. 尝试重新发送\n如果问题持续，请联系技术支持',
        category: 'technical',
        confidence: 0.7
      }
    ]

    commonQA.forEach((qa, index) => {
      this.knowledgeBase.set(`qa_${index}`, qa)
    })
  }

  async getResponse(question: string, context: UserContext = {}): Promise<CustomerServiceResponse> {
    try {
      // 预处理问题
      const processedQuestion = this.preprocessQuestion(question)
      
      // 在知识库中搜索答案
      const match = this.findBestMatch(processedQuestion)
      
      if (match && match.confidence > 0.6) {
        return {
          answer: match.answer,
          confidence: match.confidence,
          suggestions: this.generateSuggestions(match.category),
          needHumanTransfer: false,
          category: match.category
        }
      }

      // 如果没有找到合适的答案，返回通用回复
      return {
        answer: '抱歉，我可能没有完全理解您的问题。您可以：\n1. 尝试用不同的方式描述问题\n2. 查看下方的常见问题\n3. 转接人工客服获得专业帮助',
        confidence: 0.3,
        suggestions: ['转接人工客服', '查看帮助文档', '常见问题'],
        needHumanTransfer: true,
        category: 'unknown'
      }

    } catch (error) {
      console.error('智能客服处理失败:', error)
      
      return {
        answer: '系统暂时遇到问题，请稍后再试或联系人工客服。',
        confidence: 0,
        suggestions: ['转接人工客服'],
        needHumanTransfer: true,
        category: 'error'
      }
    }
  }

  private preprocessQuestion(question: string): string {
    // 去除标点符号，转换为小写
    return question.replace(/[^\w\s\u4e00-\u9fff]/g, '').toLowerCase()
  }

  private findBestMatch(question: string): any {
    let bestMatch = null
    let bestScore = 0

    for (const [key, qa] of this.knowledgeBase) {
      const score = this.calculateSimilarity(question, qa.keywords)
      if (score > bestScore) {
        bestScore = score
        bestMatch = { ...qa, confidence: score }
      }
    }

    return bestMatch
  }

  private calculateSimilarity(question: string, keywords: string[]): number {
    let score = 0
    const questionWords = question.split(/\s+/)

    keywords.forEach(keyword => {
      const keywordWords = keyword.split(/\s+/)
      keywordWords.forEach(word => {
        if (questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))) {
          score += 0.3
        }
      })
    })

    return Math.min(score, 1.0)
  }

  private generateSuggestions(category: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      basic: ['如何发送消息', '如何设置头像', '如何修改昵称'],
      payment: ['如何转账', '如何查看账单', '如何绑定银行卡'],
      group: ['如何邀请成员', '如何设置群管理员', '如何退出群聊'],
      account: ['如何修改手机号', '如何注销账号', '如何申诉'],
      privacy: ['如何屏蔽用户', '如何设置朋友圈权限', '如何关闭消息通知'],
      technical: ['如何清理缓存', '如何更新版本', '如何反馈问题']
    }

    return suggestionMap[category] || ['查看帮助文档', '联系客服', '常见问题']
  }

  // 获取常见问题列表
  getCommonQuestions(): Array<{id: string, question: string, category: string}> {
    const questions = []
    let id = 1

    for (const [key, qa] of this.knowledgeBase) {
      if (qa.keywords && qa.keywords.length > 0) {
        questions.push({
          id: `q_${id++}`,
          question: qa.keywords[0],
          category: qa.category
        })
      }
    }

    return questions
  }

  // 记录用户反馈
  async recordFeedback(questionId: string, rating: number, feedback?: string) {
    try {
      // 这里可以发送到后端进行分析
      console.log('用户反馈记录:', { questionId, rating, feedback })
      
      // 模拟API调用
      return {
        success: true,
        message: '感谢您的反馈'
      }
    } catch (error) {
      console.error('记录反馈失败:', error)
      return {
        success: false,
        message: '反馈记录失败'
      }
    }
  }
}

export const smartCustomerService = new SmartCustomerServiceClass()

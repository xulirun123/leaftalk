// 中文词库服务 - 使用动态加载的方式
export interface DictCandidate {
  text: string
  pinyin: string
  frequency?: number
}

export class ChineseDictService {
  private dict: Record<string, string[]> = {}
  private loaded = false
  private loading = false
  private cacheKey = 'chinese-dict-cache'
  private cacheVersion = '1.0'

  /**
   * 异步加载词库 - 支持本地缓存
   */
  async loadDict(): Promise<void> {
    if (this.loaded || this.loading) return

    this.loading = true

    try {
      // 1. 优先尝试从本地缓存加载
      if (await this.loadFromCache()) {
        console.log('✅ 从本地缓存加载词库成功')
        this.loaded = true
        return
      }

      // 2. 缓存失败，从网络加载
      await this.loadFromMultipleSources()

      // 3. 保存到缓存
      this.saveToCache()

      this.loaded = true
    } catch (error) {
      console.warn('词库加载失败，使用基础词库:', error)
      this.loadBasicDict()
      this.loaded = true
    } finally {
      this.loading = false
    }
  }

  /**
   * 从本地缓存加载词库
   */
  private async loadFromCache(): Promise<boolean> {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return false

      const data = JSON.parse(cached)
      if (data.version !== this.cacheVersion) {
        console.log('缓存版本不匹配，清除旧缓存')
        localStorage.removeItem(this.cacheKey)
        return false
      }

      if (data.dict && Object.keys(data.dict).length > 0) {
        this.dict = data.dict
        console.log(`从缓存加载 ${Object.keys(this.dict).length} 个拼音条目`)
        return true
      }
    } catch (error) {
      console.warn('缓存加载失败:', error)
      localStorage.removeItem(this.cacheKey)
    }

    return false
  }

  /**
   * 保存词库到本地缓存
   */
  private saveToCache(): void {
    try {
      const cacheData = {
        version: this.cacheVersion,
        dict: this.dict,
        timestamp: Date.now()
      }

      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
      console.log('✅ 词库已保存到本地缓存')
    } catch (error) {
      console.warn('保存缓存失败:', error)
    }
  }

  /**
   * 从多个源加载词库
   */
  private async loadFromMultipleSources(): Promise<void> {
    // 优先尝试雾凇拼音词库（在线）
    try {
      console.log('🔄 开始加载雾凇拼音词库...')
      await this.loadOnlineDict()
      console.log('✅ 雾凇拼音词库加载成功')
      return
    } catch (error) {
      console.warn('❌ 雾凇拼音词库加载失败:', error)
    }

    // 备用方案：尝试加载本地词库文件
    try {
      console.log('🔄 尝试加载本地词库...')
      const response = await fetch('/pinyin-dict.json')
      if (response.ok) {
        const data = await response.json()
        this.processDict(data)
        console.log('✅ 本地词库加载成功')
        return
      }
    } catch (error) {
      console.warn('❌ 本地词库加载失败:', error)
    }

    // 最终失败，抛出错误使用内置词库
    throw new Error('所有在线词库都无法加载')
  }

  /**
   * 加载在线词库（优先雾凇拼音词库）
   */
  private async loadOnlineDict(): Promise<void> {
    // 雾凇拼音词库URLs
    const rimeIceUrls = [
      'https://cdn.jsdelivr.net/gh/iDvel/rime-ice@main/cn_dicts/8105.dict.yaml',
      'https://raw.githubusercontent.com/iDvel/rime-ice/main/cn_dicts/8105.dict.yaml',
      'https://cdn.jsdelivr.net/gh/iDvel/rime-ice@main/cn_dicts/41448.dict.yaml',
      'https://raw.githubusercontent.com/iDvel/rime-ice/main/cn_dicts/41448.dict.yaml'
    ]

    // 备用词库URLs
    const backupUrls = [
      'https://cdn.jsdelivr.net/gh/mozillazg/pinyin-data@master/pinyin.txt',
      'https://raw.githubusercontent.com/mozillazg/pinyin-data/master/pinyin.txt'
    ]

    // 优先尝试雾凇拼音词库
    for (const url of rimeIceUrls) {
      try {
        console.log('尝试加载雾凇拼音词库:', url)
        const response = await fetch(url)
        if (response.ok) {
          const text = await response.text()
          this.parseRimeDict(text)
          console.log('雾凇拼音词库加载成功')
          return
        }
      } catch (error) {
        console.warn(`从 ${url} 加载雾凇词库失败:`, error)
      }
    }

    // 备用方案：使用其他词库
    for (const url of backupUrls) {
      try {
        console.log('尝试加载备用词库:', url)
        const response = await fetch(url)
        if (response.ok) {
          const text = await response.text()
          this.parsePinyinData(text)
          console.log('备用词库加载成功')
          return
        }
      } catch (error) {
        console.warn(`从 ${url} 加载备用词库失败:`, error)
      }
    }

    throw new Error('所有在线词库源都无法访问')
  }

  /**
   * 解析雾凇拼音词库（RIME格式）
   */
  private parseRimeDict(text: string): void {
    const lines = text.split('\n')
    let inDataSection = false

    lines.forEach(line => {
      const trimmedLine = line.trim()

      // 跳过注释和空行
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }

      // 检查是否进入数据段
      if (trimmedLine === '...') {
        inDataSection = true
        return
      }

      // 只处理数据段的内容
      if (!inDataSection) {
        return
      }

      try {
        // RIME词库格式：词汇\t拼音\t权重
        const parts = trimmedLine.split('\t')
        if (parts.length >= 2) {
          const word = parts[0].trim()
          const pinyin = parts[1].trim().toLowerCase().replace(/\s+/g, '')

          // 验证是否为有效的中文词汇
          if (word && /[\u4e00-\u9fff]/.test(word) && pinyin && /^[a-z]+$/.test(pinyin)) {
            if (!this.dict[pinyin]) {
              this.dict[pinyin] = []
            }

            // 避免重复添加
            if (!this.dict[pinyin].includes(word)) {
              this.dict[pinyin].push(word)
            }

            // 同时添加首字母缩写支持
            if (word.length > 1) {
              const initials = this.getWordInitials(word)
              if (initials && initials !== pinyin) {
                if (!this.dict[initials]) {
                  this.dict[initials] = []
                }
                if (!this.dict[initials].includes(word)) {
                  this.dict[initials].push(word)
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('解析RIME词库行失败:', trimmedLine, error)
      }
    })

    console.log(`雾凇拼音词库解析完成，共加载 ${Object.keys(this.dict).length} 个拼音条目`)
  }

  /**
   * 获取词汇的首字母缩写
   */
  private getWordInitials(word: string): string {
    // 简化的首字母提取（基于常用字的拼音首字母）
    const initialMap: Record<string, string> = {
      '你': 'n', '好': 'h', '我': 'w', '们': 'm', '他': 't', '她': 't', '它': 't',
      '谢': 'x', '再': 'z', '见': 'j', '对': 'd', '不': 'b', '起': 'q',
      '没': 'm', '关': 'g', '系': 'x', '早': 'z', '上': 's', '下': 'x',
      '午': 'w', '晚': 'w', '明': 'm', '天': 't', '昨': 'z', '今': 'j',
      '朋': 'p', '友': 'y', '老': 'l', '师': 's', '学': 'x', '生': 's',
      '工': 'g', '作': 'z', '时': 's', '间': 'j', '地': 'd', '方': 'f',
      '问': 'w', '题': 't', '办': 'b', '法': 'f', '情': 'q', '况': 'k',
      '意': 'y', '计': 'j', '划': 'h', '希': 'x', '望': 'w', '成': 'c',
      '功': 'g', '日': 'r', '快': 'k', '乐': 'l', '幸': 'x',
      '福': 'f', '健': 'j', '康': 'k', '安': 'a', '全': 'q', '漂': 'p',
      '亮': 'l', '聪': 'c', '中': 'z', '国': 'g', '北': 'b', '京': 'j',
      '海': 'h', '广': 'g', '州': 'z', '深': 's', '圳': 'z', '电': 'd',
      '话': 'h', '脑': 'n', '手': 's', '机': 'j', '网': 'w', '络': 'l'
    }

    let initials = ''
    for (const char of word) {
      const initial = initialMap[char]
      if (initial) {
        initials += initial
      } else {
        // 如果找不到对应的首字母，返回空字符串
        return ''
      }
    }

    return initials
  }

  /**
   * 解析拼音数据（备用格式）
   */
  private parsePinyinData(text: string): void {
    const lines = text.split('\n')

    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const parts = line.split(':')
        if (parts.length === 2) {
          try {
            const unicodeStr = parts[0].replace('U+', '')
            const codePoint = parseInt(unicodeStr, 16)

            // 验证Unicode码点是否有效
            if (isNaN(codePoint) || codePoint < 0x4E00 || codePoint > 0x9FFF) {
              return // 跳过无效的Unicode字符
            }

            const char = String.fromCharCode(codePoint)

            // 验证生成的字符是否为有效的中文字符
            if (!char || char.length === 0 || !/[\u4e00-\u9fff]/.test(char)) {
              return // 跳过无效字符
            }

            const pinyins = parts[1].split(',').map(p => p.trim().toLowerCase())

            pinyins.forEach(pinyin => {
              if (pinyin && /^[a-z]+$/.test(pinyin)) {
                if (!this.dict[pinyin]) {
                  this.dict[pinyin] = []
                }
                if (!this.dict[pinyin].includes(char)) {
                  this.dict[pinyin].push(char)
                }
              }
            })
          } catch (error) {
            console.warn('解析Unicode字符失败:', parts[0], error)
          }
        }
      }
    })
  }

  /**
   * 处理词库数据
   */
  private processDict(data: any): void {
    if (typeof data === 'object') {
      Object.keys(data).forEach(pinyin => {
        if (Array.isArray(data[pinyin])) {
          const validChars: string[] = []

          data[pinyin].forEach((item: string) => {
            try {
              if (item.startsWith('U+')) {
                // 处理Unicode编码格式
                const codePoint = parseInt(item.replace('U+', ''), 16)

                // 验证Unicode码点是否为有效的中文字符
                if (!isNaN(codePoint) && codePoint >= 0x4E00 && codePoint <= 0x9FFF) {
                  const char = String.fromCharCode(codePoint)
                  if (char && /[\u4e00-\u9fff]/.test(char)) {
                    validChars.push(char)
                  }
                }
              } else if (typeof item === 'string' && /[\u4e00-\u9fff]/.test(item)) {
                // 直接是中文字符
                validChars.push(item)
              }
            } catch (error) {
              console.warn('处理字符失败:', item, error)
            }
          })

          if (validChars.length > 0) {
            this.dict[pinyin.toLowerCase()] = validChars
          }
        }
      })
    }
  }

  /**
   * 加载基础词库（备用方案）- 包含词汇和连拼支持
   */
  private loadBasicDict(): void {
    this.dict = {
      // 单字
      'a': ['啊', '阿', '呀', '呵', '嗄'],
      'ai': ['爱', '哀', '挨', '癌', '艾'],
      'an': ['安', '按', '案', '暗', '岸'],
      'ao': ['奥', '傲', '澳', '熬', '袄'],
      'ba': ['把', '吧', '爸', '八', '巴'],
      'bai': ['白', '百', '拜', '败', '摆'],
      'ban': ['办', '半', '班', '版', '板'],
      'bang': ['帮', '邦', '榜', '膀', '绑'],
      'bao': ['报', '包', '保', '抱', '暴'],
      'bei': ['被', '北', '背', '杯', '悲'],
      'ben': ['本', '奔', '笨', '苯'],
      'bi': ['比', '必', '笔', '闭', '毕'],
      'bian': ['变', '边', '便', '遍', '编'],
      'biao': ['表', '标', '彪', '镖', '飙'],
      'bie': ['别', '憋', '瘪', '鳖'],
      'bin': ['宾', '滨', '兵', '冰', '并'],
      'bo': ['不', '部', '步', '布', '补'],
      'bu': ['不', '部', '步', '布', '补'],
      'ca': ['擦', '猜', '才', '材', '财'],
      'cai': ['才', '材', '财', '采', '彩'],
      'can': ['参', '残', '惭', '惨', '灿'],
      'cao': ['草', '操', '糙', '槽', '曹'],
      'ce': ['策', '测', '侧', '厕', '册'],
      'cha': ['查', '茶', '差', '插', '叉'],
      'chai': ['拆', '柴', '豺', '钗'],
      'chan': ['产', '长', '常', '场', '厂'],
      'chang': ['长', '常', '场', '厂', '唱'],
      'chao': ['朝', '潮', '炒', '吵', '超'],
      'che': ['车', '彻', '撤', '扯', '澈'],
      'chen': ['成', '城', '承', '程', '称'],
      'cheng': ['成', '城', '承', '程', '称'],
      'chi': ['吃', '持', '池', '迟', '尺'],
      'chong': ['冲', '充', '虫', '崇', '宠'],
      'chou': ['抽', '愁', '筹', '稠', '丑'],
      'chu': ['出', '初', '除', '处', '楚'],
      'chuai': ['揣', '踹'],
      'chuan': ['传', '川', '船', '穿', '串'],
      'chuang': ['创', '床', '窗', '闯', '撞'],
      'chui': ['吹', '垂', '锤', '炊'],
      'chun': ['春', '纯', '唇', '蠢', '淳'],
      'chuo': ['戳', '绰', '啜'],
      'ci': ['此', '次', '词', '辞', '慈'],
      'cong': ['从', '丛', '聪', '葱', '匆'],
      'cu': ['粗', '醋', '簇', '促', '蹴'],
      'cuan': ['窜', '篡', '蹿'],
      'cui': ['催', '脆', '翠', '摧', '粹'],
      'cun': ['存', '村', '寸', '忖'],
      'cuo': ['错', '措', '挫', '搓', '磋'],
      'd': ['的', '到', '都', '大', '对'],
      'da': ['大', '打', '达', '答', '搭'],
      'dai': ['带', '代', '待', '袋', '贷'],
      'dan': ['但', '单', '担', '蛋', '淡'],
      'dang': ['当', '党', '档', '挡', '荡'],
      'dao': ['到', '道', '刀', '倒', '导'],
      'de': ['的', '得', '地', '德'],
      'deng': ['等', '登', '灯', '邓', '瞪'],
      'di': ['地', '第', '低', '底', '弟'],
      'dian': ['点', '电', '店', '典', '垫'],
      'diao': ['调', '掉', '钓', '吊', '雕'],
      'die': ['跌', '爹', '叠', '蝶', '迭'],
      'ding': ['定', '顶', '订', '丁', '钉'],
      'diu': ['丢', '铥'],
      'dong': ['东', '动', '懂', '冬', '洞'],
      'dou': ['都', '斗', '豆', '逗', '陡'],
      'du': ['读', '度', '独', '毒', '堵'],
      'duan': ['段', '断', '短', '端', '锻'],
      'dui': ['对', '队', '堆', '兑', '怼'],
      'dun': ['顿', '蹲', '敦', '墩', '盾'],
      'duo': ['多', '朵', '躲', '夺', '堕'],
      'e': ['额', '恶', '饿', '鹅', '呃'],
      'en': ['恩', '嗯'],
      'er': ['而', '儿', '耳', '二', '尔'],
      'f': ['发', '放', '分', '风', '法'],
      'fa': ['发', '法', '罚', '乏', '伐'],
      'fan': ['反', '返', '犯', '范', '饭'],
      'fang': ['方', '房', '放', '防', '访'],
      'fei': ['飞', '非', '费', '肥', '废'],
      'fen': ['分', '份', '粉', '奋', '愤'],
      'feng': ['风', '封', '峰', '锋', '疯'],
      'fo': ['佛', '否'],
      'fou': ['否', '缶'],
      'fu': ['父', '付', '富', '副', '复'],
      'g': ['个', '给', '过', '国', '公'],
      'ga': ['嘎', '噶'],
      'gai': ['该', '改', '盖', '概', '钙'],
      'gan': ['干', '感', '敢', '赶', '刚'],
      'gang': ['刚', '钢', '岗', '港', '杠'],
      'gao': ['高', '告', '搞', '稿', '糕'],
      'ge': ['个', '各', '格', '歌', '哥'],
      'gei': ['给'],
      'gen': ['根', '跟', '亘'],
      'geng': ['更', '耕', '庚', '梗'],
      'gong': ['工', '公', '功', '攻', '宫'],
      'gou': ['够', '狗', '购', '构', '沟'],
      'gu': ['古', '故', '顾', '固', '骨'],
      'gua': ['瓜', '刮', '挂', '寡'],
      'guai': ['怪', '乖', '拐'],
      'guan': ['关', '观', '管', '官', '冠'],
      'guang': ['光', '广', '逛'],
      'gui': ['贵', '鬼', '跪', '规', '归'],
      'gun': ['滚', '棍', '辊'],
      'guo': ['过', '国', '果', '锅', '裹'],
      'h': ['和', '会', '还', '很', '后'],
      'ha': ['哈', '蛤'],
      'hai': ['还', '海', '害', '孩', '骇'],
      'han': ['汉', '含', '寒', '喊', '罕'],
      'hang': ['行', '航', '杭', '巷'],
      'hao': ['好', '号', '豪', '毫', '浩'],
      'he': ['和', '河', '何', '合', '黑'],
      'hei': ['黑', '嘿'],
      'hen': ['很', '恨', '狠', '痕'],
      'heng': ['横', '衡', '恒'],
      'hong': ['红', '洪', '宏', '虹', '轰'],
      'hou': ['后', '候', '厚', '侯', '喉'],
      'hu': ['呼', '湖', '虎', '户', '护'],
      'hua': ['话', '花', '华', '画', '化'],
      'huai': ['坏', '怀', '淮', '槐'],
      'huan': ['换', '还', '环', '欢', '缓'],
      'huang': ['黄', '皇', '荒', '慌', '晃'],
      'hui': ['会', '回', '汇', '慧', '辉'],
      'hun': ['混', '昏', '魂', '婚'],
      'huo': ['火', '活', '或', '货', '获'],
      // 常用词汇和短语
      'ni': ['你', '尼', '泥', '逆', '匿'],
      'wo': ['我', '握', '沃', '卧', '窝'],
      'ta': ['他', '她', '它', '塔', '踏'],
      'shi': ['是', '时', '十', '事', '实'],
      'zai': ['在', '再', '载', '栽'],
      'you': ['有', '又', '右', '由'],
      'le': ['了', '乐', '勒'],
      'yi': ['一', '以', '已', '意'],

      // 双字词汇
      'nihao': ['你好'],
      'women': ['我们'],
      'nimen': ['你们'],
      'tamen': ['他们'],
      'xiexie': ['谢谢'],
      'zaijian': ['再见'],
      'duibuqi': ['对不起'],
      'meiguanxi': ['没关系'],
      'zaoshang': ['早上'],
      'xiawu': ['下午'],
      'wanshang': ['晚上'],
      'mingtian': ['明天'],
      'zuotian': ['昨天'],
      'jintian': ['今天'],
      'xingqi': ['星期'],
      'pengyou': ['朋友'],
      'laoshi': ['老师'],
      'xuesheng': ['学生'],
      'gongzuo': ['工作'],
      'xuexi': ['学习'],
      'shenghuo': ['生活'],
      'jiating': ['家庭'],
      'shijian': ['时间'],
      'difang': ['地方'],
      'wenti': ['问题'],
      'banfa': ['办法'],
      'qingkuang': ['情况'],
      'yijian': ['意见'],
      'jihua': ['计划'],
      'xiwang': ['希望'],
      'chenggong': ['成功'],
      'shengri': ['生日'],
      'kuaile': ['快乐'],
      'xinfu': ['幸福'],
      'jiankang': ['健康'],
      'anquan': ['安全'],
      'meili': ['美丽'],
      'piaoliang': ['漂亮'],
      'congming': ['聪明'],
      'nuli': ['努力'],
      'renzhen': ['认真'],
      'xixin': ['细心'],
      'naixin': ['耐心'],
      'aixin': ['爱心'],
      'guanxin': ['关心'],
      'bangzhu': ['帮助'],
      'zhichi': ['支持'],
      'guli': ['鼓励'],
      'ganxie': ['感谢'],
      'baoqian': ['抱歉'],
      'duanxin': ['短信'],
      'dianhua': ['电话'],
      'shouji': ['手机'],
      'diannao': ['电脑'],
      'wangluo': ['网络'],
      'hulianwang': ['互联网'],
      'xinxi': ['信息'],
      'xiaoxi': ['消息'],
      'tongzhi': ['通知'],
      'huiyi': ['会议'],
      'baogao': ['报告'],
      'jieshao': ['介绍'],
      'shuoming': ['说明'],
      'jianyi': ['建议'],
      'yaoqiu': ['要求'],
      'jueding': ['决定'],
      'xuanze': ['选择'],
      'kaishi': ['开始'],
      'jieshu': ['结束'],
      'wancheng': ['完成'],
      'chengjiu': ['成就'],
      'jinbu': ['进步'],
      'fazhan': ['发展'],
      'bianhua': ['变化'],
      'tigao': ['提高'],
      'gaijin': ['改进'],
      'chuangxin': ['创新'],
      'faxian': ['发现'],
      'yanjiu': ['研究'],
      'xuewen': ['学问'],
      'zhishi': ['知识'],
      'jineng': ['技能'],
      'nengli': ['能力'],
      'jingyan': ['经验'],
      'lishi': ['历史'],
      'wenhua': ['文化'],
      'yishu': ['艺术'],
      'yinyue': ['音乐'],
      'dianying': ['电影'],
      'tushu': ['图书'],
      'zazhi': ['杂志'],
      'baozhi': ['报纸'],
      'xinwen': ['新闻'],
      'gushi': ['故事'],
      'xiaoshuo': ['小说'],
      'shige': ['诗歌'],
      'wenzhang': ['文章'],
      'riqi': ['日期'],
      'nianfen': ['年份'],
      'yuefen': ['月份'],
      'xingqitian': ['星期天'],
      'zhoumo': ['周末'],
      'jiari': ['假日'],
      'jieqi': ['节气'],
      'chunjie': ['春节'],
      'zhongqiu': ['中秋'],
      'guoqing': ['国庆'],
      'shengdan': ['圣诞'],
      'xinnian': ['新年'],
      'yuandan': ['元旦'],
      'qingming': ['清明'],
      'duanwu': ['端午'],
      'qixi': ['七夕'],
      'zhongyang': ['重阳'],

      // 首字母缩写词汇（每个字的首字母拼音）
      'nh': ['你好'],           // 你(ni)好(hao)
      'wm': ['我们'],           // 我(wo)们(men)
      'nm': ['你们'],           // 你(ni)们(men)
      'tm': ['他们'],           // 他(ta)们(men)
      'xx': ['谢谢', '学习'],   // 谢(xie)谢(xie) / 学(xue)习(xi)
      'zj': ['再见'],           // 再(zai)见(jian)
      'dbq': ['对不起'],        // 对(dui)不(bu)起(qi)
      'mgx': ['没关系'],        // 没(mei)关(guan)系(xi)
      'zs': ['早上', '知识'],   // 早(zao)上(shang) / 知(zhi)识(shi)
      'xw': ['下午', '希望', '新闻'], // 下(xia)午(wu) / 希(xi)望(wang) / 新(xin)闻(wen)
      'ws': ['晚上'],           // 晚(wan)上(shang)
      'mt': ['明天'],           // 明(ming)天(tian)
      'zt': ['昨天'],           // 昨(zuo)天(tian)
      'jt': ['今天', '家庭'],   // 今(jin)天(tian) / 家(jia)庭(ting)
      'py': ['朋友'],           // 朋(peng)友(you)
      'ls': ['老师', '历史'],   // 老(lao)师(shi) / 历(li)史(shi)
      'xs': ['学生', '消息', '小说'], // 学(xue)生(sheng) / 消(xiao)息(xi) / 小(xiao)说(shuo)
      'gz': ['工作', '广州'],   // 工(gong)作(zuo) / 广(guang)州(zhou)
      'sj': ['时间', '手机'],   // 时(shi)间(jian) / 手(shou)机(ji)
      'df': ['地方'],           // 地(di)方(fang)
      'wt': ['问题'],           // 问(wen)题(ti)
      'bf': ['办法'],           // 办(ban)法(fa)
      'qk': ['情况'],           // 情(qing)况(kuang)
      'yj': ['意见', '研究'],   // 意(yi)见(jian) / 研(yan)究(jiu)
      'jh': ['计划'],           // 计(ji)划(hua)
      'cg': ['成功'],           // 成(cheng)功(gong)
      'sr': ['生日'],           // 生(sheng)日(ri)
      'kl': ['快乐'],           // 快(kuai)乐(le)
      'xf': ['幸福'],           // 幸(xing)福(fu)
      'jk': ['健康'],           // 健(jian)康(kang)
      'aq': ['安全'],           // 安(an)全(quan)
      'pl': ['漂亮'],           // 漂(piao)亮(liang)
      'cm': ['聪明'],           // 聪(cong)明(ming)
      'zg': ['中国'],           // 中(zhong)国(guo)
      'bj': ['北京'],           // 北(bei)京(jing)
      'sh': ['上海'],           // 上(shang)海(hai)
      'sz': ['深圳'],           // 深(shen)圳(zhen)
      'dh': ['电话'],           // 电(dian)话(hua)
      'dn': ['电脑'],           // 电(dian)脑(nao)
      'wl': ['网络'],           // 网(wang)络(luo)
      'tz': ['通知'],           // 通(tong)知(zhi)
      'hy': ['会议'],           // 会(hui)议(yi)
      'bg': ['报告'],           // 报(bao)告(gao)
      'js': ['介绍', '结束'],   // 介(jie)绍(shao) / 结(jie)束(shu)
      'sm': ['说明'],           // 说(shuo)明(ming)
      'jy': ['建议', '经验'],   // 建(jian)议(yi) / 经(jing)验(yan)
      'yq': ['要求'],           // 要(yao)求(qiu)
      'jd': ['决定'],           // 决(jue)定(ding)
      'xz': ['选择'],           // 选(xuan)择(ze)
      'ks': ['开始'],           // 开(kai)始(shi)
      'wc': ['完成'],           // 完(wan)成(cheng)
      'cj': ['成就', '春节'],   // 成(cheng)就(jiu) / 春(chun)节(jie)
      'jb': ['进步'],           // 进(jin)步(bu)
      'fz': ['发展'],           // 发(fa)展(zhan)
      'bh': ['变化'],           // 变(bian)化(hua)
      'tg': ['提高'],           // 提(ti)高(gao)
      'gj': ['改进'],           // 改(gai)进(jin)
      'cx': ['创新'],           // 创(chuang)新(xin)
      'fx': ['发现'],           // 发(fa)现(xian)
      'nl': ['能力'],           // 能(neng)力(li)
      'wh': ['文化'],           // 文(wen)化(hua)
      'ys': ['艺术'],           // 艺(yi)术(shu)
      'yy': ['音乐'],           // 音(yin)乐(yue)
      'dy': ['电影'],           // 电(dian)影(ying)
      'ts': ['图书'],           // 图(tu)书(shu)
      'zz': ['杂志'],           // 杂(za)志(zhi)
      'bz': ['报纸'],           // 报(bao)纸(zhi)
      'gs': ['故事'],           // 故(gu)事(shi)
      'sg': ['诗歌'],           // 诗(shi)歌(ge)
      'wz': ['文章'],           // 文(wen)章(zhang)
      'rq': ['日期'],           // 日(ri)期(qi)
      'nf': ['年份'],           // 年(nian)份(fen)
      'yf': ['月份'],           // 月(yue)份(fen)
      'xq': ['星期'],           // 星(xing)期(qi)
      'zm': ['周末'],           // 周(zhou)末(mo)
      'jr': ['假日'],           // 假(jia)日(ri)
      'jq': ['节气'],           // 节(jie)气(qi)
      'zq': ['中秋'],           // 中(zhong)秋(qiu)
      'gq': ['国庆'],           // 国(guo)庆(qing)
      'sd': ['圣诞'],           // 圣(sheng)诞(dan)
      'xn': ['新年'],           // 新(xin)年(nian)
      'yd': ['元旦']            // 元(yuan)旦(dan)
    }
  }

  /**
   * 获取候选字 - 支持连拼和首拼
   */
  async getCandidates(input: string): Promise<DictCandidate[]> {
    if (!this.loaded) {
      await this.loadDict()
    }

    const candidates: DictCandidate[] = []
    const lowerInput = input.toLowerCase()

    // 1. 直接匹配（最高优先级）
    if (this.dict[lowerInput]) {
      this.dict[lowerInput].forEach((text, index) => {
        candidates.push({
          text,
          pinyin: lowerInput,
          frequency: 100 - index
        })
      })
    }

    // 2. 连拼匹配（如 nihao -> ni hao）
    const pinyinSegments = this.segmentPinyin(lowerInput)
    if (pinyinSegments.length > 1) {
      const combinedWords = this.getCombinedWords(pinyinSegments)
      combinedWords.forEach((text, index) => {
        if (!candidates.find(c => c.text === text)) {
          candidates.push({
            text,
            pinyin: lowerInput,
            frequency: 90 - index
          })
        }
      })
    }

    // 3. 首字母匹配（如 nh -> 你好）
    const initialMatches = this.getInitialMatches(lowerInput)
    initialMatches.forEach((text, index) => {
      if (!candidates.find(c => c.text === text)) {
        candidates.push({
          text,
          pinyin: lowerInput,
          frequency: 80 - index
        })
      }
    })

    // 4. 前缀匹配
    if (candidates.length < 10) {
      Object.keys(this.dict).forEach(pinyin => {
        if (pinyin.startsWith(lowerInput) && pinyin !== lowerInput) {
          this.dict[pinyin].slice(0, 3).forEach((text, index) => {
            if (!candidates.find(c => c.text === text)) {
              candidates.push({
                text,
                pinyin: pinyin,
                frequency: 50 - index
              })
            }
          })
        }
      })
    }

    // 按频率排序
    candidates.sort((a, b) => (b.frequency || 0) - (a.frequency || 0))

    return candidates.slice(0, 10)
  }

  /**
   * 拼音分词 - 将连续拼音分解为单个拼音
   */
  private segmentPinyin(input: string): string[] {
    const validPinyins = [
      'zhuang', 'chuang', 'shuang', 'zhang', 'chang', 'shang', 'zheng', 'cheng', 'sheng',
      'zhing', 'ching', 'shing', 'zhong', 'chong', 'shong', 'zhuai', 'chuai', 'shuai',
      'zhuan', 'chuan', 'shuan', 'zhen', 'chen', 'shen', 'zhou', 'chou', 'shou',
      'zhui', 'chui', 'shui', 'zhun', 'chun', 'shun', 'zhuo', 'chuo', 'shuo',
      'zhai', 'chai', 'shai', 'zhao', 'chao', 'shao', 'zhan', 'chan', 'shan',
      'zhi', 'chi', 'shi', 'zhu', 'chu', 'shu', 'zha', 'cha', 'sha', 'zhe', 'che', 'she',
      'ang', 'eng', 'ing', 'ong', 'uan', 'uang', 'iang', 'iong', 'uai', 'iao',
      'ai', 'ei', 'ao', 'ou', 'an', 'en', 'in', 'un', 'ia', 'ie', 'ua', 'ue', 'uo',
      'a', 'o', 'e', 'i', 'u', 'v',
      'ba', 'pa', 'ma', 'fa', 'da', 'ta', 'na', 'la', 'ga', 'ka', 'ha', 'ja', 'qa', 'xa',
      'bi', 'pi', 'mi', 'di', 'ti', 'ni', 'li', 'gi', 'ki', 'hi', 'ji', 'qi', 'xi',
      'bu', 'pu', 'mu', 'fu', 'du', 'tu', 'nu', 'lu', 'gu', 'ku', 'hu', 'ju', 'qu', 'xu',
      'bo', 'po', 'mo', 'fo', 'do', 'to', 'no', 'lo', 'go', 'ko', 'ho', 'jo', 'qo', 'xo',
      'be', 'pe', 'me', 'fe', 'de', 'te', 'ne', 'le', 'ge', 'ke', 'he', 'je', 'qe', 'xe',
      'bai', 'pai', 'mai', 'dai', 'tai', 'nai', 'lai', 'gai', 'kai', 'hai', 'zai', 'cai', 'sai',
      'bei', 'pei', 'mei', 'fei', 'dei', 'nei', 'lei', 'gei', 'hei', 'zei', 'cei', 'sei',
      'bao', 'pao', 'mao', 'dao', 'tao', 'nao', 'lao', 'gao', 'kao', 'hao', 'zao', 'cao', 'sao',
      'ban', 'pan', 'man', 'fan', 'dan', 'tan', 'nan', 'lan', 'gan', 'kan', 'han', 'zan', 'can', 'san',
      'ben', 'pen', 'men', 'fen', 'den', 'nen', 'len', 'gen', 'ken', 'hen', 'zen', 'cen', 'sen',
      'bin', 'pin', 'min', 'din', 'tin', 'nin', 'lin', 'gin', 'kin', 'hin', 'jin', 'qin', 'xin',
      'bun', 'pun', 'mun', 'fun', 'dun', 'tun', 'nun', 'lun', 'gun', 'kun', 'hun', 'jun', 'qun', 'xun',
      'bang', 'pang', 'mang', 'fang', 'dang', 'tang', 'nang', 'lang', 'gang', 'kang', 'hang', 'zang', 'cang', 'sang',
      'beng', 'peng', 'meng', 'feng', 'deng', 'teng', 'neng', 'leng', 'geng', 'keng', 'heng', 'zeng', 'ceng', 'seng',
      'bing', 'ping', 'ming', 'ding', 'ting', 'ning', 'ling', 'ging', 'king', 'hing', 'jing', 'qing', 'xing',
      'bong', 'pong', 'mong', 'fong', 'dong', 'tong', 'nong', 'long', 'gong', 'kong', 'hong', 'zong', 'cong', 'song',
      'ya', 'wa', 'yu', 'wu', 'ye', 'yue', 'yi', 'yin', 'ying', 'yo', 'you', 'yan', 'yang', 'yao', 'yong'
    ]

    // 按长度从长到短排序，优先匹配长拼音
    validPinyins.sort((a, b) => b.length - a.length)

    const segments: string[] = []
    let remaining = input

    while (remaining.length > 0) {
      let matched = false

      for (const pinyin of validPinyins) {
        if (remaining.startsWith(pinyin)) {
          segments.push(pinyin)
          remaining = remaining.slice(pinyin.length)
          matched = true
          break
        }
      }

      if (!matched) {
        // 如果无法匹配，取第一个字符
        segments.push(remaining[0])
        remaining = remaining.slice(1)
      }
    }

    return segments
  }

  /**
   * 获取组合词汇
   */
  private getCombinedWords(segments: string[]): string[] {
    const results: string[] = []

    // 尝试组合相邻的拼音段
    for (let i = 0; i < segments.length - 1; i++) {
      const combined = segments.slice(i, i + 2).join('')
      if (this.dict[combined]) {
        results.push(...this.dict[combined])
      }
    }

    // 尝试组合所有段
    if (segments.length > 2) {
      const fullCombined = segments.join('')
      if (this.dict[fullCombined]) {
        results.push(...this.dict[fullCombined])
      }
    }

    return results
  }

  /**
   * 获取首字母匹配
   */
  private getInitialMatches(input: string): string[] {
    const results: string[] = []

    // 直接查找首字母缩写
    if (this.dict[input]) {
      results.push(...this.dict[input])
    }

    return results
  }

  /**
   * 清空缓存
   */
  clear(): void {
    // 保留已加载的词库
  }

  /**
   * 获取词库状态
   */
  getStatus(): { loaded: boolean; loading: boolean; dictSize: number } {
    return {
      loaded: this.loaded,
      loading: this.loading,
      dictSize: Object.keys(this.dict).length
    }
  }
}

// 导出单例
export const chineseDictService = new ChineseDictService()

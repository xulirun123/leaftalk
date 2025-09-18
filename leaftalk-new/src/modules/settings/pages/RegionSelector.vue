<template>
  <div class="region-selector">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      :title="getPageTitle()"
      :show-back="true"
      @back="goBack"
      :right-buttons="topBarButtons"
      @button-click="handleTopBarAction"
    />

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 当前位置文本 -->
      <div class="current-location">
        <span class="current-text">当前位置{{ currentRegion ? '：' + currentRegion : '' }}</span>
      </div>

    <!-- 自动定位容器 -->
    <div class="auto-location-container">
      <div class="auto-location-item" @click="handleAutoLocationClick">
        <div class="location-info">
          <iconify-icon icon="heroicons:map-pin" width="20" class="location-icon"></iconify-icon>
          <div class="location-text">
            <div class="location-name">{{ autoLocationText }}</div>
          </div>
        </div>
        <iconify-icon
          v-if="isLocating"
          icon="heroicons:arrow-path"
          width="16"
          class="loading-icon spin"
        ></iconify-icon>
        <iconify-icon
          v-else-if="selectedRegion === autoLocationText && autoLocationText && autoLocationText !== '正在定位...' && autoLocationText !== '定位失败，请手动选择'"
          icon="heroicons:check"
          width="16"
          class="check-icon"
        ></iconify-icon>
        <iconify-icon
          v-else
          icon="heroicons:chevron-right"
          width="16"
          class="arrow-icon"
        ></iconify-icon>
      </div>
    </div>

    <!-- 选择地区文本 -->
    <div class="select-region-text">
      <span>选择地区</span>
    </div>

    <!-- 地区选择列表 -->
    <div class="regions-container">
      <div
        v-for="(region, index) in regions"
        :key="`${currentLevel}-${index}-${region}`"
        class="region-item"
        :class="{ selected: isRegionSelected(region) }"
        @click="selectRegion(region)"
      >
        <span class="region-name">{{ region }}</span>
        <div class="region-actions">
          <!-- 选中状态的勾选图标 -->
          <iconify-icon
            v-if="isRegionSelected(region)"
            icon="heroicons:check-circle"
            width="20"
            class="check-icon"
          ></iconify-icon>
          <!-- 特定地区的右向箭头 -->
          <iconify-icon
            v-if="shouldShowArrow(region)"
            icon="heroicons:chevron-right"
            width="16"
            class="arrow-icon"
          ></iconify-icon>
        </div>
      </div>
    </div>
    </div> <!-- 关闭内容区域 -->

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { userAPI } from '../../auth/services/api'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const selectedRegion = ref('')
const currentRegion = ref('')
const isSaving = ref(false)
const isLocating = ref(false)
const autoLocationText = ref('正在定位...')

// 页面状态
const currentLevel = ref(0) // 0: 国家/地区, 1: 省份, 2: 城市
const breadcrumb = ref<string[]>([]) // 面包屑导航
const selectedCountry = ref('') // 选中的国家
const selectedProvince = ref('') // 选中的省份

// 中国省份数据
const chinaProvinces = [
  // 直辖市
  '北京市',
  '上海市',
  '天津市',
  '重庆市',

  // 省份
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',

  // 自治区
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区'
]

// 直辖市和特殊地区的区县数据
const municipalityDistricts = {
  '北京市': [
    '东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区',
    '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区',
    '怀柔区', '平谷区', '密云区', '延庆区'
  ],
  '上海市': [
    '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区',
    '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区',
    '松江区', '青浦区', '奉贤区', '崇明区'
  ],
  '天津市': [
    '和平区', '河东区', '河西区', '南开区', '河北区', '红桥区',
    '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区',
    '滨海新区', '宁河区', '静海区', '蓟州区'
  ],
  '重庆市': [
    '万州区', '涪陵区', '渝中区', '大渡口区', '江北区', '沙坪坝区',
    '九龙坡区', '南岸区', '北碚区', '綦江区', '大足区', '渝北区',
    '巴南区', '黔江区', '长寿区', '江津区', '合川区', '永川区',
    '南川区', '璧山区', '铜梁区', '潼南区', '荣昌区', '开州区',
    '梁平区', '武隆区'
  ],
  '中国香港': [
    '中西区', '湾仔区', '东区', '南区', '深水埗区', '油尖旺区',
    '九龙城区', '黄大仙区', '观塘区', '荃湾区', '屯门区', '元朗区',
    '北区', '大埔区', '沙田区', '西贡区', '离岛区', '葵青区'
  ],
  '中国澳门': [
    '花地玛堂区', '圣安多尼堂区', '大堂区', '望德堂区', '风顺堂区',
    '嘉模堂区', '圣方济各堂区', '路氹城'
  ],
  '中国台湾': [
    '台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉义市', '新竹县', '苗栗县', '彰化县',
    '南投县', '云林县', '嘉义县', '屏东县', '宜兰县', '花莲县',
    '台东县', '澎湖县', '金门县', '连江县'
  ],
  '内蒙古自治区': [
    '呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市',
    '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'
  ],
  '广西壮族自治区': [
    '南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市',
    '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市',
    '来宾市', '崇左市'
  ],
  '西藏自治区': [
    '拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'
  ],
  '宁夏回族自治区': [
    '银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'
  ],
  '新疆维吾尔自治区': [
    '乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州',
    '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州',
    '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区'
  ],
  '河北省': [
    '石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市',
    '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'
  ],
  '山西省': [
    '太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市',
    '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'
  ],
  '辽宁省': [
    '沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市',
    '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市',
    '朝阳市', '葫芦岛市'
  ],
  '吉林省': [
    '长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市',
    '松原市', '白城市', '延边朝鲜族自治州'
  ],
  '黑龙江省': [
    '哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市',
    '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市', '大兴安岭地区'
  ],
  '江苏省': [
    '南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市',
    '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'
  ],
  '浙江省': [
    '杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市',
    '金华市', '衢州市', '舟山市', '台州市', '丽水市'
  ],
  '安徽省': [
    '合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市',
    '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市',
    '六安市', '亳州市', '池州市', '宣城市'
  ],
  '福建省': [
    '福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市',
    '南平市', '龙岩市', '宁德市'
  ],
  '江西省': [
    '南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市',
    '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'
  ],
  '陕西省': [
    '西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市',
    '汉中市', '榆林市', '安康市', '商洛市'
  ],
  '山东省': [
    '济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市',
    '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市',
    '德州市', '聊城市', '滨州市', '菏泽市'
  ],
  '河南省': [
    '郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市',
    '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市',
    '南阳市', '商丘市', '信阳市', '周口市', '驻马店市', '济源市'
  ],
  '湖北省': [
    '武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市',
    '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市',
    '恩施土家族苗族自治州', '仙桃市', '潜江市', '天门市', '神农架林区'
  ],
  '湖南省': [
    '长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市',
    '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市',
    '娄底市', '湘西土家族苗族自治州'
  ],
  '广东省': [
    '广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市',
    '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市',
    '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市',
    '潮州市', '揭阳市', '云浮市'
  ],
  '海南省': [
    '海口市', '三亚市', '三沙市', '儋州市', '五指山市', '琼海市',
    '文昌市', '万宁市', '东方市', '定安县', '屯昌县', '澄迈县',
    '临高县', '白沙黎族自治县', '昌江黎族自治县', '乐东黎族自治县',
    '陵水黎族自治县', '保亭黎族苗族自治县', '琼中黎族苗族自治县'
  ],
  '四川省': [
    '成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市',
    '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市',
    '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市',
    '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'
  ],
  '贵州省': [
    '贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市',
    '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'
  ],
  '云南省': [
    '昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市',
    '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州',
    '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州',
    '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'
  ],
  '甘肃省': [
    '兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市',
    '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市',
    '临夏回族自治州', '甘南藏族自治州'
  ],
  '青海省': [
    '西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州',
    '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'
  ],
  '日本': [
    '北海道', '青森县', '岩手县', '宫城县', '秋田县', '山形县', '福岛县',
    '茨城县', '栃木县', '群马县', '埼玉县', '千叶县', '东京都', '神奈川县',
    '新潟县', '富山县', '石川县', '福井县', '山梨县', '长野县', '岐阜县',
    '静冈县', '爱知县', '三重县', '滋贺县', '京都府', '大阪府', '兵库县',
    '奈良县', '和歌山县', '鸟取县', '岛根县', '冈山县', '广岛县', '山口县',
    '德岛县', '香川县', '爱媛县', '高知县', '福冈县', '佐贺县', '长崎县',
    '熊本县', '大分县', '宫崎县', '鹿儿岛县', '冲绳县'
  ],
  '韩国': [
    '首尔特别市', '釜山广域市', '大邱广域市', '仁川广域市', '光州广域市',
    '大田广域市', '蔚山广域市', '世宗特别自治市', '京畿道', '江原道',
    '忠清北道', '忠清南道', '全罗北道', '全罗南道', '庆尚北道', '庆尚南道', '济州特别自治道'
  ],
  '美国': [
    '阿拉巴马州', '阿拉斯加州', '亚利桑那州', '阿肯色州', '加利福尼亚州',
    '科罗拉多州', '康涅狄格州', '特拉华州', '佛罗里达州', '佐治亚州',
    '夏威夷州', '爱达荷州', '伊利诺伊州', '印第安纳州', '爱荷华州',
    '堪萨斯州', '肯塔基州', '路易斯安那州', '缅因州', '马里兰州',
    '马萨诸塞州', '密歇根州', '明尼苏达州', '密西西比州', '密苏里州',
    '蒙大拿州', '内布拉斯加州', '内华达州', '新罕布什尔州', '新泽西州',
    '新墨西哥州', '纽约州', '北卡罗来纳州', '北达科他州', '俄亥俄州',
    '俄克拉荷马州', '俄勒冈州', '宾夕法尼亚州', '罗得岛州', '南卡罗来纳州',
    '南达科他州', '田纳西州', '得克萨斯州', '犹他州', '佛蒙特州',
    '弗吉尼亚州', '华盛顿州', '西弗吉尼亚州', '威斯康星州', '怀俄明州',
    '华盛顿特区'
  ],
  '新加坡': [
    '中区', '东北区', '西北区', '东南区', '西南区'
  ],
  '马来西亚': [
    '柔佛州', '吉打州', '吉兰丹州', '马六甲州', '森美兰州', '彭亨州',
    '槟城州', '霹雳州', '玻璃市州', '雪兰莪州', '登嘉楼州', '沙巴州',
    '砂拉越州', '吉隆坡联邦直辖区', '布城联邦直辖区', '纳闽联邦直辖区'
  ],
  '越南': [
    '河内市', '胡志明市', '海防市', '岘港市', '芹苴市', '安江省',
    '薄辽省', '北江省', '北干省', '北宁省', '槟椥省', '平定省',
    '平阳省', '平福省', '平顺省', '金瓯省', '高平省', '得乐省',
    '得农省', '奠边省', '同奈省', '同塔省', '嘉莱省', '河江省',
    '河南省', '河静省', '后江省', '兴安省', '和平省', '承天顺化省',
    '坚江省', '江原省', '老街省', '林同省', '隆安省', '南定省',
    '义安省', '宁平省', '宁顺省', '富寿省', '富安省', '富国岛',
    '广平省', '广南省', '广义省', '广宁省', '山罗省', '西宁省',
    '清化省', '太平省', '太原省', '永隆省', '永福省', '朔庄省',
    '宣光省', '安沛省', '巴地头顿省', '北部湾省', '茶荣省', '多乐省',
    '奠边省', '河西省', '老街省', '莱州省', '山萝省'
  ],
  '印度尼西亚': [
    '雅加达首都特区', '万丹省', '西爪哇省', '中爪哇省', '日惹特区',
    '东爪哇省', '巴厘省', '西努沙登加拉省', '东努沙登加拉省', '西加里曼丹省',
    '中加里曼丹省', '南加里曼丹省', '东加里曼丹省', '北加里曼丹省', '北苏门答腊省',
    '西苏门答腊省', '廖内省', '廖内群岛省', '占碑省', '南苏门答腊省',
    '邦加勿里洞省', '明古鲁省', '楠榜省', '北苏拉威西省', '中苏拉威西省',
    '南苏拉威西省', '东南苏拉威西省', '哥伦打洛省', '西苏拉威西省', '马鲁古省',
    '北马鲁古省', '巴布亚省', '西巴布亚省', '亚齐省'
  ]
}

// 地区列表 - 根据当前级别显示不同内容
const regions = computed(() => {
  if (currentLevel.value === 0) {
    // 第一级：显示国家和地区
    return [
      // 中国
      '中国大陆',
      '中国香港',
      '中国澳门',
      '中国台湾',

      // 亚洲其他国家
      '日本',
      '韩国',
      '新加坡',
      '马来西亚',
      '泰国',
      '越南',
      '印度尼西亚',
      '菲律宾',
      '印度',

      // 欧洲
      '英国',
      '法国',
      '德国',
      '意大利',
      '西班牙',
      '荷兰',
      '比利时',
      '瑞士',
      '奥地利',
      '瑞典',
      '挪威',
      '丹麦',
      '芬兰',
      '俄罗斯',

      // 北美洲
      '美国',
      '加拿大',
      '墨西哥',

      // 南美洲
      '巴西',
      '阿根廷',
      '智利',

      // 非洲
      '南非',
      '埃及',

      // 大洋洲
      '澳大利亚',
      '新西兰'
    ]
  } else if (currentLevel.value === 1 && selectedCountry.value === '中国大陆') {
    // 第二级：显示中国省份
    return chinaProvinces
  } else if (currentLevel.value === 2 && selectedProvince.value) {
    // 第三级：显示直辖市的区县
    return municipalityDistricts[selectedProvince.value as keyof typeof municipalityDistricts] || []
  }

  return []
})

// 页面标题 - 显示当前选择的地区名称
const getPageTitle = () => {
  if (currentLevel.value === 0) {
    return '国家或地区'
  } else if (currentLevel.value === 1) {
    // 第二级：显示选择的国家名称
    return selectedCountry.value || '选择省份'
  } else if (currentLevel.value === 2) {
    // 第三级：显示选择的省份名称
    return selectedProvince.value || '选择城市'
  }
  return '地区选择'
}

// 返回方法
const goBack = () => {
  if (currentLevel.value === 2) {
    // 第三级返回逻辑
    if (selectedCountry.value === '中国大陆') {
      // 中国大陆有省份级别，返回到省份选择
      currentLevel.value = 1
      breadcrumb.value = [selectedCountry.value]
      selectedProvince.value = ''
      selectedRegion.value = ''
    } else {
      // 其他国家（日本、韩国、美国等）没有省份级别，直接返回到国家选择
      currentLevel.value = 0
      breadcrumb.value = []
      selectedCountry.value = ''
      selectedProvince.value = ''
      selectedRegion.value = ''
    }
  } else if (currentLevel.value === 1) {
    // 第二级（省份选择）返回到第一级（国家选择）
    currentLevel.value = 0
    breadcrumb.value = []
    selectedCountry.value = ''
    selectedProvince.value = ''
    selectedRegion.value = ''
  } else {
    // 第一级（国家选择）返回到上一页面
    router.back()
  }
}

const loadCurrentRegion = () => {
  const user = authStore.user
  if (user && (user as any).region) {
    currentRegion.value = (user as any).region
    selectedRegion.value = (user as any).region
  }
}

const selectRegion = (region: string) => {
  if (currentLevel.value === 0) {
    // 第一级选择
    const chinaRegions = ['中国大陆', '中国香港', '中国澳门', '中国台湾']
    const countriesWithStates = ['日本', '韩国', '美国', '新加坡', '马来西亚', '越南', '印度尼西亚']

    if (chinaRegions.includes(region)) {
      if (region === '中国大陆') {
        // 点击中国大陆，进入省份选择
        selectedCountry.value = region
        currentLevel.value = 1
        breadcrumb.value = [region]
        selectedRegion.value = '' // 清空选择
      } else {
        // 点击香港、澳门、台湾，直接进入区域选择
        selectedCountry.value = region
        selectedProvince.value = region
        currentLevel.value = 2
        breadcrumb.value = [region]
        selectedRegion.value = '' // 清空选择
      }
    } else if (countriesWithStates.includes(region)) {
      // 点击有下级区域的国家，进入州/省/区选择
      selectedCountry.value = region
      selectedProvince.value = region
      currentLevel.value = 2
      breadcrumb.value = [region]
      selectedRegion.value = '' // 清空选择
    } else {
      // 选择其他国家，直接确定
      selectedRegion.value = region
    }
  } else if (currentLevel.value === 1) {
    // 第二级选择（省份）
    const municipalities = ['北京市', '上海市', '天津市', '重庆市']
    const autonomousRegions = ['内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区']
    // 自动获取所有有下级城市的省份
    const provincesWithCities = Object.keys(municipalityDistricts).filter(key =>
      key.endsWith('省') && municipalityDistricts[key as keyof typeof municipalityDistricts]?.length > 0
    )

    if (municipalities.includes(region) || autonomousRegions.includes(region) || provincesWithCities.includes(region)) {
      // 点击直辖市、自治区或有下级城市的省份，进入下级选择
      selectedProvince.value = region
      currentLevel.value = 2
      breadcrumb.value = [selectedCountry.value, region]
      selectedRegion.value = '' // 清空选择
    } else {
      // 选择其他省份，直接确定
      selectedProvince.value = region
      selectedRegion.value = `${selectedCountry.value} ${region}`
    }
  } else if (currentLevel.value === 2) {
    // 第三级选择（区县/州/省）
    if (selectedCountry.value === '中国大陆') {
      selectedRegion.value = `${selectedCountry.value} ${selectedProvince.value} ${region}`
    } else if (['中国香港', '中国澳门', '中国台湾', '日本', '韩国', '美国', '新加坡', '马来西亚', '越南', '印度尼西亚'].includes(selectedCountry.value)) {
      // 香港、澳门、台湾、日本、韩国、美国、新加坡、马来西亚、越南、印尼
      selectedRegion.value = `${selectedCountry.value} ${region}`
    } else {
      selectedRegion.value = `${selectedCountry.value} ${region}`
    }
  }
}

// 判断地区是否被选中
const isRegionSelected = (region: string) => {
  if (currentLevel.value === 0) {
    // 第一级：直接比较
    return region === selectedRegion.value
  } else if (currentLevel.value === 1) {
    // 第二级：比较省份部分
    if (selectedCountry.value === '中国大陆') {
      return selectedRegion.value === `${selectedCountry.value} ${region}`
    } else {
      return selectedRegion.value === `${selectedCountry.value} ${region}`
    }
  } else if (currentLevel.value === 2) {
    // 第三级：比较完整路径
    if (selectedCountry.value === '中国大陆') {
      return selectedRegion.value === `${selectedCountry.value} ${selectedProvince.value} ${region}`
    } else {
      return selectedRegion.value === `${selectedCountry.value} ${region}`
    }
  }
  return false
}

// 判断是否显示右向箭头
const shouldShowArrow = (region: string) => {
  if (currentLevel.value === 0) {
    // 第一级：中国相关地区和有下级区域的国家都显示箭头
    const chinaRegions = ['中国大陆', '中国香港', '中国澳门', '中国台湾']
    const countriesWithStates = ['日本', '韩国', '美国', '新加坡', '马来西亚', '越南', '印度尼西亚']
    return chinaRegions.includes(region) || countriesWithStates.includes(region)
  } else if (currentLevel.value === 1) {
    // 第二级：直辖市、自治区和有下级城市的省份显示箭头
    const municipalities = ['北京市', '上海市', '天津市', '重庆市']
    const autonomousRegions = ['内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区']
    // 自动获取所有有下级城市的省份
    const provincesWithCities = Object.keys(municipalityDistricts).filter(key =>
      key.endsWith('省') && municipalityDistricts[key as keyof typeof municipalityDistricts]?.length > 0
    )
    return municipalities.includes(region) || autonomousRegions.includes(region) || provincesWithCities.includes(region)
  }
  // 其他级别不显示箭头
  return false
}

// 删除了未使用的按钮点击处理方法

// 处理自动定位框点击
const handleAutoLocationClick = async () => {
  if (autoLocationText.value && autoLocationText.value !== '正在定位...' && autoLocationText.value !== '定位失败，请手动选择') {
    // 如果已经有定位结果，直接选择
    selectedRegion.value = autoLocationText.value
  } else {
    // 否则重新定位
    await autoLocate()
  }
}

// 自动定位功能
const autoLocate = async () => {
  if (isLocating.value) return

  try {
    isLocating.value = true
    autoLocationText.value = '正在定位...'

    // 获取用户位置
    const position = await getCurrentPosition()

    // 使用逆地理编码获取详细地址
    const locationInfo = await reverseGeocode(position.coords.latitude, position.coords.longitude)

    if (locationInfo) {
      autoLocationText.value = locationInfo
      // 不自动选择，等用户点击
    } else {
      autoLocationText.value = '定位失败，请手动选择'
    }
  } catch (error) {
    console.error('定位失败:', error)
    autoLocationText.value = '定位失败，请手动选择'
  } finally {
    isLocating.value = false
  }
}

// 获取用户当前位置
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  })
}

// 逆地理编码
const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    // 备用方案：使用免费的地理编码服务
    const backupResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`)
    const backupData = await backupResponse.json()

    if (backupData) {
      // 格式化显示：国家/地区 省/市
      let locationText = ''

      // 获取国家或地区
      if (backupData.countryCode === 'CN') {
        locationText = '中国大陆'
      } else if (backupData.countryCode === 'HK') {
        locationText = '中国香港'
      } else if (backupData.countryCode === 'MO') {
        locationText = '中国澳门'
      } else if (backupData.countryCode === 'TW') {
        locationText = '中国台湾'
      } else {
        locationText = backupData.countryName || '未知地区'
      }

      // 添加省市信息
      if (backupData.principalSubdivision || backupData.city || backupData.locality) {
        const region = backupData.principalSubdivision || backupData.city || backupData.locality
        locationText += ` ${region}`
      }

      return locationText
    }

    // 使用高德地图API进行逆地理编码（备用）
    try {
      const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?key=YOUR_AMAP_KEY&location=${longitude},${latitude}&poitype=&radius=1000&extensions=base&batch=false&roadlevel=0`)
      const data = await response.json()

      if (data.status === '1' && data.regeocode) {
        const addressComponent = data.regeocode.addressComponent
        // 返回国家和省市信息
        return `中国大陆 ${addressComponent.province} ${addressComponent.city}`
      }
    } catch (amapError) {
      console.log('高德地图API调用失败:', amapError)
    }

    return null
  } catch (error) {
    console.error('逆地理编码失败:', error)
    return null
  }
}

const confirmSelection = async () => {
  if (!selectedRegion.value) return

  try {
    isSaving.value = true

    // 调用API更新地区
    const response = await userAPI.updateProfile({
      region: selectedRegion.value
    })

    if (response.success) {
      // 更新本地存储
      await authStore.fetchUserInfo()

      // 触发用户信息更新事件
      window.dispatchEvent(new CustomEvent('userInfoUpdated', {
        detail: {
          type: 'region',
          newValue: selectedRegion.value,
          user: authStore.user
        }
      }))

      // 显示成功提示
      appStore.showToast('地区修改成功', 'success')

      // 返回个人信息页面
      router.push('/settings/personal-info')
    } else {
      appStore.showToast('修改失败：' + (response.error || '未知错误'), 'error')
    }
  } catch (error: any) {
    console.error('修改地区失败:', error)
    appStore.showToast('修改失败：' + error.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// 顶部按钮：有选择时显示“确定”
const topBarButtons = computed(() => selectedRegion.value ? [
  { icon: 'heroicons:check', action: 'confirm' }
] : [])

const handleTopBarAction = (button: { icon: string; action: string }) => {
  if (button?.action === 'confirm') confirmSelection()
}

// 生命周期
onMounted(() => {
  loadCurrentRegion()

  // 自动开始定位
  autoLocate()
})
</script>

<style scoped>
.region-selector {
  background: #f5f5f5;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 内容区域 - 简单的滚动容器 */
.content-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 不需要任何特殊定位，导航栏在正常文档流中 */
}

/* 当前位置文本 - 简单的第一项 */
.current-location {
  background: #e5e5e5;
  height: 25px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #d0d0d0;
  margin-top: 2px; /* 与内容区域顶部的小间距 */
}

.current-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 自动定位容器 */
.auto-location-container {
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.auto-location-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auto-location-item:hover {
  background: #f8f8f8;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-icon {
  color: #07c160;
  flex-shrink: 0;
}

.location-text {
  flex: 1;
}

.location-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.loading-icon {
  color: #999;
}

/* 选择地区文本 */
.select-region-text {
  background: #e5e5e5;
  height: 25px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.select-region-text span {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 当前地区 */
.current-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 地区选择容器 */
.regions-container {
  background: white;
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  padding-bottom: 80px;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 16px;
  margin: 0;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;
  transition: background-color 0.2s;
  background: white;
}

.region-item:last-child {
  border-bottom: none;
}

.region-item:hover {
  background: #f8f8f8;
}

.region-item.current {
  background: rgba(7,193,96,0.1);
}

.region-item.selected {
  background: rgba(7,193,96,0.1);
}

.region-name {
  font-size: 13px;
  color: #333;
  flex: 1;
}

.region-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-icon {
  color: #07c160;
  flex-shrink: 0;
}

.arrow-icon {
  color: #c8c8c8;
  flex-shrink: 0;
}



/* 操作区域 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  z-index: 200;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.save-btn:hover {
  background: #06a552;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

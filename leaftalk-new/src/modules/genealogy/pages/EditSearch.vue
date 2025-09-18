<template>
  <div class="edit-search-page">
    <MobileTopBar 
      title="编辑寻亲信息"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="edit-search-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else class="form-container">
        <form @submit.prevent="saveSearch">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3>基本信息</h3>
            <div class="form-group">
              <label>寻找对象姓名 *</label>
              <input 
                v-model="searchForm.targetName" 
                type="text" 
                placeholder="请输入要寻找的人的姓名"
                required
              />
            </div>
            
            <div class="form-group">
              <label>关系 *</label>
              <select v-model="searchForm.relationship" required>
                <option value="">请选择关系</option>
                <option value="父亲">父亲</option>
                <option value="母亲">母亲</option>
                <option value="兄弟">兄弟</option>
                <option value="姐妹">姐妹</option>
                <option value="子女">子女</option>
                <option value="其他亲属">其他亲属</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" v-model="searchForm.gender" value="男" />
                  <span>男</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="searchForm.gender" value="女" />
                  <span>女</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="form-section">
            <h3>时间信息</h3>
            <div class="form-group">
              <label>出生年份</label>
              <input 
                v-model="searchForm.birthYear" 
                type="number" 
                placeholder="如：1980"
                min="1900"
                max="2024"
              />
            </div>
            
            <div class="form-group">
              <label>失联时间</label>
              <input 
                v-model="searchForm.lostDate" 
                type="date"
              />
            </div>
          </div>

          <!-- 地址信息 -->
          <div class="form-section">
            <h3>地址信息</h3>
            <div class="form-group">
              <label>最后已知地址</label>
              <div class="address-selector">
                <select v-model="searchForm.province" @change="onProvinceChange">
                  <option value="">请选择省份</option>
                  <option v-for="province in provinces" :key="province" :value="province">
                    {{ province }}
                  </option>
                </select>
                <select v-model="searchForm.city" @change="onCityChange">
                  <option value="">请选择城市</option>
                  <option v-for="city in cities" :key="city" :value="city">
                    {{ city }}
                  </option>
                </select>
                <select v-model="searchForm.district">
                  <option value="">请选择区县</option>
                  <option v-for="district in districts" :key="district" :value="district">
                    {{ district }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>详细地址</label>
              <textarea 
                v-model="searchForm.detailAddress" 
                placeholder="请输入详细地址信息"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- 其他信息 -->
          <div class="form-section">
            <h3>其他信息</h3>
            <div class="form-group">
              <label>身份证号</label>
              <input 
                v-model="searchForm.idCard" 
                type="text" 
                placeholder="如有身份证号请填写"
                maxlength="18"
              />
            </div>
            
            <div class="form-group">
              <label>联系电话</label>
              <input 
                v-model="searchForm.phone" 
                type="tel" 
                placeholder="如有联系电话请填写"
              />
            </div>
            
            <div class="form-group">
              <label>其他特征</label>
              <textarea 
                v-model="searchForm.description" 
                placeholder="请描述其他有助于寻找的特征信息"
                rows="4"
              ></textarea>
            </div>
          </div>

          <!-- 联系方式 -->
          <div class="form-section">
            <h3>您的联系方式</h3>
            <div class="form-group">
              <label>联系人姓名 *</label>
              <input 
                v-model="searchForm.contactName" 
                type="text" 
                placeholder="请输入您的姓名"
                required
              />
            </div>
            
            <div class="form-group">
              <label>联系电话 *</label>
              <input 
                v-model="searchForm.contactPhone" 
                type="tel" 
                placeholder="请输入您的联系电话"
                required
              />
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button type="button" @click="goBack" class="cancel-btn">取消</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const searchForm = ref({
  targetName: '',
  relationship: '',
  gender: '',
  birthYear: '',
  lostDate: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  idCard: '',
  phone: '',
  description: '',
  contactName: '',
  contactPhone: ''
})

// 地址数据
const provinces = ref(['北京市', '上海市', '广东省', '浙江省', '江苏省', '湖南省', '湖北省', '四川省', '山东省', '河南省'])
const cities = ref([])
const districts = ref([])

// 生命周期
onMounted(() => {
  loadSearchData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadSearchData = async () => {
  loading.value = true
  try {
    // 模拟加载现有数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟填充表单数据
    searchForm.value = {
      targetName: '张三',
      relationship: '兄弟',
      gender: '男',
      birthYear: '1985',
      lostDate: '2020-01-01',
      province: '湖南省',
      city: '长沙市',
      district: '岳麓区',
      detailAddress: '某某街道某某小区',
      idCard: '',
      phone: '13800138000',
      description: '身高约170cm，有胎记',
      contactName: '李四',
      contactPhone: '13900139000'
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const onProvinceChange = () => {
  // 模拟城市数据
  const cityMap = {
    '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市'],
    '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市'],
    '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市']
  }
  cities.value = cityMap[searchForm.value.province] || []
  searchForm.value.city = ''
  searchForm.value.district = ''
}

const onCityChange = () => {
  // 模拟区县数据
  const districtMap = {
    '长沙市': ['岳麓区', '芙蓉区', '天心区', '开福区', '雨花区'],
    '广州市': ['天河区', '海珠区', '荔湾区', '越秀区', '白云区'],
    '杭州市': ['西湖区', '拱墅区', '江干区', '下城区', '上城区']
  }
  districts.value = districtMap[searchForm.value.city] || []
  searchForm.value.district = ''
}

const saveSearch = async () => {
  saving.value = true
  try {
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    appStore.showToast('寻亲信息保存成功', 'success')
    router.back()
  } catch (error) {
    console.error('保存失败:', error)
    appStore.showToast('保存失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.edit-search-page {
  height: 100vh;
  background: #f5f5f5;
}

.edit-search-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07C160;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  width: auto;
  margin: 0;
}

.address-selector {
  display: flex;
  gap: 8px;
}

.address-selector select {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.save-btn {
  background: #07C160;
  color: white;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

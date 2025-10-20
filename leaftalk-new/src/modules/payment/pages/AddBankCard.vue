<template>
  <div class="add-bank-card-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar title="添加银行卡" show-back />

    <!-- 表单内容 -->
    <div class="form-content">
      <div class="input-group">
        <input
          v-model="cardNumber"
          type="text"
          placeholder="请输入银行卡号"
          class="card-input"
          maxlength="19"
          @input="formatCardNumber"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'

const cardNumber = ref('')

// 格式化银行卡号（每4位加空格）
const formatCardNumber = (e: Event) => {
  const input = e.target as HTMLInputElement
  let value = input.value.replace(/\s/g, '')
  value = value.replace(/\D/g, '')
  
  const formatted = value.match(/.{1,4}/g)?.join(' ') || value
  cardNumber.value = formatted
}
</script>

<style scoped lang="scss">
.add-bank-card-page {
  min-height: 100vh;
  background: #EDEDED;
}

.form-content {
  padding: 20px;
}

.input-group {
  margin-bottom: 16px;
}

.card-input {
  width: 100%;
  height: 50px;
  padding: 0 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  outline: none;
  transition: all 0.2s;
}

.card-input:focus {
  border-color: #07C160;
}

.card-input::placeholder {
  color: #ccc;
}
</style>


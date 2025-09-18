<template>
  <div class="family-tree-page">
    <MobileTopBar 
      title="家族树" 
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content scroll-container">
      <div class="tree-container">
        <h2>家族树</h2>
        <p>家族树功能正在开发中...</p>
        
        <!-- 简单的家族成员展示 -->
        <div class="members-section">
          <h3>第三世</h3>
          <div class="members-grid">
            <div class="member-card">
              <img src="/default-avatar.png" alt="张伟" class="member-avatar">
              <h4>张伟</h4>
              <p>家族族长</p>
              <span>1980年生</span>
            </div>
            <div class="member-card">
              <img src="/default-avatar.png" alt="张强" class="member-avatar">
              <h4>张强</h4>
              <p>家族成员</p>
              <span>1975年生</span>
            </div>
          </div>
        </div>
        
        <div class="members-section">
          <h3>第二世（父辈）</h3>
          <div class="members-grid">
            <div class="member-card deceased">
              <img src="/default-avatar.png" alt="张建国" class="member-avatar">
              <h4>张建国</h4>
              <p>家族长老</p>
              <span>1950-2020</span>
            </div>
          </div>
        </div>
        
        <div class="members-section">
          <h3>第四世（子辈）</h3>
          <div class="members-grid">
            <div class="member-card">
              <img src="/default-avatar.png" alt="张小明" class="member-avatar">
              <h4>张小明</h4>
              <p>家族后辈</p>
              <span>2005年生</span>
            </div>
            <div class="member-card">
              <img src="/default-avatar.png" alt="张小红" class="member-avatar">
              <h4>张小红</h4>
              <p>家族后辈</p>
              <span>2008年生</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.family-tree-page {
  height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.tree-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.tree-container h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.tree-container p {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.members-section {
  margin-bottom: 30px;
}

.members-section h3 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
}

.members-grid {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.member-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  min-width: 120px;
  transition: all 0.3s ease;
}

.member-card:hover {
  border-color: #07C160;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.member-card.deceased {
  border-color: #999;
  background: #f5f5f5;
}

.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.member-card h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.member-card p {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.member-card span {
  font-size: 10px;
  color: #999;
}
</style>

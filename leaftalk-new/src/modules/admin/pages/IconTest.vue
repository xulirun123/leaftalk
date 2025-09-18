<template>
  <div class="icon-test">
    <h1>图标测试页面</h1>

    <div class="debug-section">
      <h2 style="color: red;">调试测试</h2>
      <div style="border: 3px solid red; padding: 20px; background: yellow;">
        <p>这个黄色区域应该可见</p>
        <div style="width: 50px; height: 50px; background: blue; display: inline-block;"></div>
        <span>蓝色方块应该可见</span>
      </div>
    </div>
    
    <div class="icon-section">
      <h2>底部导航栏图标</h2>
      <div class="icon-grid">
        <div class="icon-item">
          <iconify-icon icon="lucide:message-circle" width="32" />
          <span>lucide:message-circle</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="lucide:users" width="32" />
          <span>lucide:users</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="lucide:compass" width="32" />
          <span>lucide:compass</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="lucide:git-branch" width="32" />
          <span>lucide:git-branch</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="lucide:user" width="32" />
          <span>lucide:user</span>
        </div>
      </div>
    </div>

    <div class="icon-section">
      <h2>Heroicons 图标</h2>
      <div class="icon-grid">
        <div class="icon-item">
          <iconify-icon icon="heroicons:home" width="32" />
          <span>heroicons:home</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="heroicons:plus" width="32" />
          <span>heroicons:plus</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="heroicons:user" width="32" />
          <span>heroicons:user</span>
        </div>
        <div class="icon-item">
          <iconify-icon icon="heroicons:heart" width="32" />
          <span>heroicons:heart</span>
        </div>
      </div>
    </div>

    <div class="icon-section">
      <h2>LocalIcon 直接测试</h2>
      <div class="icon-grid">
        <div class="icon-item">
          <LocalIcon name="heroicons:home" size="32" />
          <span>LocalIcon heroicons:home</span>
        </div>
        <div class="icon-item">
          <LocalIcon name="lucide:users" size="32" />
          <span>LocalIcon lucide:users</span>
        </div>
      </div>
    </div>

    <div class="icon-section">
      <h2>SimpleIcon 测试</h2>
      <div class="icon-grid">
        <div class="icon-item">
          <SimpleIcon name="home" size="32" />
          <span>SimpleIcon home</span>
        </div>
        <div class="icon-item">
          <SimpleIcon name="user" size="32" />
          <span>SimpleIcon user</span>
        </div>
        <div class="icon-item">
          <SimpleIcon name="unknown" size="32" />
          <span>SimpleIcon unknown</span>
        </div>
      </div>
    </div>

    <div class="icon-section">
      <h2>原生SVG测试</h2>
      <div class="icon-grid">
        <div class="icon-item">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <span>原生SVG Home</span>
        </div>
        <div class="icon-item">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>原生SVG Users</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LocalIcon from '../components/icons/LocalIcon.vue'
import SimpleIcon from '../components/icons/SimpleIcon.vue'
</script>

<style scoped>
.icon-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.icon-section {
  margin-bottom: 40px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
}

.icon-item span {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

h1, h2 {
  color: #333;
}
</style>

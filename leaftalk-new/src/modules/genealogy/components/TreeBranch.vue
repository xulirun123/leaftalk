<template>
  <div class="tree-branch" :class="{ 'has-children': branch.children.length > 0 }">
    <!-- 分支节点 -->
    <div class="branch-node">
      <MemberCard 
        :member="branch.member" 
        :layout="layout"
        :customization="customization"
        @member-click="$emit('member-click', branch.member)"
      />
    </div>
    
    <!-- 连接线 -->
    <div v-if="branch.children.length > 0" class="branch-connector">
      <div class="vertical-line"></div>
      <div class="horizontal-line"></div>
    </div>
    
    <!-- 子分支 -->
    <div v-if="branch.children.length > 0" class="child-branches">
      <TreeBranch 
        v-for="childBranch in branch.children" 
        :key="childBranch.id"
        :branch="childBranch"
        :layout="layout"
        :customization="customization"
        @member-click="$emit('member-click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MemberCard from './MemberCard.vue'

// Props
const props = defineProps({
  branch: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'tree'
  },
  customization: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['member-click'])
</script>

<style scoped>
.tree-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.branch-node {
  z-index: 2;
}

.branch-connector {
  position: relative;
  width: 2px;
  height: 40px;
  margin: 8px 0;
}

.vertical-line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: #666;
}

.horizontal-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: #666;
}

.child-branches {
  display: flex;
  gap: 40px;
  position: relative;
}

.child-branches::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #666;
}

.child-branches .tree-branch::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: #666;
}
</style>

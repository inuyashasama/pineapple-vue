<!-- src/layout/DefaultLayout.vue -->
<template>
  <div class="default-layout">
    <!-- 顶部栏 -->
    <AppBar @toggle-sidebar="toggleSidebar" :collapsed="collapsed" />

    <div class="main-container">
      <!-- 左侧栏 -->
      <SideBar class="sidebar" :collapsed="collapsed" />

      <!-- 内容区域 -->
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppBar from '@/components/AppBar.vue';
import SideBar from '@/components/SideBar.vue';

// 控制侧边栏是否折叠
const collapsed = ref(false);

// 切换折叠状态
const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style scoped>
.default-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  flex-shrink: 0;
  transition: width 0.3s ease;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f5f5;
}
</style>
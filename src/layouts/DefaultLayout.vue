<template>
  <div class="default-layout">
    <!-- 顶部栏 -->
    <AppBar @toggle-sidebar="toggleSidebar" :collapsed="collapsed" />

    <div class="main-container">
      <!-- 左侧栏 -->
      <SideBar class="sidebar" :collapsed="collapsed" />

      <!-- 内容区域 -->
      <div class="content" :class="{ collapsed }">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppBar from '@/components/AppBar.vue'
import SideBar from '@/components/SideBar.vue'

const collapsed = ref(false)

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
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
  margin-top: 60px; /* 顶部栏高度 */
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
  transition: margin-left 0.3s ease;
}

.content.collapsed {
  margin-left: -136px; /* = 原始宽度200 - 折叠宽度64 */
}
</style>

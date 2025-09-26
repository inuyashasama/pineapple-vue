<!-- src/components/SideBar.vue -->
<template>
  <div class="sidebar-container" :class="{ 'collapsed': collapsed }">
    <!-- logo -->
    <div class="logo">
      <span>{{ collapsed ? 'P' : 'Pine Admin' }}</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="$route.path"
      class="menu"
      :collapse="collapsed"
      :collapse-transition="false"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      router
    >
      <el-menu-item index="/home">
        <el-icon><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>

      <el-menu-item index="/articles">
        <el-icon><Document /></el-icon>
        <template #title>文章管理</template>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed: boolean
}>();

// 图标（Element Plus）
import { House, Document, Setting } from '@element-plus/icons-vue';
</script>

<style scoped>
.sidebar-container {
  width: 200px;
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
  transition: width 0.3s ease;
}

.sidebar-container.collapsed {
  width: 64px;
}

.logo {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 16px;
  background-color: #2b3a4c;
}

.menu {
  border: none;
}
</style>
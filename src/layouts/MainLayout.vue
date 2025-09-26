<template>
  <div class="layout-container">
    <Sidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />
    <div class="main-content">
      <Header @toggleSidebar="collapsed = !collapsed" />
      <div class="page-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";

const collapsed = ref(false);
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
}
.page-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>

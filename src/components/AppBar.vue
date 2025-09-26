<template>
  <header class="app-bar">
    <!-- 折叠按钮 -->
    <div
      class="toggle-btn"
      :class="{ active: collapsed }"
      @click="handleToggle"
    >
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </div>

    <!-- 标题 -->
    <div class="title">Pine Admin</div>

    <!-- 右侧占位 -->
    <div class="spacer"></div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const handleToggle = () => {
  emit('toggle-sidebar')
}
</script>

<style scoped>
.app-bar {
  height: 60px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.toggle-btn {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  width: 24px;
  height: 24px;
  justify-content: center;
  transition: transform 0.3s;
}

.toggle-btn.active {
  transform: rotate(90deg);
}

.bar {
  width: 100%;
  height: 3px;
  background-color: white;
  margin: 2px 0;
  transition: 0.3s;
}

.title {
  margin-left: 15px;
  font-size: 18px;
  font-weight: bold;
}

.spacer {
  flex: 1;
}
</style>

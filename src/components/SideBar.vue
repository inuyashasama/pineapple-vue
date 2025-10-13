<template>
  <div :class="['sidebar', { collapsed }]">
    <div class="logo">
      <span v-if="!collapsed">🍍 Pineapple</span>
      <span v-else>🍍</span>
    </div>
    <ul class="menu">
      <li
        v-for="item in menu"
        :key="item.path"
        :class="{ active: $route.path === item.path }"
        @click="go(item.path)"
      >
        <i :class="item.icon"></i>
        <span v-if="!collapsed">{{ item.title }}</span>
      </li>
    </ul>
    <div class="collapse-btn" @click="$emit('toggle')">
      <i :class="collapsed ? 'icon-expand' : 'icon-collapse'"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";

defineProps<{ collapsed: boolean }>();

const router = useRouter();
const menu = computed(() => [
  { path: "/", title: "首页", icon: "icon-home" },
  { path: "/documents", title: "文章创作", icon: "icon-edit" },
  { path: "/outFitDesigner", title: "搭配设计", icon: "icon-edit" },
]);

const go = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.sidebar {
  background: #001529;
  color: #fff;
  width: 200px;
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
}
.sidebar.collapsed {
  width: 64px;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.menu {
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 8px 0;
}
.menu li {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.menu li:hover {
  background: rgba(255, 255, 255, 0.15);
}
.menu li.active {
  background: rgba(255, 255, 255, 0.25);
}
.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}
</style>

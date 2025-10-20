<template>
  <div class="header">
    <div class="left">
      <button class="menu-btn" @click="$emit('toggleSidebar')">☰</button>
      <h1 class="title">Pineapple 系统</h1>
    </div>
    <div class="right">
      <span class="user">👤 Admin</span>
      <button class="profile-center" @click="goToProfile">个人中心</button>
      <button class="logout" @click="logout">退出</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const logout = () => {
  localStorage.removeItem("token");
  router.push("/auth/login");
};

// 添加个人中心导航方法
const goToProfile = () => {
  router.push("/profile");
};
</script>

<style scoped>
.header {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #eaeaea;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user {
  font-size: 14px;
}
.profile-center {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}

.profile-center:hover {
  background: #f0f0f0;
}

.logout {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}

.logout:hover {
  background: #f0f0f0;
}
</style>

// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

const Login = () => import("@/views/Login.vue");
const Register = () => import("@/views/Register.vue");
const Home = () => import("@/views/Home.vue");

const routes = [
  {
    path: "/",
    component: Login,
    meta: { requiresAuth: false } // 公开页面
  },
  {
    path: "/login",
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: "/register",
    component: Register,
    meta: { requiresAuth: false }
  },
    {
    path: "/index",
    component: Home,
    meta: { requiresAuth: false } // 公开页面
  },
  {
    path: "/home",
    component: Home,
    meta: { requiresAuth: false } // 公开页面
  },
  // 后续可以加需要登录的页面
  // {
  //   path: "/write",
  //   component: () => import("@/views/Write.vue"),
  //   meta: { requiresAuth: true }
  // }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // 1. 如果访问的是登录页
  if (to.path === '/login') {
    if (token) {
      next('/'); // 已登录，跳首页
    } else {
      next(); // 未登录，允许访问登录页
    }
  }

  // 2. 如果访问的是需要登录的页面（如 /index、/article）
  else if (to.path !== '/register' && to.path !== '/') { // 假设 / 和 /register 允许匿名访问
    if (token) {
      next();
    } else {
      next('/login'); // 未登录，跳登录页
    }
  }

  // 3. 其他情况（如 /register）直接放行
  else {
    next();
  }
});

export default router;
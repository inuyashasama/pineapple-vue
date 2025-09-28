import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "documents",
        name: "Documents",
        component: () => import("@/views/DocumentEditor.vue"),
      },
    ],
  },
  {
    path: "/auth",
    component: BlankLayout,
    children: [
      {
        path: "login",
        name: "Login",
        component: () => import("@/views/Login.vue"),
      },
      {
        path: "register",
        name: "Register",
        component: () => import("@/views/Register.vue"),
      },
    ],
  },
  
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  // 如果路由需要认证（MainLayout 内的页面）
  if (to.matched.some(record => record.component === MainLayout)) {
    if (token) {
      next();
    } else {
      next("/auth/login");
    }
  } else {
    if ((to.path === "/auth/login" || to.path === "/auth/register") && token) {
      next("/");
    } else {
      next();
    }
  }
});


export default router;

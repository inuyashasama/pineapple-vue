<template>
  <div class="auth-container">
    <el-card class="auth-form" shadow="hover">
      <template #header>
        <h2>登录</h2>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit" :loading="loading">
            登录
          </el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>

        <div class="link">
          没有账号？
          <router-link to="/register">去注册</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance } from 'element-plus'
import { login } from '@/api/auth'

interface LoginParams {
  username: string
  password: string
}

// 路由实例
const router = useRouter()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const form = ref<LoginParams>({
  username: '',
  password: ''
})

// 加载状态
const loading = ref(false)

// 验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

// 提交
const onSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await login(form.value.username, form.value.password) as any
      // res 就是后端返回的 data（即 { token: "xxx" }）
      const token = res.token

      localStorage.setItem('token', token)
      ElMessage.success('登录成功！')

      await router.push('/index')
    } catch (err) {
      // 错误已在拦截器中处理
    } finally {
      loading.value = false
    }
  })
}

// 重置
const onReset = () => {
  formRef.value?.resetFields()
}

// 页面挂载后设置标题
onMounted(() => {
  document.title = '登录 - Vue3 Admin'
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-form {
  width: 400px;
  padding: 20px;
}

.link {
  text-align: center;
  color: #606266;
}

.link a {
  color: #409eff;
  text-decoration: none;
}
</style>
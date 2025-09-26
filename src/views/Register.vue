<!-- src/views/Register.vue -->
<template>
  <div class="auth-container">
    <el-card class="auth-form" shadow="hover">
      <template #header>
        <h2>注册</h2>
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

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit" :loading="loading">
            注册
          </el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>

        <div class="link">
          已有账号？
          <router-link to="/auth/login">去登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance } from 'element-plus'
import { RegisterParams } from '@/types'
import { register } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()

const form = ref<RegisterParams>({
  username: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

// 自定义验证密码是否一致
const validatePass2 = (rule: any, value: string, callback: any) => {
  if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const onSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await register(form.value)
      const token = res.data?.token || 'fake-jwt-token'
      localStorage.setItem('token', token)
      ElMessage.success('注册成功！')

      // 注册成功后跳转到登录页
      await router.push('/auth/login')
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

const onReset = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  document.title = '注册 - Vue3 Admin'
})
</script>

<style scoped>
/* 和 Login.vue 一样的样式 */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
<template>
  <div class="auth-container">
    <el-card class="auth-form" shadow="always">
      <div class="form-header">
        <h2>欢迎登录</h2>
        <p>pineapple 管理系统</p>
      </div>
      
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item class="button-group">
        <div class="button-wrapper">
          <el-button 
            type="primary" 
            @click="onSubmit" 
            :loading="loading"
            size="large"
            class="submit-btn"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
          <el-button @click="onReset" size="large" class="reset-btn">
            重置
          </el-button>
        </div>
      </el-form-item>

        <div class="link">
          没有账号？
          <router-link to="/auth/register">去注册</router-link>
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
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

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

      LocalStorageUtil.setWithExpire('token', token, 3 * 60 * 60 * 1000) // 2 小时过期
      ElMessage.success('登录成功！')
      LocalStorageUtil.setWithExpire('username', form.value.username, 3 * 60 * 60 * 1000)
      LocalStorageUtil.setWithExpire('userId', res.id, 3 * 60 * 60 * 1000)
      document.title = 'pineapple'
      await router.push('/')
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
  document.title = '登录 - pineapple'
  // 读取临时存储的数据
  const tempCredentials = LocalStorageUtil.get('tempCredentials')
  if (tempCredentials) {
    const { username,password } = JSON.parse(tempCredentials)
    form.value.username = username
    form.value.password = password
    
    // 清除临时数据
    LocalStorageUtil.remove('tempCredentials')
  }
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url(../assets/bg.jpg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 20px;
}

.auth-form {
  width: 100%;
  max-width: 420px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-header p {
  color: #909399;
  font-size: 14px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.login-form :deep(.el-input__inner) {
  border-radius: 8px;
  padding: 12px 15px;
  font-size: 14px;
  transition: all 0.3s;
}

.login-form :deep(.el-input__inner:hover) {
  border-color: #409eff;
}

.login-form :deep(.el-input__inner:focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.button-group {
  margin-top: 30px !important;
  margin-bottom: 20px !important;
}

.button-wrapper {
  display: flex;
  gap: 15px;
  width: 100%;
}

.submit-btn {
  flex: 1;
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: 1px;
}

.reset-btn {
  flex: 1;
  border-radius: 8px;
}

.link {
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.link a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-form {
    padding: 20px;
    margin: 10px;
  }
  
  .form-header h2 {
    font-size: 22px;
  }
}
</style>
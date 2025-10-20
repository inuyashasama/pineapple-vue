<!-- src/views/ProfileCenter.vue -->
<template>
  <div class="profile-center">
    <div class="profile-header">
      <div class="avatar">👤</div>
      <h2 class="username">Admin</h2>
      <p class="user-role">系统管理员</p>
    </div>
    
    <div class="profile-content">
      <div class="profile-info">
        <div class="info-item">
          <span class="label">用户名:</span>
          <span class="value">admin</span>
        </div>
        <div class="info-item">
          <span class="label">邮箱:</span>
          <span class="value">admin@pineapple.com</span>
        </div>
        <div class="info-item">
          <span class="label">注册时间:</span>
          <span class="value">2023-01-01</span>
        </div>
        <div class="info-item">
          <span class="label">最后登录:</span>
          <span class="value">2023-10-01 14:30</span>
        </div>
      </div>
      
      <div class="profile-actions">
        <button class="action-btn" @click="changePassword">修改密码</button>
        <button class="action-btn" @click="editProfile">编辑资料</button>
      </div>
    </div>
  </div>

  <!-- 修改密码弹窗 -->
  <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>修改密码</h3>
        <button class="close-btn" @click="closePasswordModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitPasswordChange">
          <div class="form-group">
            <label for="oldPassword">原密码:</label>
            <input 
              type="password" 
              id="oldPassword" 
              v-model="passwordForm.oldPassword" 
              required
            />
          </div>
          <div class="form-group">
            <label for="newPassword">新密码:</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="passwordForm.newPassword" 
              required
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">确认新密码:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="passwordForm.confirmPassword" 
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="closePasswordModal">取消</button>
            <button type="submit" class="primary">确认修改</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 编辑资料弹窗 -->
  <div v-if="showProfileModal" class="modal-overlay" @click="closeProfileModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑资料</h3>
        <button class="close-btn" @click="closeProfileModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitProfileEdit">
          <div class="form-group">
            <label for="editUsername">用户名:</label>
            <input 
              type="text" 
              id="editUsername" 
              v-model="profileForm.username" 
              required
            />
          </div>
          <div class="form-group">
            <label for="editEmail">邮箱:</label>
            <input 
              type="email" 
              id="editEmail" 
              v-model="profileForm.email" 
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeProfileModal">取消</button>
            <button type="submit" class="primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { modifyPassword } from '@/api/user';

// 控制弹窗显示状态
const showPasswordModal = ref(false);
const showProfileModal = ref(false);

// 修改密码表单数据
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 编辑资料表单数据
const profileForm = reactive({
  username: 'Admin',
  email: 'admin@pineapple.com'
});

// 打开修改密码弹窗
const changePassword = () => {
  showPasswordModal.value = true;
  // 重置表单
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

// 打开编辑资料弹窗
const editProfile = () => {
  showProfileModal.value = true;
};

// 关闭修改密码弹窗
const closePasswordModal = () => {
  showPasswordModal.value = false;
};

// 关闭编辑资料弹窗
const closeProfileModal = () => {
  showProfileModal.value = false;
};

// 提交密码修改
const submitPasswordChange = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('新密码与确认密码不一致');
    return;
  }
  
  try {
    // 调用修改密码API
    await modifyPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    alert('密码修改成功');
    closePasswordModal();
  } catch (error) {
    console.error('密码修改失败:', error);
    alert('密码修改失败');
  }
};

// 提交资料编辑
const submitProfileEdit = () => {
  // 这里可以调用保存用户资料的API
  console.log('保存用户资料:', profileForm);
  alert('资料保存成功');
  closeProfileModal();
};
</script>

<style scoped>
.profile-center {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.profile-header {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #eaeaea;
}

.avatar {
  font-size: 64px;
  margin-bottom: 10px;
}

.username {
  font-size: 24px;
  margin: 10px 0;
  color: #333;
}

.user-role {
  color: #666;
  font-size: 14px;
}

.profile-content {
  padding: 20px 0;
}

.profile-info {
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  font-weight: bold;
  color: #333;
}

.value {
  color: #666;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-btn {
  padding: 10px 20px;
  border: 1px solid #409eff;
  background: #409eff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.action-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  background: white;
}

.form-actions button.primary {
  border-color: #409eff;
  background: #409eff;
  color: white;
}

.form-actions button:hover {
  opacity: 0.8;
}
</style>
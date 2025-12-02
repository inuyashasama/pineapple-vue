import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'
import { DirectiveBinding } from 'vue'

// 模拟获取当前用户角色的方法
const getCurrentUserRole = (): string => {
  // 实际项目中从 store 或 token 中获取用户角色
  return LocalStorageUtil.get('username') || 'guest'
}

// 权限判断逻辑
const checkPermission = (requiredRoles: string | string[]): boolean => {
  const currentUserRole = getCurrentUserRole()
  
  if (typeof requiredRoles === 'string') {
    return currentUserRole === requiredRoles
  }
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(currentUserRole)
  }
  
  return false
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value: requiredRoles } = binding
    
    if (!checkPermission(requiredRoles)) {
      // 隐藏元素
      el.style.display = 'none'
      // 或者移除元素
      // el.parentNode?.removeChild(el)
    }
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value: requiredRoles } = binding
    
    if (!checkPermission(requiredRoles)) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}
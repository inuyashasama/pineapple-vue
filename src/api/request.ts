// src/utils/request.ts
import axios, { type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { BASE_URL, TIMEOUT } from '../config/config';
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil';

// 默认错误处理
const showError = (msg: string) => {
  ElMessage.error(msg || '请求失败');
};

// 创建 axios 实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});


// 请求拦截器（可选）
request.interceptors.request.use(
  config => {
    // 可添加 token    
    const token = LocalStorageUtil.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

      // 检查是否为文件上传请求（data为FormData）
    if (config.data instanceof FormData) {
      // 如果是文件上传，设置Content-Type为multipart/form-data
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const result = response.data;
    const {success, data, message } = result;
        
    if (success === 200) {
      return data; // 直接返回 data
    } else {
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message));
    }
  },
  (error) => {

    const { response } = error;
    console.log("error：" + response);
    
    // 处理 HTTP 错误
    if (response) {
      const { status, data } = response;

      // 统一错误消息
      let errorMsg = data?.message || data?.error || '请求异常';

      if (status === 401) {
        errorMsg = errorMsg || '接口请求错误';
      } else if (status === 403) {
        errorMsg = errorMsg || '无权限访问';
      } else if (status === 404) {
        errorMsg = errorMsg || '请求地址不存在';
      } else if (status >= 500) {
        errorMsg = errorMsg || '服务器内部错误';
      }

      // 如果不是主动忽略提示
      const config = response.config as AxiosRequestConfig & { ignoreMessage?: boolean };
      if (!config.ignoreMessage) {
        showError(errorMsg);
      }

      // 抛出错误
      return Promise.reject(new Error(errorMsg));
    }

    // 网络错误（如断网、超时）
    const networkError = '网络连接失败，请检查网络';
    if (!error.config?.ignoreMessage) {
      showError(networkError);
    }
    return Promise.reject(new Error(networkError));
  }
);

export default request;
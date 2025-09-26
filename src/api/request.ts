// src/utils/request.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage, ElLoading } from 'element-plus';
import { BASE_URL, TIMEOUT } from '@/config/config';

// 后端返回的统一结构
interface Result<T = any> {
  success: number;
  message: string;
  data: T;
}

// 创建 axios 实例
const service = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 全局 loading 实例
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null;

// 请求计数器（用于多请求时 loading 控制）
let requestCount = 0;

const showLoading = () => {
  if (requestCount === 0) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    });
  }
  requestCount++;
};

const hideLoading = () => {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    loadingInstance?.close();
    loadingInstance = null;
  }
};

// 默认错误处理
const showError = (msg: string) => {
  ElMessage.error(msg || '请求失败');
};

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig & { loading?: boolean; ignoreMessage?: boolean }) => {
    // 默认开启 loading
    if (config.loading !== false) {
      showLoading();
    }

    // 自动携带 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => {
    hideLoading();
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    hideLoading();

    const res = response.data;

    // 👉 业务成功：success === 200
    if (res.success === 200) {
      return res.data; // 直接返回 data
    }

    // 👉 业务失败：如参数错误、权限不足等
    const message = res.message || '请求失败';

    // 如果请求设置了 ignoreMessage，则不提示
    const config = response.config as AxiosRequestConfig & { ignoreMessage?: boolean };
    if (!config.ignoreMessage) {
      showError(message);
    }

    // 抛出错误，便于 catch 捕获
    return Promise.reject(new Error(message));
  },
  (error) => {
    hideLoading();

    const { response, message } = error;

    // 处理 HTTP 错误
    if (response) {
      const { status, data } = response;

      // 统一错误消息
      let errorMsg = data?.message || data?.error || '请求异常';

      if (status === 401) {
        // 清除本地 token
        localStorage.removeItem('token');
        // 可选：跳转登录页
        // router.push('/login');
        errorMsg = '登录已过期，请重新登录';
      } else if (status === 403) {
        errorMsg = '无权限访问';
      } else if (status === 404) {
        errorMsg = '请求地址不存在';
      } else if (status >= 500) {
        errorMsg = '服务器内部错误';
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

export default service;
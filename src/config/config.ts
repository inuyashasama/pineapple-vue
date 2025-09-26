/** 环境变量 */
const ENV = import.meta.env;

/** 基础域名 */
export const BASE_URL = ENV.VITE_BASE_API;

/** 基础服务地址（带 /api） */
export const API_URL = ENV.VITE_BASE_API + "/api";

/** 超时时间 */
export const TIMEOUT = 6000;
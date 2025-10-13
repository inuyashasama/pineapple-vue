/**
 * localStorage 工具类
 */
export class LocalStorageUtil {
  /**
   * 设置数据到 localStorage（无过期时间）
   * @param key 键
   * @param value 值
   */
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorageUtil.set error:', error);
    }
  }

  /**
   * 设置数据到 localStorage（有过期时间）
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（毫秒）
   */
  static setWithExpire(key: string, value: any, ttl: number): void {
    try {
      const data = {
        value: value,
        expireTime: new Date().getTime() + ttl
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorageUtil.setWithExpire error:', error);
    }
  }

  /**
   * 从 localStorage 获取数据
   * @param key 键
   * @returns 值或 null（如果不存在或已过期）
   */
  static get(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const data = JSON.parse(item);
      
      // 检查是否有过期时间
      if (typeof data === 'object' && data.expireTime) {
        // 检查是否已过期
        if (new Date().getTime() > data.expireTime) {
          localStorage.removeItem(key);
          return null;
        }
        return data.value;
      }
      
      return data;
    } catch (error) {
      console.error('LocalStorageUtil.get error:', error);
      return null;
    }
  }

  /**
   * 从 localStorage 移除数据
   * @param key 键
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorageUtil.remove error:', error);
    }
  }

  /**
   * 清空所有 localStorage 数据
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorageUtil.clear error:', error);
    }
  }
}
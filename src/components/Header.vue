<template>
  <div class="header">
    <div class="left-section">
      <button class="menu-btn" @click="$emit('toggleSidebar')">☰</button>
      <!-- 将标题文字替换为菠萝图标 -->
      <img src="/pineapple.svg" alt="Pineapple Logo" class="logo" />
    </div>
    
    <!-- 其余代码保持不变 -->
    <div class="center-section">
      <div class="weather-banner" v-if="weatherInfo">
        <div class="weather-content">
          <span class="location">{{ weatherInfo.city }}</span>
          <span class="temperature">{{ weatherInfo.temperature }}°C</span>
          <span class="description">{{ weatherInfo.weather }}</span>
          <span class="humidity">湿度: {{ weatherInfo.humidity }}%</span>
        </div>
      </div>
    </div>
    
    <div class="right-section">
      <span class="user">👤 Admin</span>
      <button class="profile-center" @click="goToProfile">个人中心</button>
      <button class="logout" @click="logout">退出</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { WeatherInfo } from '@/types/weather'
import { onMounted, ref } from "vue";
import { LocalStorageUtil } from "@/stroage/LocalStorageUtil";

// 添加天气数据状态
const weatherInfo = ref<WeatherInfo | null>(null)
const loadingWeather = ref(false)

const router = useRouter();
const logout = () => {
  localStorage.removeItem("token");
  router.push("/auth/login");
};

// 添加个人中心导航方法
const goToProfile = () => {
  router.push("/profile");
};

// 获取天气数据
const getWeatherData = async (city: string) => {
  loadingWeather.value = true
  try {
    city = city || '厦门'

    // 检查缓存
    const cacheKey = `weather_${city}`
    const cachedData = LocalStorageUtil.get(cacheKey)
    const cacheTime = LocalStorageUtil.get(`${cacheKey}_time`)

    // 如果缓存存在且未过期（1小时）
    if (cachedData && cacheTime) {
      const now = new Date().getTime()
      const cacheAge = now - parseInt(cacheTime)
      // 缓存有效期1小时
      if (cacheAge < 60 * 60 * 1000) {
        weatherInfo.value = cachedData
        return
      }
    }

    // 缓存不存在或已过期，重新请求
    const apiKey = 'eae0c155eabe9e73dd59b5dae8a1c4bb'
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${apiKey}&city=${city}`
    const response = await fetch(url)
    const data: any = await response.json()

    if (data.status === '1' && data.lives && data.lives.length > 0) {
      weatherInfo.value = data.lives[0]
      // 保存到缓存
      LocalStorageUtil.set(cacheKey, data.lives[0])
      LocalStorageUtil.set(`${cacheKey}_time`, new Date().getTime().toString())
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
  } finally {
    loadingWeather.value = false
  }
}

onMounted(() => {
  getWeatherData("厦门")
})
</script>

<style scoped>
.header {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #eaeaea;
}

.logo {
  height: 32px;
  width: auto;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: right;
  margin: 0 20px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.user {
  font-size: 14px;
}

.profile-center,
.logout {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}

.profile-center:hover,
.logout:hover {
  background: #f0f0f0;
}

/* 天气模块样式 */
/* .weather-banner {
  background: linear-gradient(90deg, #00b4db, #0083b0);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
} */

.weather-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 13px;
}

.weather-content .location {
  font-weight: bold;
}

.weather-content .temperature {
  font-weight: bold;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
  }
  
  .center-section {
    order: 3;
    width: 100%;
    margin: 10px 0 0 0;
    justify-content: flex-start;
  }
  
  .weather-banner {
    width: 100%;
  }
  
  .weather-content {
    justify-content: space-between;
  }
}
</style>

import { createApp } from 'vue'
import App from './App.vue'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


// 可选：中文语言包（如果需要中文）
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 引入路由
import router from './router'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus, { locale: zhCn })
app.use(router)

app.mount('#app')
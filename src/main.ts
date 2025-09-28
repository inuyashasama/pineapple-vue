import { createApp } from 'vue';
import App from './App.vue';

// 引入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
// 路由
import router from './router';


const app = createApp(App);
app.use(ElementPlus, { locale: zhCn });
app.use(router);
app.mount('#app');
<template>
  <div class="outfit-designer">
    <el-container class="main-container">
      <!-- 左侧：服装库 -->
      <el-aside class="clothing-aside">
        <div class="aside-header">
          <h3 class="aside-title">🛍 服装库</h3>
        </div>
        <div class="clothing-list">
          <div 
            v-for="item in clothingList" 
            :key="item.id" 
            draggable 
            @dragstart="onDragStart($event, item)"
            class="clothing-item"
          >
            <img :src="item.imageUrl" :alt="item.name" class="clothing-image" />
            <span class="clothing-name">{{ item.name }}</span>
          </div>
        </div>
      </el-aside>

      <!-- 右侧：搭配预览与操作 -->
      <el-main class="main-content">
        <div class="main-header">
          <h3 class="main-title">🎨 搭配预览</h3>
          <el-button type="success" size="small" icon="Picture" @click="generatePoster">
            生成海报
          </el-button>
        </div>

        <!-- 搭配名称输入 -->
        <el-input 
          v-model="outfitName" 
          placeholder="请输入搭配名称" 
          size="small"
          class="outfit-name-input"
        />

        <!-- 海报预览容器（可接收拖拽） -->
        <div ref="posterContainer" @dragover.prevent @drop="onDrop" class="poster-container">
          <!-- 背景纹理（可选） -->
          <div class="background-pattern"></div>

          <!-- 标题 -->
          <div class="poster-title">
            {{ outfitName || '我的搭配' }}
          </div>

          <!-- 虚拟人体轮廓（可选） -->
          <div class="human-figure">
            <!-- 上装 -->
            <div v-if="currentOutfit.top" class="clothing-top">
              <img :src="currentOutfit.top.imageUrl" class="clothing-image-display" />
            </div>

            <!-- 下装 -->
            <div v-if="currentOutfit.bottom" class="clothing-bottom">
              <img :src="currentOutfit.bottom.imageUrl" class="clothing-image-display" />
            </div>
          </div>
        </div>

        <div class="drag-hint">
          💡 拖拽服装到上方虚线框内完成搭配
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import html2canvas from 'html2canvas'

// 导入本地图片
import imageShirt from '@/assets/1.jpg'
import imagePants from '@/assets/2.jpg'

// 服装类型
interface ClothingItem {
    id: number
    name: string
    imageUrl: string
    type: 'top' | 'bottom'
}

// 服装数据
const clothingList = ref<ClothingItem[]>([
    { id: 1, name: '白色T恤', imageUrl: imageShirt, type: 'top' },
    { id: 2, name: '黑色长裤', imageUrl: imagePants, type: 'bottom' }
])

// 当前搭配状态
const currentOutfit = ref<{
    top: ClothingItem | null
    bottom: ClothingItem | null
}>({
    top: null,
    bottom: null
})

// 搭配名称
const outfitName = ref<string>('我的搭配')

// 海报容器引用
const posterContainer = ref<HTMLElement | null>(null)

// 拖拽开始
const onDragStart = (e: DragEvent, item: ClothingItem) => {
    if (e.dataTransfer) {
        e.dataTransfer.setData('clothing', JSON.stringify(item))
        e.dataTransfer.effectAllowed = 'copy'
    }
}

// 拖拽释放
const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer?.getData('clothing')
    if (!data) return

    try {
        const item: ClothingItem = JSON.parse(data)
        if (item.type === 'top') {
            currentOutfit.value.top = item
        } else if (item.type === 'bottom') {
            currentOutfit.value.bottom = item
        }
    } catch (err) {
        console.error('解析拖拽数据失败', err)
    }
}

// 生成海报
const generatePoster = () => {
    if (!currentOutfit.value.top && !currentOutfit.value.bottom) {
        alert('请至少搭配一件服装！')
        return
    }

    if (!posterContainer.value) {
        alert('海报容器未加载')
        return
    }

    html2canvas(posterContainer.value, {
        backgroundColor: '#fff',
        scale: 2,
        useCORS: true,
        logging: false
    })
        .then((canvas) => {
            const url = canvas.toDataURL('image/png')
            const a = document.createElement('a')
            a.href = url
            a.download = `${outfitName.value || '搭配海报'}.png`
            a.click()
        })
        .catch((err) => {
            console.error('海报生成失败', err)
            alert('海报生成失败，请稍后重试')
        })
}
</script>

<style scoped>
.outfit-designer {
  max-width: 1200px;
  margin: 20px auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.main-container {
  height: 90vh;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
}

/* 左侧服装库 */
.clothing-aside {
  background-color: #f8f9fa;
  padding: 20px;
  width: 280px;
}

.aside-header {
  margin-bottom: 16px;
}

.aside-title {
  color: #333;
  margin: 0 0 16px 0;
  font-size: 18px;
}

.clothing-list {
  max-height: calc(90vh - 100px);
  overflow-y: auto;
}

.clothing-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  cursor: move;
  transition: all 0.2s ease;
}

.clothing-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.clothing-item:active {
  transform: translateY(0);
}

.clothing-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 12px;
}

.clothing-name {
  font-size: 14px;
  color: #333;
}

/* 右侧主内容 */
.main-content {
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

.main-title {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.outfit-name-input {
  max-width: 220px;
  margin-bottom: 20px;
  width: 100%;
}

.poster-container {
  width: 300px;
  min-height: 600px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid #d0d0d0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://via.placeholder.com/300x600/ffffff/eeeeee?text=') center/40px 40px;
  opacity: 0.2;
}

.poster-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
  z-index: 1;
}

.human-figure {
  width: 180px;
  height: 400px;
  margin: 0 auto;
  background: transparent;
  position: relative;
  z-index: 1;
}

.clothing-top {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 160px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.clothing-bottom {
  position: absolute;
  top: 220px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 180px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.clothing-image-display {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.drag-hint {
  text-align: center;
  margin-top: 20px;
  color: #888;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    height: auto;
  }
  
  .clothing-aside {
    width: 100%;
    height: auto;
  }
  
  .clothing-list {
    display: flex;
    overflow-x: auto;
    max-height: none;
  }
  
  .clothing-item {
    flex-direction: column;
    text-align: center;
    min-width: 120px;
    margin-right: 10px;
  }
  
  .clothing-image {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .main-content {
    padding: 15px;
  }
  
  .poster-container {
    width: 100%;
    max-width: 300px;
  }
}
</style>
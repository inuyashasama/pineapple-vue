<template>
    <div class="outfit-designer">
        <el-container style="height: 90vh; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">

            <!-- 左侧：服装库 -->
            <el-aside width="280px" style="background-color: #f8f9fa; padding: 20px;">
                <h3 style="color: #333; margin-top: 0;">🛍 服装库</h3>
                <div v-for="item in clothingList" :key="item.id" draggable @dragstart="onDragStart($event, item)"
                    class="clothing-item" style="
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            cursor: move;
            transition: all 0.2s ease;
          ">
                    <img :src="item.imageUrl" :alt="item.name"
                        style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px;" />
                    <span style="font-size: 14px; color: #333;">{{ item.name }}</span>
                </div>
            </el-aside>

            <!-- 右侧：搭配预览与操作 -->
            <el-main style="padding: 20px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">🎨 搭配预览</h3>
                    <el-button type="success" size="small" icon="Picture" @click="generatePoster">
                        生成海报
                    </el-button>
                </div>

                <!-- 搭配名称输入 -->
                <el-input v-model="outfitName" placeholder="请输入搭配名称" size="small"
                    style="max-width: 220px; margin-bottom: 20px;" />

                <!-- 海报预览容器（可接收拖拽） -->
                <div ref="posterContainer" @dragover.prevent @drop="onDrop" style="
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
  ">
                    <!-- 背景纹理（可选） -->
                    <div
                        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://via.placeholder.com/300x600/ffffff/eeeeee?text='); background-size: 40px 40px; opacity: 0.2;">
                    </div>

                    <!-- 标题 -->
                    <div
                        style="text-align: center; font-size: 20px; font-weight: bold; color: #333; margin-bottom: 24px;">
                        {{ outfitName || '我的搭配' }}
                    </div>

                    <!-- 虚拟人体轮廓（可选） -->
                    <div
                        style="width: 180px; height: 400px; margin: 0 auto; background: transparent; position: relative;">
                        <!-- 上装 -->
                        <div v-if="currentOutfit.top"
                            style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 140px; height: 160px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                            <img :src="currentOutfit.top.imageUrl"
                                style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;" />
                        </div>

                        <!-- 下装 -->
                        <div v-if="currentOutfit.bottom"
                            style="position: absolute; top: 220px; left: 50%; transform: translateX(-50%); width: 140px; height: 180px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                            <img :src="currentOutfit.bottom.imageUrl"
                                style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;" />
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px; color: #888; font-size: 13px;">
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

.clothing-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.clothing-item:active {
    transform: translateY(0);
}
</style>
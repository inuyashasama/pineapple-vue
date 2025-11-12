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
            @click="assignQuick(item)"
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
          <div class="main-header-left">
            <h3 class="main-title">🎨 搭配预览</h3>
            <el-input 
              v-model="outfitName" 
              placeholder="请输入搭配名称" 
              size="small"
              class="outfit-name-input"
            />
          </div>

          <div class="main-header-right">
            <el-select v-model="selectedBackground" size="small" placeholder="背景" class="bg-select">
              <el-option v-for="bg in backgroundPatterns" :key="bg.id" :label="bg.name" :value="bg.id" />
            </el-select>

            <el-button type="primary" size="small" icon="Save" @click="saveOutfit">保存</el-button>
            <el-button size="small" @click="loadOutfit">加载</el-button>
            <el-button type="warning" size="small" @click="resetOutfit">重置</el-button>
            <el-button type="success" size="small" icon="Picture" @click="openPreview">预览/导出</el-button>
          </div>
        </div>

        <!-- 海报预览容器（可接收拖拽） -->
  <div ref="posterContainer" @dragover.prevent @drop="onDrop" @dragenter.prevent="onDragEnter" @dragleave.prevent="onDragLeave" :class="['poster-container', { 'drag-over': isDragOver }]">
          <!-- 背景纹理（可选） -->
          <div class="background-pattern" :style="currentBackgroundStyle"></div>

          <!-- 标题 -->
          <div class="poster-title">
            {{ outfitName || '我的搭配' }}
          </div>
                  <!-- 可自由编辑的服装图层 -->
                  <div class="layers-root">
                    <div
                      v-for="layer in layers"
                      :key="layer.id"
                      class="layer-item"
                      :class="{ selected: selectedLayerId === layer.id }"
                      :style="layerStyle(layer)"
                      @pointerdown.stop.prevent="startLayerDrag($event, layer.id)"
                      @click.stop="selectLayer(layer.id)"
                    >
                      <img :src="layer.item.imageUrl" class="clothing-image-display" />
                      <div class="layer-handle" v-if="selectedLayerId === layer.id">
                        <el-button class="mini" type="danger" size="mini" icon="Close" @click.stop="removeLayer(layer.id)"></el-button>
                      </div>
                    </div>
                  </div>

                  <!-- 虚拟人体轮廓（可选） -->
                  <div class="human-figure" v-if="showFigure"></div>
                  <!-- 选中图层的控制面板 -->
                  <div class="layer-controls" v-if="selectedLayerId !== null">
                    <div class="control-row">
                      <label>缩放</label>
                      <el-slider v-model="selectedScale" :min="0.2" :max="3" :step="0.05" show-tooltip @input="updateSelectedScale" />
                    </div>
                    <div class="control-row">
                      <label>旋转</label>
                      <el-slider v-model="selectedRotate" :min="-180" :max="180" :step="1" show-tooltip @input="updateSelectedRotate" />
                    </div>
                    <div class="control-row actions">
                      <el-button size="mini" @click="bringForward">上移</el-button>
                      <el-button size="mini" @click="sendBackward">下移</el-button>
                      <el-button size="mini" type="danger" @click="removeSelectedLayer">删除</el-button>
                    </div>
                  </div>
        </div>

        <div class="drag-hint">
          💡 拖拽服装到上方虚线框内完成搭配
        </div>
        <el-dialog v-model:visible="previewVisible" width="60%" title="海报预览">
          <div class="preview-body" v-if="previewImage">
            <img :src="previewImage" style="max-width:100%;display:block;margin:0 auto;border-radius:8px" />
          </div>
          <template #footer>
            <el-button @click="previewVisible = false">关闭</el-button>
            <el-button type="primary" @click="downloadPreview">下载高分辨率</el-button>
          </template>
        </el-dialog>

      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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

// 背景样式预设
const backgroundPatterns = ref([
  { id: 1, name: '柔和渐变', style: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { id: 2, name: '米白纹理', style: "url('https://via.placeholder.com/300x600/fff7e6/efe3c7') center/cover" },
  { id: 3, name: '淡粉渐变', style: 'linear-gradient(135deg,#ffe6f0 0%, #ffd6e8 100%)' }
])

const selectedBackground = ref<number>(1)

const currentBackgroundStyle = computed(() => {
  const bg = backgroundPatterns.value.find(b => b.id === selectedBackground.value)
  if (!bg) return {}
  return {
    background: bg.style,
    opacity: '1'
  }
})

// 是否显示人体轮廓
const showFigure = ref(true)

// 预览与导出
const previewVisible = ref(false)
const previewImage = ref<string | null>(null)

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
const isDragOver = ref(false)

const onDragEnter = (e: DragEvent) => {
  isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
  // 当鼠标真实离开容器时清除高亮
  isDragOver.value = false
}

// 拖拽开始
const onDragStart = (e: DragEvent, item: ClothingItem) => {
  if (e.dataTransfer) {
    // 为兼容性同时写入 text/plain 与自定义键
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    } catch (_) { }
    try {
      e.dataTransfer.setData('clothing', JSON.stringify(item))
    } catch (_) { }
    e.dataTransfer.effectAllowed = 'copy'

    // 尝试设置拖拽预览图（若跨域或资源不可用会静默失败）
    try {
      const img = new Image()
      img.src = item.imageUrl
      // 小延迟确保 image 加载
      img.onload = () => {
        try { e.dataTransfer?.setDragImage(img, 30, 30) } catch (_) { }
      }
    } catch (_) { }
  }
}

// 拖拽释放
const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false

  // 兼容多种 data key
  const raw = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('clothing')
  if (!raw) {
    console.warn('drop 没有携带数据')
    return
  }

  try {
    const item: ClothingItem = JSON.parse(raw)
    // 如果使用图层模型，添加为新图层；保留向后兼容
    addLayerFromItem(item)
    // 兼容旧逻辑：同时设置 currentOutfit 以供其它代码使用
    if (item.type === 'top') currentOutfit.value.top = item
    else if (item.type === 'bottom') currentOutfit.value.bottom = item
  } catch (err) {
    console.error('解析拖拽数据失败', err)
  }
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

// 生成海报（调用高分下载）
const generatePoster = () => {
  downloadPreview()
}

// layer 管理（支持多个图层）
interface Layer {
  id: number
  item: ClothingItem
  x: number // 像素
  y: number
  scale: number
  rotate: number // deg
  z: number
}

const layers = ref<Layer[]>([])
let nextLayerId = 1
const selectedLayerId = ref<number | null>(null)

const layerStyle = (layer: Layer) => {
  return {
    position: 'absolute',
    left: `${layer.x}px`,
    top: `${layer.y}px`,
    transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotate}deg)`,
    zIndex: layer.z as any,
    cursor: 'grab'
  } as any
}

// 将 clothingItem 当作新图层加入
const addLayerFromItem = (item: ClothingItem) => {
  const rect = posterContainer.value?.getBoundingClientRect()
  const cw = rect ? rect.width : 300
  const ch = rect ? rect.height : 600
  const baseX = cw / 2
  // 根据服装类型放到上半区或下半区，避免上身和下身堆叠到一起
  const baseY = item.type === 'top' ? Math.round(ch * 0.28) : Math.round(ch * 0.68)

  // 若同类型已有多个图层，则进行水平偏移以避免完全重叠
  const sameTypeCount = layers.value.filter(l => l.item.type === item.type).length
  const offsetTotal = sameTypeCount * 28
  const startX = Math.max(40, Math.min(cw - 40, Math.round(baseX + offsetTotal / 2 - offsetTotal)))
  const startY = baseY

  // 先插入一个占位 layer，再根据图片自然尺寸自动调整 scale 和微调位置以贴合人体
  const newId = nextLayerId++
  const newLayer: Layer = { id: newId, item, x: startX, y: startY, scale: 1, rotate: 0, z: layers.value.length + 1 }
  layers.value.push(newLayer)

  // 异步加载图片以计算合适的缩放，使服装更贴合人体（按类型使用不同目标高度）
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = item.imageUrl
    img.onload = () => {
      const naturalW = img.naturalWidth || img.width || 100
      const naturalH = img.naturalHeight || img.height || 100

      // 目标高度：上装较短、下装略长
      const targetH = item.type === 'top' ? Math.round(ch * 0.34) : Math.round(ch * 0.44)
      let computedScale = targetH / naturalH

      // 限制缩放范围，避免过大或过小
      computedScale = Math.max(0.35, Math.min(2.5, computedScale))

      // 更新刚插入的 layer（查找最新 id）
      const idx = layers.value.findIndex(l => l.id === newId)
      if (idx >= 0) {
        layers.value[idx].scale = computedScale
        // 基于宽高比做微调：若图片偏宽，略微上移/下移以更贴合
        const aspect = naturalW / naturalH
        if (item.type === 'top') {
          layers.value[idx].y = Math.round(startY - Math.min(20, (aspect - 0.6) * 20))
        } else {
          layers.value[idx].y = Math.round(startY + Math.min(20, (1.6 - aspect) * 20))
        }
      }
    }
    img.onerror = () => {
      // 忽略加载错误，保留默认 scale
    }
  } catch (err) {
    // 忽略任何异常
  }
}

// 点击左侧快速添加时也加入 layer 模式
const assignQuick = (item: ClothingItem) => {
  addLayerFromItem(item)
}

const removeLayer = (id: number) => {
  layers.value = layers.value.filter(l => l.id !== id)
  if (selectedLayerId.value === id) selectedLayerId.value = null
}

const selectLayer = (id: number) => { selectedLayerId.value = id }

// 拖拽图层 (pointer events)
let dragging: { id: number | null, startX: number, startY: number, origX: number, origY: number } = { id: null, startX: 0, startY: 0, origX: 0, origY: 0 }

const startLayerDrag = (e: PointerEvent, id: number) => {
  const layer = layers.value.find(l => l.id === id)
  if (!layer) return
  selectedLayerId.value = id
  dragging.id = id
  dragging.startX = e.clientX
  dragging.startY = e.clientY
  dragging.origX = layer.x
  dragging.origY = layer.y
  try { (e.target as Element).setPointerCapture((e as PointerEvent).pointerId) } catch (_){ }
}

const onPointerMove = (e: PointerEvent) => {
  if (dragging.id === null) return
  const dx = e.clientX - dragging.startX
  const dy = e.clientY - dragging.startY
  const layer = layers.value.find(l => l.id === dragging.id)
  if (!layer) return
  layer.x = dragging.origX + dx
  layer.y = dragging.origY + dy
}

const endLayerDrag = (e: PointerEvent) => {
  dragging.id = null
}

// 缩放与旋转控制（用于右侧面板，若选中）
const updateSelectedScale = (val: number) => {
  const layer = layers.value.find(l => l.id === selectedLayerId.value)
  if (layer) layer.scale = val
}

const updateSelectedRotate = (val: number) => {
  const layer = layers.value.find(l => l.id === selectedLayerId.value)
  if (layer) layer.rotate = val
}

// 选中图层的临时控制值（供滑块双向绑定）
const selectedScale = ref<number>(1)
const selectedRotate = ref<number>(0)

watch(selectedLayerId, (id) => {
  const layer = layers.value.find(l => l.id === id)
  if (layer) {
    selectedScale.value = layer.scale
    selectedRotate.value = layer.rotate
  }
})

// z-order / 删除 操作
const bringForward = () => {
  const idx = layers.value.findIndex(l => l.id === selectedLayerId.value)
  if (idx >= 0 && idx < layers.value.length - 1) {
    const temp = layers.value[idx].z
    layers.value[idx].z = layers.value[idx + 1].z
    layers.value[idx + 1].z = temp
    // 重新排序数组显示顺序（可选）
    layers.value.sort((a, b) => a.z - b.z)
  }
}

const sendBackward = () => {
  const idx = layers.value.findIndex(l => l.id === selectedLayerId.value)
  if (idx > 0) {
    const temp = layers.value[idx].z
    layers.value[idx].z = layers.value[idx - 1].z
    layers.value[idx - 1].z = temp
    layers.value.sort((a, b) => a.z - b.z)
  }
}

const removeSelectedLayer = () => {
  if (selectedLayerId.value !== null) removeLayer(selectedLayerId.value)
}

// 监听全局 pointer move/up
window.addEventListener('pointermove', onPointerMove)
window.addEventListener('pointerup', endLayerDrag)
// ---------- 新增交互方法与持久化（基于图层） ----------
const STORAGE_KEY = 'pineapple_saved_outfit'

const saveOutfit = () => {
  const payload: any = {
    name: outfitName.value,
    backgroundId: selectedBackground.value,
    showFigure: showFigure.value,
    layers: layers.value.map(l => ({ itemId: l.item.id, x: l.x, y: l.y, scale: l.scale, rotate: l.rotate, z: l.z }))
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    alert('保存成功')
  } catch (err) {
    console.error('保存失败', err)
    alert('保存失败')
  }
}

const loadOutfit = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      alert('没有找到已保存的搭配')
      return
    }
    const data = JSON.parse(raw)
    outfitName.value = data.name || outfitName.value
    selectedBackground.value = data.backgroundId || selectedBackground.value
    showFigure.value = data.showFigure ?? showFigure.value
    if (Array.isArray(data.layers)) {
      layers.value = data.layers.map((ll: any, idx: number) => {
        const item = clothingList.value.find(c => c.id === ll.itemId) || clothingList.value[0]
        return { id: nextLayerId++, item, x: ll.x, y: ll.y, scale: ll.scale ?? 1, rotate: ll.rotate ?? 0, z: ll.z ?? idx + 1 }
      })
    }
    alert('已加载保存的搭配')
  } catch (err) {
    console.error('加载失败', err)
    alert('加载失败')
  }
}

const resetOutfit = () => {
  outfitName.value = '我的搭配'
  layers.value = []
  selectedBackground.value = backgroundPatterns.value[0]?.id || 1
  showFigure.value = true
}

const openPreview = async () => {
  if (!posterContainer.value) return alert('海报容器未加载')
  try {
    const canvas = await html2canvas(posterContainer.value, { backgroundColor: '#fff', scale: 2, useCORS: true })
    previewImage.value = canvas.toDataURL('image/png')
    previewVisible.value = true
  } catch (err) {
    console.error('生成预览失败', err)
    alert('生成预览失败')
  }
}

const downloadPreview = async () => {
  if (!posterContainer.value) return alert('海报容器未加载')
  try {
    const canvas = await html2canvas(posterContainer.value, { backgroundColor: '#fff', scale: 3, useCORS: true })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${outfitName.value || '搭配海报'}.png`
    a.click()
  } catch (err) {
    console.error('下载失败', err)
    alert('下载失败')
  }
}

onMounted(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const data = JSON.parse(raw)
      outfitName.value = data.name || outfitName.value
      selectedBackground.value = data.backgroundId || selectedBackground.value
      showFigure.value = data.showFigure ?? showFigure.value
      if (Array.isArray(data.layers)) {
        layers.value = data.layers.map((ll: any, idx: number) => {
          const item = clothingList.value.find(c => c.id === ll.itemId) || clothingList.value[0]
          return { id: nextLayerId++, item, x: ll.x, y: ll.y, scale: ll.scale ?? 1, rotate: ll.rotate ?? 0, z: ll.z ?? idx + 1 }
        })
      }
    } catch (err) {
      // ignore
    }
  }
})
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
  pointer-events: none;
}

.poster-container.drag-over {
  outline: 3px dashed rgba(34, 197, 94, 0.8);
  outline-offset: 6px;
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
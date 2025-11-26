<template>
  <div class="treasure-container">
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="stat-card">
          <template #header>
            <div class="stat-header">
              <span>💎 藏品现值</span>
              <el-tag size="small" effect="plain" type="success">实时资产</el-tag>
            </div>
          </template>
          <div class="stat-value">¥ {{ totalCurrentValue.toLocaleString() }}</div>
          <div class="stat-sub">原值: ¥ {{ totalOriginalPrice.toLocaleString() }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" class="stat-card">
          <template #header>
            <div class="stat-header">
              <span>💸 日均总耗</span>
              <el-tooltip content="基于已使用天数计算的日均持有成本" placement="top">
                <el-icon>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="stat-value error-color">- ¥ {{ totalDailyCost.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" class="stat-card">
          <template #header>
            <div class="stat-header">
              <span>📦 物品数量</span>
            </div>
          </template>
          <div class="stat-value">{{ items.length }} <span class="unit">件</span></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar-content">
        <div class="left-actions">
          <el-input v-model="searchText" placeholder="搜索藏品名称..." prefix-icon="Search" clearable style="width: 240px" />
        </div>
        <div class="right-actions">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button label="grid"><el-icon>
                <Grid />
              </el-icon> 网格</el-radio-button>
            <el-radio-button label="list"><el-icon>
                <Menu />
              </el-icon> 列表</el-radio-button>
          </el-radio-group>
          <el-divider direction="vertical" />
          <el-button type="primary" icon="Plus" @click="openAddModal">登记新物</el-button>
        </div>
      </div>
    </el-card>

    <div class="main-content">
      <transition-group name="el-fade-in" tag="div" v-if="viewMode === 'grid'">
        <el-row :gutter="20" v-if="filteredItems.length > 0">
          <el-col v-for="item in filteredItems" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
            <el-card class="item-card" shadow="hover" :body-style="{ padding: '0px' }">
              <div class="card-image-wrapper">
                <el-image :src="item.imageUrl" fit="cover" class="card-image" loading="lazy">
                  <template #error>
                    <div class="image-placeholder"><el-icon :size="32">
                        <Picture />
                      </el-icon></div>
                  </template>
                </el-image>
                <div class="card-price-badge">¥ {{ item.price.toLocaleString() }}</div>
                <div class="card-method-tag">
                  <el-tag size="small" :type="getMethodTagType(item.depreciationMethod)" effect="dark">
                    {{ getMethodLabel(item.depreciationMethod) }}
                  </el-tag>
                </div>
              </div>

              <div class="card-body">
                <div class="card-header">
                  <h3 class="item-name" :title="item.name">{{ item.name }}</h3>
                  <span class="purchase-date">{{ formatDate(item.purchaseDate) }} 购入</span>
                </div>

                <div class="life-progress">
                  <div class="progress-label">
                    <span>剩余: <b style="color:#303133">¥{{ calcRemainingValue(item).toFixed(0) }}</b></span>
                    <span v-if="item.depreciationMethod === 'usage'">
                      {{ item.currentUsage }}/{{ item.totalUsageLimit }}次
                    </span>
                    <span v-else-if="item.depreciationMethod === 'none'">保值中</span>
                    <span v-else>{{ getLifePercentage(item) }}%</span>
                  </div>

                  <el-progress v-if="item.depreciationMethod !== 'none'" :percentage="getDisplayPercentage(item)"
                    :status="getLifeStatus(item)" :stroke-width="8" :show-text="false" />
                  <div v-else class="gold-line"></div>

                  <div class="daily-cost">
                    <span v-if="item.depreciationMethod === 'none'" class="appreciate-text">
                      <el-icon>
                        <TrendCharts />
                      </el-icon> 永不折旧
                    </span>
                    <span v-else>
                      日耗: ¥{{ calcDailyDepreciation(item).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="footer-info">
                  <template v-if="item.depreciationMethod === 'usage'">
                    <el-icon>
                      <Odometer />
                    </el-icon> 剩 {{ (item.totalUsageLimit || 0) - (item.currentUsage || 0) }} 次
                  </template>
                  <template v-else-if="item.depreciationMethod === 'none'">
                    <el-icon>
                      <Collection />
                    </el-icon> 收藏品
                  </template>
                  <template v-else>
                    <el-icon>
                      <Timer />
                    </el-icon> 剩 {{ calcRemainingDays(item) }} 天
                  </template>
                </div>
                <div class="footer-actions">
                  <el-button link type="primary" icon="Edit" @click="editItem(item)"></el-button>
                  <el-button link type="danger" icon="Delete" @click="removeItem(item.id)"></el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-else description="暂无符合条件的藏品" />
      </transition-group>

      <div v-else class="table-view-container">
        <el-card shadow="never">
          <el-table :data="filteredItems" style="width: 100%" stripe>
            <el-table-column label="物品" min-width="180">
              <template #default="{ row }">
                <div style="display:flex; align-items:center; gap:10px;">
                  <el-avatar shape="square" :size="36" :src="row.imageUrl" icon="Picture" />
                  <div>
                    <div style="font-weight:500">{{ row.name }}</div>
                    <el-tag size="small" scale="0.8" :type="getMethodTagType(row.depreciationMethod)">
                      {{ getMethodLabel(row.depreciationMethod) }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="购入/剩余" width="160">
              <template #default="{ row }">
                <div>原: ¥{{ row.price }}</div>
                <div style="color:#67C23A; font-weight:bold">现: ¥{{ calcRemainingValue(row).toFixed(2) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="140">
              <template #default="{ row }">
                <span v-if="row.depreciationMethod === 'usage'">
                  {{ row.currentUsage }}/{{ row.totalUsageLimit }} 次
                </span>
                <span v-else-if="row.depreciationMethod === 'none'"> - </span>
                <span v-else>已用 {{ calcElapsedDays(row) }} 天</span>
              </template>
            </el-table-column>
            <el-table-column label="日均消耗" width="120">
              <template #default="{ row }">¥ {{ calcDailyDepreciation(row).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="editItem(row)">编辑</el-button>
                <el-button type="danger" link @click="removeItem(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <el-dialog :title="form.id ? '编辑物品' : '登记新物'" v-model="dialogVisible" width="600px" destroy-on-close
      class="custom-dialog">
      <el-form :model="form" label-position="top">

        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="物品名称">
              <el-input v-model="form.name" placeholder="例如：Sony A7M4 相机" prefix-icon="Goods" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="购入日期">
              <el-date-picker v-model="form.purchaseDate" type="datetime" format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" :clearable="false" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="购入价格 (元)">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" :controls="false"
                prefix-icon="Money" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图片链接 / 上传">
              <div style="display:flex; gap:8px">
                <el-input v-model="form.imageUrl" placeholder="图片URL" />
                <!-- 图片预览 -->
                <el-image
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 4px; margin-left: 2px;"
                  preview-teleported
                  hide-on-click-modal
                  :preview-src-list="[form.imageUrl]"
                >
                  <template #error>
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f7fa;">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <el-upload action="#" :show-file-list="false" :before-upload="handleBeforeUpload" style="display:flex">
                  <el-icon>
                    <Upload />
                  </el-icon>
                </el-upload>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">折旧算法配置</el-divider>

        <el-form-item label="价值估算模式">
          <el-radio-group v-model="form.depreciationMethod" @change="handleMethodChange">
            <el-radio-button label="straight">平稳</el-radio-button>
            <el-radio-button label="accelerated">加速(数码)</el-radio-button>
            <el-radio-button label="usage">按量</el-radio-button>
            <el-radio-button label="none">保值</el-radio-button>
          </el-radio-group>
          <div class="form-help-text">{{ getMethodTip(form.depreciationMethod) }}</div>
        </el-form-item>

        <div v-if="['straight', 'accelerated'].includes(form.depreciationMethod)" class="dynamic-field-group">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="预计使用寿命 (年)">
                <el-input-number v-model="form.usefulLifeYears" :min="0.5" :step="0.5" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计残值率 (%)">
                <el-input-number v-model="form.residualPercent" :min="0" :max="100" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div v-if="form.depreciationMethod === 'usage'" class="dynamic-field-group">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="设计总寿命 (次/小时)">
                <el-input-number v-model="form.totalUsageLimit" :min="1" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="当前已使用 (次/小时)">
                <el-input-number v-model="form.currentUsage" :min="0" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="残值率 (%)">
            <el-slider v-model="form.residualPercent" :step="5" show-input />
          </el-form-item>
        </div>

        <div v-if="form.depreciationMethod === 'none'" class="dynamic-field-group info-box">
          <el-icon>
            <InfoFilled />
          </el-icon> 此物品将始终保持购入价格，不计算损耗。
        </div>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveItem">保存配置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Picture, Grid, Menu, Edit, Delete,
  Timer, InfoFilled, Goods, Money, TrendCharts, Upload, Odometer, Collection
} from '@element-plus/icons-vue'
import treasureApi, { TreasureItem } from '@/api/treasure' // 假设 api 类型已更新
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

// --- State ---
const items = ref<TreasureItem[]>([])
const userId = LocalStorageUtil.get('userId')
const searchText = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const dialogVisible = ref(false)

// 表单数据
const form = reactive<any>({
  id: '',
  name: '',
  price: 0,
  purchaseDate: new Date(),
  usefulLifeYears: 3,
  imageUrl: '',
  residualPercent: 0,
  depreciationMethod: 'straight', // 默认
  totalUsageLimit: 1000,
  currentUsage: 0
})

// --- Computed ---
const filteredItems = computed(() => {
  const t = (searchText.value || '').toLowerCase().trim()
  if (!t) return items.value
  return items.value.filter(i => (i.name || '').toLowerCase().includes(t))
})

// 统计：原价总和
const totalOriginalPrice = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price, 0).toFixed(0)
})

// 统计：当前残值总和
const totalCurrentValue = computed(() => {
  return items.value.reduce((sum, item) => sum + calcRemainingValue(item), 0).toFixed(0)
})

// 统计：日均总消耗
const totalDailyCost = computed(() => {
  return items.value.reduce((sum, item) => sum + calcDailyDepreciation(item), 0)
})

// --- Methods ---
const load = async () => {
  const data = await treasureApi.fetchFromServer()
  // 数据清洗：保证旧数据有默认值
  items.value = data.map((item: any) => ({
    ...item,
    depreciationMethod: item.depreciationMethod || 'straight',
    residualPercent: item.residualPercent || 0,
    totalUsageLimit: item.totalUsageLimit || 100,
    currentUsage: item.currentUsage || 0
  }))
}

onMounted(() => load())

// 核心算法：计算剩余价值
const calcRemainingValue = (item: TreasureItem) => {
  const { price, depreciationMethod, purchaseDate, usefulLifeYears, residualPercent } = item

  // 1. 保值模式
  if (depreciationMethod === 'none') return price;

  const residualValue = price * (residualPercent / 100);
  const depreciableAmount = Math.max(0, price - residualValue); // 可折旧总额

  // 2. 按量模式
  if (depreciationMethod === 'usage') {
    const total = item.totalUsageLimit || 1;
    const current = item.currentUsage || 0;
    const usageRatio = Math.min(1, current / total);
    return Math.max(residualValue, price - (depreciableAmount * usageRatio));
  }

  // 时间维度计算
  const daysUsed = Math.max(0, (new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 3600 * 24));
  const totalDays = Math.max(1, usefulLifeYears * 365);
  const timeRatio = Math.min(1, daysUsed / totalDays);

  // 3. 加速折旧 (模拟 y = x^1.5 曲线，前期掉价快)
  if (depreciationMethod === 'accelerated') {
    // 衰减因子：前期衰减快。使用 (1 - (1-t)^1.5) 
    // 例如时间过了 50% (t=0.5), (1-0.5)^1.5 ≈ 0.35, 衰减 = 1-0.35 = 0.65 (损失65%)
    const decayFactor = 1 - Math.pow(1 - timeRatio, 1.5);
    return Math.max(residualValue, price - (depreciableAmount * decayFactor));
  }

  // 4. 平稳折旧 (直线法)
  return Math.max(residualValue, price - (depreciableAmount * timeRatio));
}

// 辅助算法：计算日均消耗
const calcDailyDepreciation = (item: TreasureItem) => {
  if (item.depreciationMethod === 'none') return 0;

  const currentVal = calcRemainingValue(item);
  const loss = item.price - currentVal;
  const days = Math.max(1, (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 3600 * 24));

  return loss / days;
}

// 辅助算法：获取进度百分比 (用于进度条)
const getDisplayPercentage = (item: TreasureItem) => {
  if (item.depreciationMethod === 'usage') {
    const total = item.totalUsageLimit || 1
    const current = item.currentUsage || 0
    return Math.min(100, (current / total) * 100) // 使用量进度
  }
  // 时间进度：基于价值的倒数，或者直接基于剩余价值比例
  const currentVal = calcRemainingValue(item);
  if (item.price <= 0) return 0;
  return Math.round((currentVal / item.price) * 100); // 剩余价值百分比
}

// 辅助算法：剩余价值百分比 (用于文字展示)
const getLifePercentage = (item: TreasureItem) => {
  const currentVal = calcRemainingValue(item);
  if (item.price === 0) return 0;
  return Math.round((currentVal / item.price) * 100);
}

// 辅助算法：计算剩余天数
const calcRemainingDays = (item: TreasureItem) => {
  const totalDays = item.usefulLifeYears * 365;
  const elapsed = (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 3600 * 24);
  return Math.max(0, Math.round(totalDays - elapsed));
}
const calcElapsedDays = (item: TreasureItem) => {
  return Math.max(0, Math.floor((new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 3600 * 24)));
}

// --- UI Helpers ---
const formatDate = (iso: string | Date) => new Date(iso).toLocaleDateString()

const getLifeStatus = (item: TreasureItem) => {
  // Usage 模式：百分比是“已用”，所以越高越危险
  if (item.depreciationMethod === 'usage') {
    const p = getDisplayPercentage(item);
    if (p > 90) return 'exception';
    if (p > 70) return 'warning';
    return 'success';
  }
  // 时间模式：百分比是“剩余价值”，所以越低越危险
  const p = getDisplayPercentage(item);
  if (p > 50) return 'success';
  if (p > 20) return 'warning';
  return 'exception';
}

const getMethodLabel = (m: string) => {
  const map: any = { straight: '平稳', accelerated: '加速', usage: '按量', none: '保值' }
  return map[m] || '未知'
}
const getMethodTagType = (m: string) => {
  const map: any = { straight: '', accelerated: 'warning', usage: 'danger', none: 'success' }
  return map[m] || 'info'
}
const getMethodTip = (m: string) => {
  const map: any = {
    straight: '每日折旧金额相同，适合家具、衣服等普通用品。',
    accelerated: '前期贬值快，适合手机、电脑等数码产品。',
    usage: '根据使用次数/时长计算，适合相机(快门)、无人机等。',
    none: '价值不随时间减少，适合黄金、手办、传家宝。'
  }
  return map[m]
}

const handleMethodChange = (val: string) => {
  // 切换模式时给一些默认值
  if (val === 'usage' && form.totalUsageLimit === 0) form.totalUsageLimit = 1000;
  if (val === 'accelerated') form.usefulLifeYears = 3; // 数码通常3年
  if (val === 'straight') form.usefulLifeYears = 5;
}

// --- CRUD Actions ---
const openAddModal = () => {
  resetForm()
  dialogVisible.value = true
}

const editItem = (row: TreasureItem) => {
  Object.assign(form, row)
  form.purchaseDate = row.purchaseDate
  dialogVisible.value = true
}

const saveItem = async() => {
  if (!form.name || !form.price) {
    ElMessage.warning('名称和价格必填')
    return
  }
  const payload: TreasureItem = {
    ...form,
    id: form.id || uuidv4(),
    userId: userId,
    price: Number(form.price),
    purchaseDate: form.purchaseDate,
    // 确保数字类型正确
    usefulLifeYears: Number(form.usefulLifeYears),
    residualPercent: Number(form.residualPercent),
    totalUsageLimit: Number(form.totalUsageLimit),
    currentUsage: Number(form.currentUsage)
  }
  await treasureApi.save(payload)
  await load()
  dialogVisible.value = false
  ElMessage.success('保存成功')
}

const removeItem = async (id: string) => {
  ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }).then(async () => {
    await treasureApi.remove(id); 
    await load(); 
    ElMessage.success('已删除')
  })
}

const resetForm = () => {
  form.id = ''; form.name = ''; form.price = 0; form.purchaseDate = new Date();
  form.imageUrl = ''; form.depreciationMethod = 'straight';
  form.usefulLifeYears = 3; form.residualPercent = 0;
  form.totalUsageLimit = 1000; form.currentUsage = 0;
}

const handleBeforeUpload = async (file: File) => {
  try {
    const url = await treasureApi.uploadImage(file)
    form.imageUrl = url
  } catch (e) { ElMessage.error('上传失败') }
  return false
}
</script>

<style scoped lang="scss">
.treasure-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* Dashboard */
.dashboard-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
  border-radius: 8px;
  border: none;

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #909399;
    font-size: 14px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-top: 8px;

    &.error-color {
      color: #F56C6C;
    }

    .unit {
      font-size: 14px;
      color: #909399;
      font-weight: normal;
    }
  }

  .stat-sub {
    font-size: 12px;
    color: #C0C4CC;
    margin-top: 4px;
  }
}

/* Toolbar */
.toolbar-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: none;

  .toolbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

/* Cards */
.item-card {
  border: none;
  border-radius: 12px;
  transition: all 0.2s;
  margin-bottom: 20px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }

  .card-image-wrapper {
    position: relative;
    height: 160px;
    background: #f0f2f5;

    .card-image {
      width: 100%;
      height: 100%;
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #c0c4cc;
    }

    .card-price-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      backdrop-filter: blur(4px);
    }

    .card-method-tag {
      position: absolute;
      top: 8px;
      left: 8px;
    }
  }

  .card-body {
    padding: 16px;

    .card-header {
      margin-bottom: 12px;

      .item-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .purchase-date {
        font-size: 12px;
        color: #909399;
      }
    }

    .life-progress {
      .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #606266;
        margin-bottom: 4px;
      }

      .daily-cost {
        margin-top: 6px;
        font-size: 12px;
        color: #F56C6C;
        text-align: right;

        .appreciate-text {
          color: #E6A23C;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }
      }

      .gold-line {
        height: 6px;
        background: linear-gradient(90deg, #FDC830, #F37335);
        border-radius: 3px;
        margin-top: 6px;
      }
    }
  }

  .card-footer {
    border-top: 1px solid #f2f2f2;
    padding: 8px 16px;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-info {
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

/* Dialog Form */
.form-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 1px;
  margin-left: 5px;
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.dynamic-field-group {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px dashed #dcdfe6;

  &.info-box {
    background: #f0f9eb;
    border-color: #67c23a;
    color: #67c23a;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
<template>
    <div class="uploader">
        <input
            type="file"
            id="file-input"
            style="display: none"
            accept="image/*"
            @change="onImageAdded"
        />

        <div
            class="card upload-card"
            @click="openFileDialog"
            v-if="!isThumbnailVisible"
        >
            <svg
                class="icon"
                width="28"
                height="28"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    fill="#8c939d"
                    d="M480 480V128a32 32 0 0164 0v352h352a32 32 0 110 64H544v352a32 32 0 11-64 0V544H128a32 32 0 010-64h352z"
                ></path>
            </svg>
        </div>

        <div class="card thumbnail-card" v-show="isThumbnailVisible">
            <img src="" alt="缩略图" id="thumbnail" />

            <label class="success-label" v-show="isSuccessLabelVisible"
                ><i class="success-icon"
                    ><svg
                        class="icon"
                        width="12"
                        height="12"
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill="white"
                            d="M406.656 706.944L195.84 496.256a32 32 0 10-45.248 45.248l256 256 512-512a32 32 0 00-45.248-45.248L406.592 706.944z"
                        ></path></svg>
                ></i>
            </label>

            <!-- 图标 -->
            <div class="thumbnail-actions">
                <span class="thumbnail-preview" @click="handleThumbnailPreview">
                    <svg
                        class="icon"
                        width="20"
                        height="20"
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill="white"
                            d="M795.904 750.72l124.992 124.928a32 32 0 01-45.248 45.248L750.656 795.904a416 416 0 1145.248-45.248zM480 832a352 352 0 100-704 352 352 0 000 704zm-32-384v-96a32 32 0 0164 0v96h96a32 32 0 010 64h-96v96a32 32 0 01-64 0v-96h-96a32 32 0 010-64h96z"
                        ></path>
                    </svg>
                </span>

                <span class="thumbnail-delete" @click="handleThumbnailRemove">
                    <svg
                        class="icon"
                        width="20"
                        height="20"
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill="white"
                            d="M160 256H96a32 32 0 010-64h256V95.936a32 32 0 0132-32h256a32 32 0 0132 32V192h256a32 32 0 110 64h-64v672a32 32 0 01-32 32H192a32 32 0 01-32-32V256zm448-64v-64H416v64h192zM224 896h576V256H224v640zm192-128a32 32 0 01-32-32V416a32 32 0 0164 0v320a32 32 0 01-32 32zm192 0a32 32 0 01-32-32V416a32 32 0 0164 0v320a32 32 0 01-32 32z"
                        ></path>
                    </svg>
                </span>
            </div>

            <!-- 进度条 -->
            <el-progress
                type="circle"
                :percentage="progress"
                v-show="isProgressVisible"
                :width="110"
                id="progress"
            />
        </div>

        <vue-easy-lightbox
            moveDisabled
            :visible="isLightBoxVisible"
            :imgs="localImageUrl"
            :index="index"
            @hide="handleLightboxHide"
        />
    </div>
</template>

<script lang="ts">
import { ref, computed } from "vue";
import { Plus } from "@element-plus/icons-vue";
import VueEasyLightbox from "vue-easy-lightbox";
import { ElMessage } from 'element-plus';
import { uploadAvatar } from "@/api/upload";
import { BASE_URL } from '../config/config';

export default {
    name: "ImageUploader",
    components: { Plus, VueEasyLightbox },
    props: {
        initialUrl: { type: String, default: '' },
        maxSizeMB: { type: Number, default: 5 },
        accept: { type: String, default: 'image/*' }
    },
    emits: ['uploaded','aboutToUpload','removed'],
    setup(props, { emit }) {
        // state
        const progress = ref(0);
        const isLightBoxVisible = ref(false);
        const isProgressVisible = ref(false);
        const isSuccessLabelVisible = ref(false);
        const isUploading = ref(false);
        const imageUrl = ref<string>(props.initialUrl || '');
        const localImageUrl = ref<string>(props.initialUrl || '');
        const index = ref(0);
        const isDragOver = ref(false);

        const isThumbnailVisible = computed(() => !!localImageUrl.value && localImageUrl.value.length > 0);

        // validate file size and type
        const validateFile = (file: File) => {
            const maxBytes = props.maxSizeMB * 1024 * 1024;
            if (file.size > maxBytes) {
                ElMessage.warning(`文件大小不能超过 ${props.maxSizeMB} MB`);
                return false;
            }
            if (props.accept && props.accept !== '*' && file.type && !file.type.startsWith(props.accept.split('/')[0])) {
                // basic type check
            }
            return true;
        }

        const openFileDialog = () => {
            const fileInput = document.getElementById("file-input") as HTMLInputElement | null;
            fileInput?.click();
        }

        const onImageAdded = async (e?: Event) => {
            const fileInput = document.getElementById("file-input") as HTMLInputElement | null;
            const files = fileInput?.files;
            if (!files || files.length === 0) return;
            const file = files[0];

            if (!validateFile(file)) return;

            emit('aboutToUpload');
            setLocalPreview(URL.createObjectURL(file));
            await upload(file);
        }

        const setLocalPreview = (url: string) => {
            localImageUrl.value = url;
            const thumbnailEl = document.getElementById('thumbnail') as HTMLImageElement | null;
            if (thumbnailEl) thumbnailEl.src = url;
        }

        const clearPreview = () => {
            imageUrl.value = '';
            localImageUrl.value = '';
            isSuccessLabelVisible.value = false;
            progress.value = 0;
            emit('removed');
        }

        const handleThumbnailPreview = () => { isLightBoxVisible.value = true }
        const handleLightboxHide = () => { isLightBoxVisible.value = false }

        // helper to parse upload response into a usable URL
        const resolveUploadUrl = (res: any) => {
            const candidate = res?.url || res?.data?.url || res?.data || res;
            if (!candidate) return '';
            let s = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
            if (s.startsWith('http')) return s;
            // join with BASE_URL
            return BASE_URL.replace(/\/$/, '') + '/' + s.replace(/^\//, '');
        }

        // simulate progress until real completion
        let progressTimer: any = null;
        const startFakeProgress = () => {
            progress.value = 5;
            isProgressVisible.value = true;
            progressTimer = setInterval(() => {
                if (progress.value < 90) progress.value += Math.random() * 6
                else clearInterval(progressTimer)
            }, 300)
        }
        const stopFakeProgress = () => { if (progressTimer) { clearInterval(progressTimer); progressTimer = null } }

        const upload = async (file: File) => {
            try {
                isUploading.value = true;
                isSuccessLabelVisible.value = false;
                startFakeProgress();

                const res = await uploadAvatar(file)
                stopFakeProgress();
                progress.value = 100;
                const url = resolveUploadUrl(res)
                imageUrl.value = url
                // update DOM img if present
                const thumbnailEl = document.getElementById('thumbnail') as HTMLImageElement | null;
                if (thumbnailEl && url) thumbnailEl.src = url

                // small delay to show full progress
                await new Promise(r => setTimeout(r, 180))
                isProgressVisible.value = false
                isSuccessLabelVisible.value = true
                emit('uploaded', url)
            } catch (err) {
                stopFakeProgress()
                isProgressVisible.value = false
                localImageUrl.value = ''
                ElMessage.error('哎呀，图片上传出错啦~')
            } finally {
                isUploading.value = false
            }
        }

        // drag & drop handlers
        const onDragOver = (e: DragEvent) => { e.preventDefault(); isDragOver.value = true }
        const onDragLeave = (e: DragEvent) => { e.preventDefault(); isDragOver.value = false }
        const onDrop = async (e: DragEvent) => {
            e.preventDefault(); isDragOver.value = false
            const f = e.dataTransfer?.files?.[0]
            if (!f) return
            if (!validateFile(f)) return
            setLocalPreview(URL.createObjectURL(f))
            emit('aboutToUpload')
            await upload(f)
        }

        return {
            progress,
            imageUrl,
            localImageUrl,
            index,
            isLightBoxVisible,
            isThumbnailVisible,
            isProgressVisible,
            isSuccessLabelVisible,
            isUploading,
            isDragOver,
            handleThumbnailRemove: clearPreview,
            handleThumbnailPreview,
            handleLightboxHide,
            openFileDialog,
            onImageAdded,
            setImageUrl: setLocalPreview,
            onDragOver,
            onDrop,
            onDragLeave
        };
    },
};
</script>

<style lang="less" scoped>
.uploader {
    display: flex;
}

.card {
    background-color: #fbfdff;
    border: 1px dashed #c0ccda;
    border-radius: 6px;
    width: 148px;
    height: 148px;
    overflow: hidden;
}

.upload-card {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
        border-color: #409eff;
        color: #409eff;
    }
}

.thumbnail-card {
    border: 1px solid #c0ccda;
    position: relative;

    #thumbnail {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: inline;
    }

    .success-label {
        position: absolute;
        right: -15px;
        top: -6px;
        width: 40px;
        height: 24px;
        background: #67c23a;
        text-align: center;
        transform: rotate(45deg);
        box-shadow: 0 0 1pc 1px #0003;

        .success-icon {
            position: absolute;
            left: 13px;
            top: 1px;
            transform: rotate(-45deg);
        }
    }

    #progress {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(255, 255, 255, 0.7);

        :deep(.el-progress-circle) {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }

    .thumbnail-actions {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: all 0.4s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 6px;

        .thumbnail-preview,
        .thumbnail-delete {
            cursor: pointer;
            margin: 0 8px;
            display: inline-block;
        }

        &:hover {
            opacity: 1;
        }
    }
}

:deep(.vel-img) {
    box-shadow: 0 5px 20px 2px rgba(0, 0, 0, 0.35);
}
</style>

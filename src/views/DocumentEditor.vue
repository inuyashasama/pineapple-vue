
<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <MdEditorComponent :title=title></MdEditorComponent>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MdEditorComponent from '@/components/MarkdownEditor.vue';
const title = ref('Markdown 编辑器');

</script>

<style>
body {
  @apply bg-gray-50;
}
</style>


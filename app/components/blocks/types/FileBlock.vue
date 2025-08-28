<template>
  <div class="file-block">
    <div class="text-sm text-gray-500 mb-2">File Block (Coming Soon)</div>
  </div>
</template>

<script setup lang="ts">
import type { FileBlock } from '~/shared/types/blocks'

interface Props {
  block: FileBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<FileBlock>]
  'focus': []
  'blur': []
}>()
</script>
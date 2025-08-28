<template>
  <div class="image-block">
    <div class="text-sm text-gray-500 mb-2">Image Block (Coming Soon)</div>
  </div>
</template>

<script setup lang="ts">
import type { ImageBlock } from '~/shared/types/blocks'

interface Props {
  block: ImageBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<ImageBlock>]
  'focus': []
  'blur': []
}>()
</script>
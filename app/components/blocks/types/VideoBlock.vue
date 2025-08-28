<template>
  <div class="video-block">
    <div class="text-sm text-gray-500 mb-2">
      Video Block (Coming Soon)
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoBlock } from '~/shared/types/blocks'

interface Props {
  block: VideoBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<VideoBlock>]
  focus: []
  blur: []
}>()
</script>

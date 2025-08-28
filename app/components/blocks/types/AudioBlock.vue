<template>
  <div class="audio-block">
    <div class="text-sm text-gray-500 mb-2">Audio Block (Coming Soon)</div>
  </div>
</template>

<script setup lang="ts">
import type { AudioBlock } from '~/shared/types/blocks'

interface Props {
  block: AudioBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<AudioBlock>]
  'focus': []
  'blur': []
}>()
</script>
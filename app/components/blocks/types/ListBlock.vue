<template>
  <div class="list-block">
    <div class="text-sm text-gray-500 mb-2">
      List Block (Coming Soon)
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ListBlock } from '~/shared/types/blocks'

interface Props {
  block: ListBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<ListBlock>]
  focus: []
  blur: []
}>()
</script>

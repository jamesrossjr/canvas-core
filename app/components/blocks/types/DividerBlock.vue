<template>
  <div class="divider-block py-4">
    <hr
      class="border-0 h-px"
      :class="dividerClasses"
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DividerBlock } from '~/shared/types/blocks'

interface Props {
  block: DividerBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<DividerBlock>]
  focus: []
  blur: []
}>()

const dividerClasses = computed(() => {
  const style = props.block.content.style || 'line'
  const baseClasses = 'bg-gray-300 dark:bg-gray-600'

  switch (style) {
    case 'dashed':
      return `${baseClasses} border-dashed border-t`
    case 'dotted':
      return `${baseClasses} border-dotted border-t`
    case 'double':
      return `${baseClasses} border-double border-t-4`
    default:
      return baseClasses
  }
})
</script>

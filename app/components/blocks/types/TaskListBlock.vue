<template>
  <div class="task-list-block">
    <div class="text-sm text-gray-500 mb-2">Task List Block (Coming Soon)</div>
  </div>
</template>

<script setup lang="ts">
import type { TaskListBlock } from '~/shared/types/blocks'

interface Props {
  block: TaskListBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<TaskListBlock>]
  'focus': []
  'blur': []
}>()
</script>
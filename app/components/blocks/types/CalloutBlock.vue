<template>
  <div 
    class="callout-block p-4 rounded-lg border-l-4"
    :class="calloutClasses"
  >
    <div class="flex items-start gap-3">
      <UIcon :name="calloutIcon" class="w-5 h-5 mt-0.5 flex-shrink-0" />
      
      <div class="flex-1">
        <div v-if="block.content.title" class="font-semibold mb-2">
          {{ block.content.title }}
        </div>
        
        <div
          v-if="viewMode === 'edit'"
          ref="editorRef"
          class="callout-editor outline-none"
          contenteditable
          @input="handleInput"
          @focus="$emit('focus')"
          @blur="$emit('blur')"
        >
          {{ block.content.text || '' }}
        </div>
        <div v-else class="callout-preview">
          {{ block.content.text || 'Empty callout' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalloutBlock } from '~/shared/types/blocks'

interface Props {
  block: CalloutBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<CalloutBlock>]
  'focus': []
  'blur': []
}>()

const editorRef = ref<HTMLElement>()

const calloutClasses = computed(() => {
  switch (props.block.content.variant) {
    case 'info':
      return 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
    case 'warning':
      return 'bg-yellow-50 border-yellow-500 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100'
    case 'error':
      return 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-100'
    case 'success':
      return 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-100'
    default:
      return 'bg-gray-50 border-gray-500 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
  }
})

const calloutIcon = computed(() => {
  switch (props.block.content.variant) {
    case 'info':
      return 'i-lucide-info'
    case 'warning':
      return 'i-lucide-alert-triangle'
    case 'error':
      return 'i-lucide-alert-circle'
    case 'success':
      return 'i-lucide-check-circle'
    default:
      return 'i-lucide-message-square'
  }
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  const text = target.textContent || ''
  
  emit('update', {
    content: {
      ...props.block.content,
      text
    }
  })
}
</script>
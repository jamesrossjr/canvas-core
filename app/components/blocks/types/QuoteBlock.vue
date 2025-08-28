<template>
  <div class="quote-block border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2">
    <blockquote class="text-lg text-gray-700 dark:text-gray-300 italic">
      <div
        v-if="viewMode === 'edit'"
        ref="editorRef"
        class="quote-editor outline-none"
        contenteditable
        @input="handleInput"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
      >
        {{ block.content.text || '' }}
      </div>
      <div v-else class="quote-preview">
        {{ block.content.text || 'Empty quote' }}
      </div>
    </blockquote>
    
    <div v-if="block.content.author" class="mt-2 text-sm text-gray-500">
      — {{ block.content.author }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QuoteBlock } from '~/shared/types/blocks'

interface Props {
  block: QuoteBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<QuoteBlock>]
  'focus': []
  'blur': []
}>()

const editorRef = ref<HTMLElement>()

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
<template>
  <div class="text-block">
    <div
      v-if="viewMode === 'edit'"
      ref="editorRef"
      class="text-editor"
      contenteditable
      :class="{
        'text-focused': focused,
        'text-empty': !block.content.text
      }"
      @input="handleInput"
      @keydown="handleKeydown"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @paste="handlePaste"
    >
      {{ block.content.text || '' }}
    </div>

    <div v-else class="text-preview" v-html="formattedText" />

    <!-- Placeholder -->
    <div
      v-if="viewMode === 'edit' && !block.content.text && focused"
      class="text-placeholder"
    >
      Type '/' for commands, or start writing...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { TextBlock } from '~/shared/types/blocks'

interface Props {
  block: TextBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<TextBlock>]
  focus: []
  blur: []
  command: [command: any]
}>()

const editorRef = ref<HTMLElement>()

const formattedText = computed(() => {
  if (!props.block.content.text) return ''

  // Simple markdown-like formatting
  let text = props.block.content.text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')

  return text
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  const text = target.textContent || ''

  // Check for slash commands
  if (text.endsWith('/')) {
    emit('command', { type: 'slash-menu', position: getCursorPosition() })
    return
  }

  // Update block content
  emit('update', {
    content: {
      ...props.block.content,
      text
    }
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  const text = target.textContent || ''

  switch (event.key) {
    case 'Enter':
      if (!event.shiftKey) {
        event.preventDefault()
        if (text.trim()) {
          emit('command', { type: 'create-below' })
        } else {
          // Convert empty paragraph to different block type
          emit('command', { type: 'convert', blockType: 'paragraph' })
        }
      }
      break

    case 'Backspace':
      if (text === '' && getCursorPosition() === 0) {
        event.preventDefault()
        emit('command', { type: 'delete' })
      }
      break

    case '/':
      if (text === '') {
        // Show slash command menu on empty line
        setTimeout(() => {
          emit('command', { type: 'slash-menu', position: getCursorPosition() })
        }, 0)
      }
      break

    case ' ':
      // Handle markdown shortcuts
      if (text.endsWith('#')) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'heading', level: 1 })
      } else if (text.endsWith('##')) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'heading', level: 2 })
      } else if (text.endsWith('###')) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'heading', level: 3 })
      } else if (text.endsWith('>')) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'quote' })
      } else if (text.endsWith('```')) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'code' })
      }
      break
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()

  const paste = event.clipboardData?.getData('text/plain') || ''
  const selection = window.getSelection()

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(paste))

    // Move cursor to end of pasted text
    range.setStartAfter(range.endContainer)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    // Update content
    const target = event.target as HTMLElement
    const text = target.textContent || ''
    emit('update', {
      content: {
        ...props.block.content,
        text
      }
    })
  }
}

const getCursorPosition = (): number => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0

  const range = selection.getRangeAt(0)
  return range.startOffset
}

const focusEditor = () => {
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus()
    }
  })
}

// Watch for focus changes
watch(
  () => props.focused,
  (focused) => {
    if (focused && props.viewMode === 'edit') {
      focusEditor()
    }
  }
)

// Update editor content when block content changes externally
watch(
  () => props.block.content.text,
  (newText) => {
    if (editorRef.value && editorRef.value.textContent !== newText) {
      editorRef.value.textContent = newText || ''
    }
  }
)

defineExpose({ focusEditor })
</script>

<style scoped>
.text-editor {
  @apply outline-none border-0 resize-none w-full min-h-6 leading-relaxed;
  @apply text-gray-900 dark:text-white;
}

.text-editor:focus {
  @apply outline-none ring-0;
}

.text-empty {
  @apply text-gray-400;
}

.text-placeholder {
  @apply absolute inset-0 text-gray-400 pointer-events-none;
  @apply text-sm;
}

.text-preview {
  @apply leading-relaxed text-gray-900 dark:text-white;
}

.text-preview :deep(strong) {
  @apply font-semibold;
}

.text-preview :deep(em) {
  @apply italic;
}

.text-preview :deep(code) {
  @apply font-mono;
}
</style>

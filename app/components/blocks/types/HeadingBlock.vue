<template>
  <div class="heading-block">
    <div v-if="viewMode === 'edit'" class="flex items-center gap-2">
      <!-- Heading Level Selector -->
      <UDropdown
        v-if="focused"
        :items="headingLevels"
        class="heading-level-selector"
      >
        <UButton
          :label="`H${block.content.level}`"
          variant="ghost"
          size="sm"
          class="text-xs font-mono"
        />
      </UDropdown>

      <!-- Editable Heading -->
      <component
        :is="headingTag"
        ref="editorRef"
        class="heading-editor flex-1"
        :class="headingClasses"
        contenteditable
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @paste="handlePaste"
      >
        {{ block.content.text || '' }}
      </component>
    </div>

    <!-- Preview Mode -->
    <component
      :is="headingTag"
      v-else
      :class="headingClasses"
      class="heading-preview"
    >
      {{ block.content.text || 'Untitled Heading' }}
    </component>

    <!-- Placeholder -->
    <div
      v-if="viewMode === 'edit' && !block.content.text && focused"
      class="heading-placeholder"
    >
      Heading {{ block.content.level }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { HeadingBlock } from '~/shared/types/blocks'

interface Props {
  block: HeadingBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<HeadingBlock>]
  focus: []
  blur: []
  command: [command: any]
}>()

const editorRef = ref<HTMLElement>()

const headingTag = computed(() => `h${props.block.content.level}`)

const headingClasses = computed(() => {
  const level = props.block.content.level
  const baseClasses = 'font-bold text-gray-900 dark:text-white leading-tight'

  switch (level) {
    case 1:
      return `${baseClasses} text-3xl`
    case 2:
      return `${baseClasses} text-2xl`
    case 3:
      return `${baseClasses} text-xl`
    case 4:
      return `${baseClasses} text-lg`
    case 5:
      return `${baseClasses} text-base`
    case 6:
      return `${baseClasses} text-sm`
    default:
      return `${baseClasses} text-xl`
  }
})

const headingLevels = computed(() => [
  {
    label: 'Heading 1',
    click: () => updateLevel(1),
    active: props.block.content.level === 1
  },
  {
    label: 'Heading 2',
    click: () => updateLevel(2),
    active: props.block.content.level === 2
  },
  {
    label: 'Heading 3',
    click: () => updateLevel(3),
    active: props.block.content.level === 3
  },
  {
    label: 'Heading 4',
    click: () => updateLevel(4),
    active: props.block.content.level === 4
  },
  {
    label: 'Heading 5',
    click: () => updateLevel(5),
    active: props.block.content.level === 5
  },
  {
    label: 'Heading 6',
    click: () => updateLevel(6),
    active: props.block.content.level === 6
  }
])

const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  const text = target.textContent || ''

  emit('update', {
    content: {
      ...props.block.content,
      text,
      anchor: generateAnchor(text)
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
        emit('command', { type: 'create-below', blockType: 'paragraph' })
      }
      break

    case 'Backspace':
      if (text === '' && getCursorPosition() === 0) {
        event.preventDefault()
        emit('command', { type: 'convert', blockType: 'paragraph' })
      }
      break

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      if (event.altKey) {
        event.preventDefault()
        updateLevel(parseInt(event.key) as 1 | 2 | 3 | 4 | 5 | 6)
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
        text,
        anchor: generateAnchor(text)
      }
    })
  }
}

const updateLevel = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  emit('update', {
    content: {
      ...props.block.content,
      level
    }
  })
}

const generateAnchor = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
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
.heading-editor {
  @apply outline-none border-0 resize-none w-full min-h-8;
}

.heading-editor:focus {
  @apply outline-none ring-0;
}

.heading-placeholder {
  @apply absolute inset-0 text-gray-400 pointer-events-none;
  @apply text-sm;
}

.heading-level-selector {
  @apply flex-shrink-0;
}

/* Heading specific spacing */
.heading-block h1 {
  @apply mb-4 mt-6;
}

.heading-block h2 {
  @apply mb-3 mt-5;
}

.heading-block h3 {
  @apply mb-2 mt-4;
}

.heading-block h4,
.heading-block h5,
.heading-block h6 {
  @apply mb-2 mt-3;
}
</style>

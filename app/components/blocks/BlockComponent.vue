<template>
  <div
    class="block-component"
    :class="{
      'block-selected': selected,
      'block-focused': focused,
      'block-preview': viewMode === 'preview'
    }"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Block Controls -->
    <div
      v-if="viewMode === 'edit' && (focused || selected)"
      class="block-controls"
    >
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-grip-vertical"
          size="xs"
          variant="ghost"
          class="drag-handle cursor-move"
        />
        <UDropdown :items="blockActions">
          <UButton
            icon="i-lucide-more-horizontal"
            size="xs"
            variant="ghost"
          />
        </UDropdown>
      </div>
    </div>

    <!-- Block Content -->
    <div class="block-content" :class="`block-${block.type}`">
      <!-- Text Blocks -->
      <TextBlock
        v-if="block.type === 'text' || block.type === 'paragraph'"
        :block="block as TextBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
        @command="handleCommand"
      />

      <HeadingBlock
        v-else-if="block.type === 'heading'"
        :block="block as HeadingBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
        @command="handleCommand"
      />

      <QuoteBlock
        v-else-if="block.type === 'quote'"
        :block="block as QuoteBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <CalloutBlock
        v-else-if="block.type === 'callout'"
        :block="block as CalloutBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <!-- List Blocks -->
      <ListBlock
        v-else-if="block.type === 'list'"
        :block="block as ListBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <TaskListBlock
        v-else-if="block.type === 'task-list'"
        :block="block as TaskListBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <!-- Code Block -->
      <CodeBlock
        v-else-if="block.type === 'code'"
        :block="block as CodeBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <!-- Media Blocks -->
      <ImageBlock
        v-else-if="block.type === 'image'"
        :block="block as ImageBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <VideoBlock
        v-else-if="block.type === 'video'"
        :block="block as VideoBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <AudioBlock
        v-else-if="block.type === 'audio'"
        :block="block as AudioBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <FileBlock
        v-else-if="block.type === 'file'"
        :block="block as FileBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <!-- Layout Blocks -->
      <DividerBlock
        v-else-if="block.type === 'divider'"
        :block="block as DividerBlock"
        :focused="focused"
        :view-mode="viewMode"
        @update="handleUpdate"
        @focus="$emit('focus', block.id)"
        @blur="$emit('blur', block.id)"
      />

      <!-- Fallback -->
      <div v-else class="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded">
        <p class="text-gray-500 text-sm">
          Unknown block type: {{ block.type }}
        </p>
        <pre class="text-xs mt-2 text-gray-400">{{ JSON.stringify(block.content, null, 2) }}</pre>
      </div>
    </div>

    <!-- Block Footer -->
    <div
      v-if="viewMode === 'edit' && focused"
      class="block-footer mt-2 flex items-center justify-between text-xs text-gray-500"
    >
      <div class="flex items-center gap-4">
        <span>{{ block.type }}</span>
        <span v-if="block.metadata.updatedAt">
          Updated {{ formatTime(block.metadata.updatedAt) }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          size="xs"
          variant="ghost"
          @click="$emit('create-below', block.id)"
        />
        <UButton
          icon="i-lucide-settings"
          size="xs"
          variant="ghost"
          @click="showSettings = true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  Block,
  TextBlock,
  HeadingBlock,
  QuoteBlock,
  CalloutBlock,
  ListBlock,
  TaskListBlock,
  CodeBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  FileBlock,
  DividerBlock
} from '~/shared/types/blocks'

interface Props {
  block: Block
  index: number
  selected: boolean
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [blockId: string, updates: Partial<Block>]
  'delete': [blockId: string]
  'duplicate': [blockId: string]
  'focus': [blockId: string]
  'blur': [blockId: string]
  'select': [blockId: string, multi?: boolean]
  'move-up': [blockId: string]
  'move-down': [blockId: string]
  'create-above': [blockId: string]
  'create-below': [blockId: string]
  'convert': [blockId: string, newType: string]
}>()

const showSettings = ref(false)

const blockActions = computed(() => [
  {
    label: 'Duplicate',
    icon: 'i-lucide-copy',
    click: () => emit('duplicate', props.block.id)
  },
  {
    label: 'Move up',
    icon: 'i-lucide-arrow-up',
    click: () => emit('move-up', props.block.id),
    disabled: props.index === 0
  },
  {
    label: 'Move down',
    icon: 'i-lucide-arrow-down',
    click: () => emit('move-down', props.block.id)
  },
  {
    label: 'Add above',
    icon: 'i-lucide-plus',
    click: () => emit('create-above', props.block.id)
  },
  {
    label: 'Add below',
    icon: 'i-lucide-plus',
    click: () => emit('create-below', props.block.id)
  },
  {
    label: 'Convert to...',
    icon: 'i-lucide-repeat',
    children: [
      {
        label: 'Paragraph',
        click: () => emit('convert', props.block.id, 'paragraph')
      },
      {
        label: 'Heading 1',
        click: () => emit('convert', props.block.id, 'heading')
      },
      {
        label: 'Quote',
        click: () => emit('convert', props.block.id, 'quote')
      },
      {
        label: 'Code',
        click: () => emit('convert', props.block.id, 'code')
      }
    ]
  },
  {
    label: 'Delete',
    icon: 'i-lucide-trash-2',
    click: () => emit('delete', props.block.id),
    class: 'text-red-500'
  }
])

const handleClick = (event: Event) => {
  const isMultiSelect = event.metaKey || event.ctrlKey
  emit('select', props.block.id, isMultiSelect)
}

const handleUpdate = (updates: Partial<Block>) => {
  emit('update', props.block.id, updates)
}

const handleCommand = (command: any) => {
  switch (command.type) {
    case 'create-below':
      emit('create-below', props.block.id)
      break
    case 'convert':
      emit('convert', props.block.id, command.blockType)
      break
    case 'delete':
      emit('delete', props.block.id)
      break
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.focused) return

  switch (event.key) {
    case 'Enter':
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault()
        emit('create-below', props.block.id)
      }
      break
    case 'Backspace':
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault()
        emit('delete', props.block.id)
      }
      break
    case 'ArrowUp':
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault()
        emit('move-up', props.block.id)
      }
      break
    case 'ArrowDown':
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault()
        emit('move-down', props.block.id)
      }
      break
  }
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
</script>

<style scoped>
.block-component {
  @apply relative group transition-all duration-200;
}

.block-component:hover {
  @apply bg-gray-50 dark:bg-gray-900/50 rounded-lg;
}

.block-selected {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg;
}

.block-focused {
  @apply ring-2 ring-blue-500 ring-opacity-50 rounded-lg;
}

.block-controls {
  @apply absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity;
}

.block-content {
  @apply relative;
}

.block-footer {
  @apply border-t border-gray-200 dark:border-gray-800 pt-2;
}

/* Block type specific styles */
.block-paragraph,
.block-text {
  @apply py-1;
}

.block-heading {
  @apply py-2;
}

.block-code {
  @apply my-2;
}

.block-quote {
  @apply py-2 border-l-4 border-gray-300 dark:border-gray-700 pl-4;
}

.block-callout {
  @apply p-4 rounded-lg;
}

.block-divider {
  @apply my-4;
}
</style>

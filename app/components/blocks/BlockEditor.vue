<template>
  <div ref="editorRef" class="block-editor">
    <!-- Editor Header -->
    <div v-if="showHeader" class="editor-header border-b border-gray-200 dark:border-gray-800 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 v-if="document?.title" class="text-xl font-semibold">
            {{ document.title }}
          </h1>
          <input
            v-else
            v-model="documentTitle"
            class="text-xl font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
            placeholder="Untitled Document"
            @blur="updateDocumentTitle"
          >
        </div>

        <div class="flex items-center gap-2">
          <!-- Template Selector -->
          <UButton
            icon="i-lucide-layout-template"
            variant="ghost"
            size="sm"
            @click="showTemplates = true"
          >
            Templates
          </UButton>

          <!-- View Toggle -->
          <UButtonGroup size="sm">
            <UButton
              :variant="viewMode === 'edit' ? 'solid' : 'ghost'"
              icon="i-lucide-edit"
              @click="viewMode = 'edit'"
            >
              Edit
            </UButton>
            <UButton
              :variant="viewMode === 'preview' ? 'solid' : 'ghost'"
              icon="i-lucide-eye"
              @click="viewMode = 'preview'"
            >
              Preview
            </UButton>
          </UButtonGroup>
        </div>
      </div>
    </div>

    <!-- Blocks Container -->
    <div
      class="blocks-container p-4 min-h-screen"
      :class="{
        'preview-mode': viewMode === 'preview',
        'edit-mode': viewMode === 'edit'
      }"
      @click="handleContainerClick"
    >
      <!-- Empty State -->
      <div v-if="!blocks.length" class="empty-state">
        <div class="text-center py-12">
          <UIcon name="i-lucide-file-plus" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Start creating
          </h3>
          <p class="text-gray-500 mb-4">
            Press '/' to see available blocks or start typing
          </p>
          <UButton variant="outline" @click="createBlock('paragraph', 0)">
            Add your first block
          </UButton>
        </div>
      </div>

      <!-- Block List -->
      <div v-else class="blocks-list space-y-2">
        <BlockComponent
          v-for="(block, index) in sortedBlocks"
          :key="block.id"
          :block="block"
          :index="index"
          :selected="selectedBlocks.includes(block.id)"
          :focused="focusedBlockId === block.id"
          :view-mode="viewMode"
          @update="updateBlock"
          @delete="deleteBlock"
          @duplicate="duplicateBlock"
          @focus="focusBlock"
          @blur="blurBlock"
          @select="selectBlock"
          @move-up="moveBlockUp"
          @move-down="moveBlockDown"
          @create-above="createBlockAbove"
          @create-below="createBlockBelow"
          @convert="convertBlock"
        />
      </div>

      <!-- Add Block Button -->
      <div v-if="blocks.length" class="mt-4">
        <UButton
          icon="i-lucide-plus"
          variant="ghost"
          class="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          @click="createBlock('paragraph', blocks.length)"
        >
          Add block
        </UButton>
      </div>
    </div>

    <!-- Slash Command Menu -->
    <SlashCommandMenu
      v-if="showSlashMenu"
      :position="slashMenuPosition"
      :query="slashQuery"
      @select="handleSlashCommand"
      @close="closeSlashMenu"
    />

    <!-- Template Picker -->
    <TemplatePicker
      v-model="showTemplates"
      @select="applyTemplate"
    />

    <!-- Block Settings Panel -->
    <BlockSettingsPanel
      v-if="showSettings && selectedBlocks.length === 1"
      :block="getBlockById(selectedBlocks[0])"
      @update="updateBlock"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Block, Document, BlockType, BlockPosition } from '~/shared/types/blocks'

interface Props {
  document?: Document
  collaborative?: boolean
  readOnly?: boolean
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collaborative: false,
  readOnly: false,
  showHeader: true
})

const emit = defineEmits<{
  'update:document': [document: Document]
  'block-created': [block: Block]
  'block-updated': [block: Block]
  'block-deleted': [blockId: string]
}>()

// Reactive state
const editorRef = ref<HTMLElement>()
const blocks = ref<Block[]>(props.document?.blocks || [])
const documentTitle = ref(props.document?.title || '')
const viewMode = ref<'edit' | 'preview'>('edit')
const selectedBlocks = ref<string[]>([])
const focusedBlockId = ref<string | null>(null)
const showSlashMenu = ref(false)
const slashMenuPosition = ref({ x: 0, y: 0 })
const slashQuery = ref('')
const showTemplates = ref(false)
const showSettings = ref(false)

// Computed
const sortedBlocks = computed(() => {
  return [...blocks.value].sort((a, b) => a.position.order - b.position.order)
})

// Block Management
const createBlock = (type: BlockType, position: number, content?: any) => {
  const newBlock: Block = {
    id: generateId(),
    type,
    content: content || getDefaultContent(type),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user', // TODO: Get from auth
      version: 1
    },
    position: {
      order: position
    },
    workspaceId: props.document?.workspaceId || 'default',
    documentId: props.document?.id
  } as Block

  // Adjust positions of existing blocks
  blocks.value.forEach((block) => {
    if (block.position.order >= position) {
      block.position.order++
    }
  })

  blocks.value.push(newBlock)
  emit('block-created', newBlock)

  // Focus the new block
  nextTick(() => {
    focusBlock(newBlock.id)
  })

  return newBlock
}

const updateBlock = (blockId: string, updates: Partial<Block>) => {
  const blockIndex = blocks.value.findIndex(b => b.id === blockId)
  if (blockIndex === -1) return

  const updatedBlock = {
    ...blocks.value[blockIndex],
    ...updates,
    metadata: {
      ...blocks.value[blockIndex].metadata,
      updatedAt: new Date().toISOString(),
      version: blocks.value[blockIndex].metadata.version + 1
    }
  }

  blocks.value[blockIndex] = updatedBlock
  emit('block-updated', updatedBlock)
}

const deleteBlock = (blockId: string) => {
  const blockIndex = blocks.value.findIndex(b => b.id === blockId)
  if (blockIndex === -1) return

  const deletedBlock = blocks.value[blockIndex]
  blocks.value.splice(blockIndex, 1)

  // Adjust positions
  blocks.value.forEach((block) => {
    if (block.position.order > deletedBlock.position.order) {
      block.position.order--
    }
  })

  emit('block-deleted', blockId)

  // Clear selection if deleted block was selected
  selectedBlocks.value = selectedBlocks.value.filter(id => id !== blockId)
  if (focusedBlockId.value === blockId) {
    focusedBlockId.value = null
  }
}

const duplicateBlock = (blockId: string) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const duplicatedBlock = {
    ...block,
    id: generateId(),
    metadata: {
      ...block.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }
  }

  createBlock(duplicatedBlock.type, block.position.order + 1, duplicatedBlock.content)
}

// Block Navigation
const moveBlockUp = (blockId: string) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block || block.position.order === 0) return

  const targetOrder = block.position.order - 1
  const targetBlock = blocks.value.find(b => b.position.order === targetOrder)

  if (targetBlock) {
    targetBlock.position.order++
    block.position.order--
  }
}

const moveBlockDown = (blockId: string) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block || block.position.order === blocks.value.length - 1) return

  const targetOrder = block.position.order + 1
  const targetBlock = blocks.value.find(b => b.position.order === targetOrder)

  if (targetBlock) {
    targetBlock.position.order--
    block.position.order++
  }
}

const createBlockAbove = (blockId: string, type: BlockType = 'paragraph') => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  createBlock(type, block.position.order)
}

const createBlockBelow = (blockId: string, type: BlockType = 'paragraph') => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  createBlock(type, block.position.order + 1)
}

const convertBlock = (blockId: string, newType: BlockType) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const newContent = convertBlockContent(block, newType)
  updateBlock(blockId, { type: newType, content: newContent })
}

// Selection and Focus
const focusBlock = (blockId: string) => {
  focusedBlockId.value = blockId
}

const blurBlock = (blockId: string) => {
  if (focusedBlockId.value === blockId) {
    focusedBlockId.value = null
  }
}

const selectBlock = (blockId: string, multi = false) => {
  if (multi) {
    if (selectedBlocks.value.includes(blockId)) {
      selectedBlocks.value = selectedBlocks.value.filter(id => id !== blockId)
    } else {
      selectedBlocks.value.push(blockId)
    }
  } else {
    selectedBlocks.value = [blockId]
  }
}

// Slash Commands
const handleSlashCommand = (command: any) => {
  if (focusedBlockId.value) {
    createBlockBelow(focusedBlockId.value, command.type)
  } else {
    createBlock(command.type, blocks.value.length)
  }
  closeSlashMenu()
}

const closeSlashMenu = () => {
  showSlashMenu.value = false
  slashQuery.value = ''
}

// Templates
const applyTemplate = (template: any) => {
  // Clear existing blocks
  blocks.value = []

  // Add template blocks
  template.blocks.forEach((templateBlock: any, index: number) => {
    createBlock(templateBlock.type, index, templateBlock.content)
  })

  showTemplates.value = false
}

// Document Management
const updateDocumentTitle = () => {
  if (props.document) {
    const updatedDocument = {
      ...props.document,
      title: documentTitle.value || 'Untitled Document'
    }
    emit('update:document', updatedDocument)
  }
}

// Utility Functions
const generateId = () => {
  return 'block_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

const getDefaultContent = (type: BlockType): any => {
  switch (type) {
    case 'paragraph':
    case 'text':
      return { text: '' }
    case 'heading':
      return { text: '', level: 1 }
    case 'list':
      return { items: [{ id: generateId(), text: '', level: 0 }], ordered: false }
    case 'code':
      return { code: '', language: 'javascript' }
    case 'quote':
      return { text: '' }
    case 'callout':
      return { text: '', variant: 'info' }
    case 'divider':
      return { style: 'line' }
    default:
      return {}
  }
}

const convertBlockContent = (block: Block, newType: BlockType): any => {
  // Basic content conversion logic
  switch (newType) {
    case 'paragraph':
      return { text: extractTextFromBlock(block) }
    case 'heading':
      return { text: extractTextFromBlock(block), level: 1 }
    case 'quote':
      return { text: extractTextFromBlock(block) }
    default:
      return getDefaultContent(newType)
  }
}

const extractTextFromBlock = (block: Block): string => {
  if ('text' in block.content) {
    return block.content.text
  }
  return ''
}

const getBlockById = (id: string): Block | undefined => {
  return blocks.value.find(b => b.id === id)
}

const handleContainerClick = (event: Event) => {
  // Clear selection when clicking on empty space
  if (event.target === event.currentTarget) {
    selectedBlocks.value = []
    focusedBlockId.value = null
  }
}

// Keyboard Shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Global editor shortcuts
  if (event.metaKey || event.ctrlKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        selectedBlocks.value = blocks.value.map(b => b.id)
        break
      case 'z':
        event.preventDefault()
        // TODO: Implement undo
        break
      case 's':
        event.preventDefault()
        // TODO: Implement save
        break
    }
  }

  // Delete selected blocks
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedBlocks.value.length > 0 && !focusedBlockId.value) {
      event.preventDefault()
      selectedBlocks.value.forEach(blockId => deleteBlock(blockId))
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for document changes
watch(
  () => props.document,
  (newDocument) => {
    if (newDocument) {
      blocks.value = [...newDocument.blocks]
      documentTitle.value = newDocument.title
    }
  },
  { deep: true }
)

// Watch blocks and emit document updates
watch(
  blocks,
  (newBlocks) => {
    if (props.document) {
      const updatedDocument: Document = {
        ...props.document,
        blocks: [...newBlocks],
        metadata: {
          ...props.document.metadata,
          updatedAt: new Date().toISOString()
        }
      }
      emit('update:document', updatedDocument)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.block-editor {
  @apply flex flex-col h-full;
}

.blocks-container {
  @apply flex-1 overflow-y-auto;
}

.blocks-container.preview-mode {
  @apply pointer-events-none;
}

.blocks-container.edit-mode {
  @apply pointer-events-auto;
}

.blocks-list {
  @apply max-w-4xl mx-auto;
}

.empty-state {
  @apply flex items-center justify-center h-full min-h-96;
}
</style>
